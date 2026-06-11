import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember } from '../types/index.js';
import type {
  GuestInviteInfo,
  InviteEmailResult,
  ParticipantStatus,
  SecretSantaAssignment,
  SecretSantaGroup,
  SecretSantaGroupDetail,
  SecretSantaGroupSummary,
  SecretSantaParticipant,
  SecretSantaParticipantView,
} from '../types/secretSanta.js';
import { drawAssignments, SECRET_SANTA_MIN_PARTICIPANTS } from './secretSantaDraw.js';
import { emailService } from './emailService.js';
import type { InviteMemberResult } from '../types/secretSanta.js';

function memberDisplayName(m: Pick<FamilyMember, 'first_name' | 'last_name'>): string {
  return `${m.first_name} ${m.last_name}`;
}

function toParticipantView(p: SecretSantaParticipant): SecretSantaParticipantView {
  return {
    id: p.id,
    display_name: p.display_name,
    status: p.status,
    is_creator: p.is_creator,
    is_external: p.member_id === null,
    member_id: p.member_id,
  };
}

function inviteLink(token: string): string {
  return `${env.appUrl}/secret-santa/invite/${token}`;
}

async function resolveMemberEmail(memberId: string): Promise<string | null> {
  const { data: row } = await supabase
    .from('family_members')
    .select('auth_user_id, invite_email')
    .eq('id', memberId)
    .maybeSingle();

  if (!row) return null;
  if (row.invite_email) return row.invite_email.toLowerCase();

  if (row.auth_user_id) {
    const { data: userData } = await supabase.auth.admin.getUserById(row.auth_user_id);
    return userData?.user?.email?.toLowerCase() ?? null;
  }

  return null;
}

async function getGroupOrThrow(groupId: string): Promise<SecretSantaGroup> {
  const { data, error } = await supabase
    .from('secret_santa_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error || !data) throw new AppError(404, 'Secret Santa introuvable', 'NOT_FOUND');
  return data;
}

async function getParticipants(groupId: string): Promise<SecretSantaParticipant[]> {
  const { data, error } = await supabase
    .from('secret_santa_participants')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at');

  if (error) throw new AppError(500, error.message, 'DB_ERROR');
  return data ?? [];
}

async function findMyParticipant(
  groupId: string,
  memberId: string,
): Promise<SecretSantaParticipant | null> {
  const { data } = await supabase
    .from('secret_santa_participants')
    .select('*')
    .eq('group_id', groupId)
    .eq('member_id', memberId)
    .maybeSingle();

  return data;
}

async function assertGroupAccess(groupId: string, member: FamilyMember): Promise<{
  group: SecretSantaGroup;
  me: SecretSantaParticipant | null;
}> {
  const group = await getGroupOrThrow(groupId);
  const me = await findMyParticipant(groupId, member.id);
  const isCreator = group.created_by === member.id;

  if (!isCreator && !me) {
    throw new AppError(403, 'Accès non autorisé à ce Secret Santa', 'FORBIDDEN');
  }

  return { group, me };
}

export const secretSantaService = {
  async createGroup(
    member: FamilyMember,
    input: { title: string; budget?: string },
  ): Promise<SecretSantaGroupDetail> {
    const title = input.title?.trim();
    if (!title) throw new AppError(400, 'Titre requis', 'VALIDATION');

    const { data: group, error: groupError } = await supabase
      .from('secret_santa_groups')
      .insert({
        title,
        budget: input.budget?.trim() || null,
        created_by: member.id,
      })
      .select()
      .single();

    if (groupError) throw new AppError(500, groupError.message, 'DB_ERROR');

    const { error: participantError } = await supabase.from('secret_santa_participants').insert({
      group_id: group.id,
      member_id: member.id,
      display_name: memberDisplayName(member),
      status: 'accepted',
      is_creator: true,
      responded_at: new Date().toISOString(),
    });

    if (participantError) throw new AppError(500, participantError.message, 'DB_ERROR');

    return this.getGroupDetail(group.id, member);
  },

  async listMyGroups(member: FamilyMember): Promise<SecretSantaGroupSummary[]> {
    const { data: asParticipant, error: pError } = await supabase
      .from('secret_santa_participants')
      .select('group_id, status')
      .eq('member_id', member.id);

    if (pError) throw new AppError(500, pError.message, 'DB_ERROR');

    const { data: asCreator, error: cError } = await supabase
      .from('secret_santa_groups')
      .select('id')
      .eq('created_by', member.id);

    if (cError) throw new AppError(500, cError.message, 'DB_ERROR');

    const groupIds = [
      ...new Set([
        ...(asParticipant?.map((p) => p.group_id) ?? []),
        ...(asCreator?.map((g) => g.id) ?? []),
      ]),
    ];

    if (groupIds.length === 0) return [];

    const { data: groups, error: gError } = await supabase
      .from('secret_santa_groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    if (gError) throw new AppError(500, gError.message, 'DB_ERROR');

    const statusByGroup = new Map(
      (asParticipant ?? []).map((p) => [p.group_id, p.status as ParticipantStatus]),
    );

    const summaries: SecretSantaGroupSummary[] = [];

    for (const group of groups ?? []) {
      const participants = await getParticipants(group.id);
      summaries.push({
        ...group,
        participant_count: participants.length,
        accepted_count: participants.filter((p) => p.status === 'accepted').length,
        is_creator: group.created_by === member.id,
        my_status: statusByGroup.get(group.id) ?? null,
      });
    }

    return summaries;
  },

  async getGroupDetail(groupId: string, member: FamilyMember): Promise<SecretSantaGroupDetail> {
    const { group, me } = await assertGroupAccess(groupId, member);
    const participants = await getParticipants(groupId);

    return {
      ...group,
      is_creator: group.created_by === member.id,
      my_participant_id: me?.id ?? null,
      my_status: me?.status ?? null,
      participants: participants.map(toParticipantView),
    };
  },

  async inviteMember(
    groupId: string,
    member: FamilyMember,
    memberId: string,
  ): Promise<InviteMemberResult> {
    const { group } = await assertGroupAccess(groupId, member);
    if (group.created_by !== member.id) {
      throw new AppError(403, 'Seul le créateur peut inviter', 'FORBIDDEN');
    }
    if (group.status === 'drawn') {
      throw new AppError(400, 'Tirage déjà effectué', 'ALREADY_DRAWN');
    }

    const { data: invited, error: fetchError } = await supabase
      .from('family_members')
      .select('id, first_name, last_name')
      .eq('id', memberId)
      .single();

    if (fetchError || !invited) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');
    if (memberId === member.id) {
      throw new AppError(400, 'Tu participes déjà en tant que créateur', 'VALIDATION');
    }

    const { data: existing } = await supabase
      .from('secret_santa_participants')
      .select('id')
      .eq('group_id', groupId)
      .eq('member_id', memberId)
      .maybeSingle();

    if (existing) throw new AppError(409, 'Ce membre est déjà invité', 'DUPLICATE');

    const { data: participant, error } = await supabase
      .from('secret_santa_participants')
      .insert({
        group_id: groupId,
        member_id: memberId,
        display_name: memberDisplayName(invited),
        status: 'invited',
      })
      .select()
      .single();

    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    const recipientEmail = await resolveMemberEmail(memberId);
    let email_sent = false;
    let email_message: string | undefined;

    if (!recipientEmail) {
      email_message =
        'Invitation enregistrée — pas d\'email connu pour ce membre (il verra l\'invitation en se connectant).';
    } else {
      email_sent = await emailService.sendSecretSantaFamilyInvite({
        to: recipientEmail,
        inviteeName: invited.first_name,
        creatorName: memberDisplayName(member),
        groupTitle: group.title,
        budget: group.budget,
        appUrl: env.appUrl,
      });
      email_message = email_sent
        ? `Email envoyé à ${recipientEmail}`
        : emailService.isConfigured()
          ? 'Invitation enregistrée — l\'email n\'a pas pu être envoyé'
          : 'Invitation enregistrée — configure RESEND_API_KEY pour envoyer des emails';
    }

    return {
      participant: toParticipantView(participant),
      email_sent,
      email_message,
    };
  },

  async inviteEmail(
    groupId: string,
    member: FamilyMember,
    input: { email: string; displayName: string },
  ): Promise<InviteEmailResult> {
    const { group } = await assertGroupAccess(groupId, member);
    if (group.created_by !== member.id) {
      throw new AppError(403, 'Seul le créateur peut inviter', 'FORBIDDEN');
    }
    if (group.status === 'drawn') {
      throw new AppError(400, 'Tirage déjà effectué', 'ALREADY_DRAWN');
    }

    const email = input.email.toLowerCase().trim();
    const displayName = input.displayName.trim();
    if (!email || !displayName) {
      throw new AppError(400, 'Email et prénom requis', 'VALIDATION');
    }

    const { data: existing } = await supabase
      .from('secret_santa_participants')
      .select('id')
      .eq('group_id', groupId)
      .eq('email', email)
      .maybeSingle();

    if (existing) throw new AppError(409, 'Cet email est déjà invité', 'DUPLICATE');

    const { data: participant, error } = await supabase
      .from('secret_santa_participants')
      .insert({
        group_id: groupId,
        email,
        display_name: displayName,
        status: 'invited',
      })
      .select()
      .single();

    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    const link = inviteLink(participant.invite_token!);
    const email_sent = await emailService.sendSecretSantaExternalInvite({
      to: email,
      inviteeName: displayName,
      creatorName: memberDisplayName(member),
      groupTitle: group.title,
      budget: group.budget,
      inviteLink: link,
    });

    return {
      participant: toParticipantView(participant),
      invite_link: link,
      email_sent,
      email_message: email_sent
        ? `Email envoyé à ${email}`
        : emailService.isConfigured()
          ? 'Invitation créée — l\'email n\'a pas pu être envoyé (lien copiable ci-dessous)'
          : 'Invitation créée — configure RESEND_API_KEY pour envoyer des emails',
    };
  },

  async respond(
    groupId: string,
    member: FamilyMember,
    status: 'accepted' | 'declined',
  ): Promise<SecretSantaParticipantView> {
    const { group, me } = await assertGroupAccess(groupId, member);
    if (!me || me.is_creator) {
      throw new AppError(400, 'Invitation introuvable', 'NOT_FOUND');
    }
    if (group.status === 'drawn') {
      throw new AppError(400, 'Tirage déjà effectué', 'ALREADY_DRAWN');
    }

    const { data, error } = await supabase
      .from('secret_santa_participants')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', me.id)
      .select()
      .single();

    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return toParticipantView(data);
  },

  async draw(groupId: string, member: FamilyMember): Promise<SecretSantaGroupDetail> {
    const { group } = await assertGroupAccess(groupId, member);
    if (group.created_by !== member.id) {
      throw new AppError(403, 'Seul le créateur peut lancer le tirage', 'FORBIDDEN');
    }
    if (group.status === 'drawn') {
      throw new AppError(400, 'Tirage déjà effectué', 'ALREADY_DRAWN');
    }

    const participants = await getParticipants(groupId);
    const accepted = participants.filter((p) => p.status === 'accepted');

    if (accepted.length < SECRET_SANTA_MIN_PARTICIPANTS) {
      throw new AppError(
        400,
        `Il faut au moins ${SECRET_SANTA_MIN_PARTICIPANTS} participants ayant accepté`,
        'NOT_ENOUGH_PARTICIPANTS',
      );
    }

    const assignments = drawAssignments(accepted.map((p) => p.id));

    const { error: pairsError } = await supabase.from('secret_santa_pairs').insert(
      assignments.map((a) => ({
        group_id: groupId,
        giver_participant_id: a.giverId,
        receiver_participant_id: a.receiverId,
      })),
    );

    if (pairsError) throw new AppError(500, pairsError.message, 'DB_ERROR');

    const { error: updateError } = await supabase
      .from('secret_santa_groups')
      .update({ status: 'drawn', drawn_at: new Date().toISOString() })
      .eq('id', groupId);

    if (updateError) throw new AppError(500, updateError.message, 'DB_ERROR');

    return this.getGroupDetail(groupId, member);
  },

  async getMyAssignment(
    groupId: string,
    member: FamilyMember,
  ): Promise<SecretSantaAssignment> {
    const { group, me } = await assertGroupAccess(groupId, member);
    if (!me || me.status !== 'accepted') {
      throw new AppError(403, 'Tu ne participes pas à ce tirage', 'FORBIDDEN');
    }
    if (group.status !== 'drawn') {
      throw new AppError(400, 'Le tirage n\'a pas encore eu lieu', 'NOT_DRAWN');
    }

    return this.assignmentForParticipant(groupId, me.id);
  },

  async assignmentForParticipant(
    groupId: string,
    participantId: string,
  ): Promise<SecretSantaAssignment> {
    const participants = await getParticipants(groupId);
    const accepted = participants.filter((p) => p.status === 'accepted');

    const { data: pair, error } = await supabase
      .from('secret_santa_pairs')
      .select('receiver_participant_id')
      .eq('group_id', groupId)
      .eq('giver_participant_id', participantId)
      .single();

    if (error || !pair) throw new AppError(404, 'Tirage introuvable', 'NOT_FOUND');

    const receiver = accepted.find((p) => p.id === pair.receiver_participant_id);
    if (!receiver) throw new AppError(500, 'Destinataire introuvable', 'INTERNAL_ERROR');

    const giver = participants.find((p) => p.id === participantId);

    return {
      receiver_display_name: receiver.display_name,
      participant_names: accepted.map((p) => p.display_name),
      revealed: Boolean(giver?.revealed_at),
    };
  },

  async confirmReveal(groupId: string, member: FamilyMember): Promise<SecretSantaAssignment> {
    const { group, me } = await assertGroupAccess(groupId, member);
    if (!me || me.status !== 'accepted') {
      throw new AppError(403, 'Tu ne participes pas à ce tirage', 'FORBIDDEN');
    }
    if (group.status !== 'drawn') {
      throw new AppError(400, 'Le tirage n\'a pas encore eu lieu', 'NOT_DRAWN');
    }

    if (!me.revealed_at) {
      const { error } = await supabase
        .from('secret_santa_participants')
        .update({ revealed_at: new Date().toISOString() })
        .eq('id', me.id);

      if (error) throw new AppError(500, error.message, 'DB_ERROR');
    }

    return this.assignmentForParticipant(groupId, me.id);
  },

  async confirmGuestReveal(token: string): Promise<SecretSantaAssignment> {
    const participant = await this.getParticipantByToken(token);
    const group = await getGroupOrThrow(participant.group_id);

    if (participant.status !== 'accepted') {
      throw new AppError(403, 'Invitation non acceptée', 'FORBIDDEN');
    }
    if (group.status !== 'drawn') {
      throw new AppError(400, 'Le tirage n\'a pas encore eu lieu', 'NOT_DRAWN');
    }

    if (!participant.revealed_at) {
      const { error } = await supabase
        .from('secret_santa_participants')
        .update({ revealed_at: new Date().toISOString() })
        .eq('id', participant.id);

      if (error) throw new AppError(500, error.message, 'DB_ERROR');
    }

    return this.assignmentForParticipant(group.id, participant.id);
  },

  async getGuestInvite(token: string): Promise<GuestInviteInfo> {
    const participant = await this.getParticipantByToken(token);
    const group = await getGroupOrThrow(participant.group_id);

    return {
      group_title: group.title,
      budget: group.budget,
      guest_display_name: participant.display_name,
      status: participant.status,
      group_status: group.status,
    };
  },

  async guestAccept(token: string): Promise<GuestInviteInfo> {
    const participant = await this.getParticipantByToken(token);
    if (participant.member_id) {
      throw new AppError(400, 'Utilise ton compte famille pour répondre', 'VALIDATION');
    }

    const group = await getGroupOrThrow(participant.group_id);
    if (group.status === 'drawn') {
      throw new AppError(400, 'Tirage déjà effectué', 'ALREADY_DRAWN');
    }

    const { error } = await supabase
      .from('secret_santa_participants')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', participant.id);

    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    return this.getGuestInvite(token);
  },

  async guestDecline(token: string): Promise<GuestInviteInfo> {
    const participant = await this.getParticipantByToken(token);
    const group = await getGroupOrThrow(participant.group_id);
    if (group.status === 'drawn') {
      throw new AppError(400, 'Tirage déjà effectué', 'ALREADY_DRAWN');
    }

    const { error } = await supabase
      .from('secret_santa_participants')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', participant.id);

    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    return this.getGuestInvite(token);
  },

  async getGuestAssignment(token: string): Promise<SecretSantaAssignment> {
    const participant = await this.getParticipantByToken(token);
    const group = await getGroupOrThrow(participant.group_id);

    if (participant.status !== 'accepted') {
      throw new AppError(403, 'Invitation non acceptée', 'FORBIDDEN');
    }
    if (group.status !== 'drawn') {
      throw new AppError(400, 'Le tirage n\'a pas encore eu lieu', 'NOT_DRAWN');
    }

    return this.assignmentForParticipant(group.id, participant.id);
  },

  async getParticipantByToken(token: string): Promise<SecretSantaParticipant> {
    const { data, error } = await supabase
      .from('secret_santa_participants')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (error || !data) throw new AppError(404, 'Invitation introuvable', 'NOT_FOUND');
    return data;
  },

  async getInviteLinkForParticipant(
    groupId: string,
    member: FamilyMember,
    participantId: string,
  ): Promise<{ invite_link: string }> {
    const { group } = await assertGroupAccess(groupId, member);
    if (group.created_by !== member.id) {
      throw new AppError(403, 'Seul le créateur peut voir le lien', 'FORBIDDEN');
    }

    const { data: participant, error } = await supabase
      .from('secret_santa_participants')
      .select('*')
      .eq('id', participantId)
      .eq('group_id', groupId)
      .single();

    if (error || !participant) throw new AppError(404, 'Participant introuvable', 'NOT_FOUND');
    if (participant.member_id) {
      throw new AppError(400, 'Ce participant est un membre famille', 'VALIDATION');
    }

    return { invite_link: inviteLink(participant.invite_token!) };
  },

  async removeParticipant(
    groupId: string,
    member: FamilyMember,
    participantId: string,
  ): Promise<SecretSantaGroupDetail> {
    const { group } = await assertGroupAccess(groupId, member);
    if (group.created_by !== member.id) {
      throw new AppError(403, 'Seul le créateur peut retirer un participant', 'FORBIDDEN');
    }
    if (group.status === 'drawn') {
      throw new AppError(400, 'Impossible après le tirage — supprime le Secret Santa', 'ALREADY_DRAWN');
    }

    const { data: participant, error: fetchError } = await supabase
      .from('secret_santa_participants')
      .select('*')
      .eq('id', participantId)
      .eq('group_id', groupId)
      .single();

    if (fetchError || !participant) {
      throw new AppError(404, 'Participant introuvable', 'NOT_FOUND');
    }
    if (participant.is_creator) {
      throw new AppError(400, 'Tu ne peux pas te retirer en tant que créateur', 'VALIDATION');
    }

    const { error } = await supabase
      .from('secret_santa_participants')
      .delete()
      .eq('id', participantId);

    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    return this.getGroupDetail(groupId, member);
  },

  async deleteGroup(groupId: string, member: FamilyMember): Promise<void> {
    const { group } = await assertGroupAccess(groupId, member);
    if (group.created_by !== member.id) {
      throw new AppError(403, 'Seul le créateur peut supprimer ce Secret Santa', 'FORBIDDEN');
    }

    const { error } = await supabase.from('secret_santa_groups').delete().eq('id', groupId);
    if (error) throw new AppError(500, error.message, 'DB_ERROR');
  },
};
