import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember } from '../types/index.js';
import type { AccessRequest } from '../types/auth.js';

export const authService = {
  /** Lie auth.users → family_members après connexion */
  async syncMember(userId: string, email: string, metadata?: Record<string, unknown>): Promise<FamilyMember> {
    // Déjà lié ?
    const { data: existing } = await supabase
      .from('family_members')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (existing) return existing;

    // Via metadata member_id (envoyé à l'invitation)
    const memberId = metadata?.member_id as string | undefined;
    if (memberId) {
      return this.linkMember(memberId, userId, email);
    }

    // Via invite_email
    const { data: byEmail } = await supabase
      .from('family_members')
      .select('*')
      .eq('invite_email', email.toLowerCase())
      .maybeSingle();

    if (byEmail) {
      return this.linkMember(byEmail.id, userId, email);
    }

    throw new AppError(
      403,
      'Aucun profil famille associé à ce compte. Contactez un administrateur.',
      'NOT_LINKED',
    );
  },

  async linkMember(memberId: string, userId: string, email: string): Promise<FamilyMember> {
    const { data: member, error: fetchError } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (fetchError || !member) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');

    if (member.auth_user_id && member.auth_user_id !== userId) {
      throw new AppError(409, 'Ce profil est déjà lié à un autre compte', 'ALREADY_LINKED');
    }

    const { data, error } = await supabase
      .from('family_members')
      .update({
        auth_user_id: userId,
        invite_email: null,
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    // Marquer la demande d'accès comme approuvée si elle existe
    await supabase
      .from('access_requests')
      .update({ status: 'approved' })
      .eq('email', email.toLowerCase())
      .eq('status', 'pending');

    return data;
  },

  /** Admin : invite un membre par email (crée le compte Supabase) */
  async inviteMember(memberId: string, email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    const { data: member, error: fetchError } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (fetchError || !member) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');

    if (member.auth_user_id) {
      throw new AppError(409, 'Ce membre a déjà un compte actif', 'ALREADY_LINKED');
    }

    // Vérifier que l'email n'est pas déjà pris
    const { data: emailTaken } = await supabase
      .from('family_members')
      .select('id')
      .eq('invite_email', normalizedEmail)
      .neq('id', memberId)
      .maybeSingle();

    if (emailTaken) {
      throw new AppError(409, 'Cet email est déjà associé à un autre membre', 'EMAIL_TAKEN');
    }

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: `${env.appUrl}/login`,
      data: { member_id: memberId },
    });

    if (inviteError) throw new AppError(400, inviteError.message, 'INVITE_ERROR');

    await supabase
      .from('family_members')
      .update({ invite_email: normalizedEmail })
      .eq('id', memberId);

    return {
      message: `Invitation envoyée à ${normalizedEmail} pour ${member.first_name} ${member.last_name}`,
    };
  },

  async getMe(userId: string): Promise<FamilyMember | null> {
    const { data } = await supabase
      .from('family_members')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();

    return data;
  },

  /** Demande d'accès publique — crée aussi le compte Supabase (inactif jusqu'à approbation) */
  async createAccessRequest(input: {
    first_name: string;
    last_name?: string;
    email: string;
    message?: string;
    password: string;
  }): Promise<AccessRequest> {
    const email = input.email.toLowerCase().trim();
    const password = input.password;

    if (password.length < 8) {
      throw new AppError(400, 'Le mot de passe doit contenir au moins 8 caractères', 'VALIDATION');
    }

    const { data: alreadyInvited } = await supabase
      .from('family_members')
      .select('id')
      .eq('invite_email', email)
      .maybeSingle();

    if (alreadyInvited) {
      throw new AppError(409, 'Une invitation est déjà en cours pour cet email', 'ALREADY_INVITED');
    }

    const { data: pending } = await supabase
      .from('access_requests')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (pending) {
      throw new AppError(409, 'Une demande est déjà en attente pour cet email', 'REQUEST_PENDING');
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        first_name: input.first_name,
        last_name: input.last_name ?? 'Arbey',
      },
    });

    if (authError || !authData.user) {
      const message = authError?.message ?? 'Impossible de créer le compte';
      if (/already|registered|exists/i.test(message)) {
        throw new AppError(409, 'Un compte existe déjà avec cet email', 'EMAIL_TAKEN');
      }
      throw new AppError(400, message, 'AUTH_ERROR');
    }

    const { data, error } = await supabase
      .from('access_requests')
      .insert({
        first_name: input.first_name,
        last_name: input.last_name ?? 'Arbey',
        email,
        message: input.message,
        auth_user_id: authData.user.id,
      })
      .select()
      .single();

    if (error) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new AppError(400, error.message, 'DB_ERROR');
    }

    return data;
  },

  /** Approuve une demande — active le compte déjà créé et lie le profil famille */
  async approveAccessRequest(
    requestId: string,
    memberId: string,
    reviewerId: string,
  ): Promise<{ message: string }> {
    const { data: request, error: fetchError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .maybeSingle();

    if (fetchError) throw new AppError(500, fetchError.message, 'DB_ERROR');
    if (!request) throw new AppError(404, 'Demande introuvable', 'NOT_FOUND');

    if (request.auth_user_id) {
      await this.linkMember(memberId, request.auth_user_id, request.email);

      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        request.auth_user_id,
        { email_confirm: true },
      );

      if (confirmError) throw new AppError(500, confirmError.message, 'AUTH_ERROR');

      const { error: updateError } = await supabase
        .from('access_requests')
        .update({ status: 'approved', reviewed_by: reviewerId })
        .eq('id', requestId);

      if (updateError) throw new AppError(500, updateError.message, 'DB_ERROR');

      return {
        message: `${request.first_name} peut maintenant se connecter avec son email et le mot de passe choisi.`,
      };
    }

    const result = await this.inviteMember(memberId, request.email);

    await supabase
      .from('access_requests')
      .update({ status: 'approved', reviewed_by: reviewerId })
      .eq('id', requestId);

    return result;
  },

  async listAccessRequests(): Promise<AccessRequest[]> {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return data ?? [];
  },

  async rejectAccessRequest(requestId: string, reviewerId: string): Promise<void> {
    const { data: request } = await supabase
      .from('access_requests')
      .select('auth_user_id')
      .eq('id', requestId)
      .maybeSingle();

    const { error } = await supabase
      .from('access_requests')
      .update({ status: 'rejected', reviewed_by: reviewerId })
      .eq('id', requestId);

    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    if (request?.auth_user_id) {
      await supabase.auth.admin.deleteUser(request.auth_user_id);
    }
  },
};
