import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { pushService } from './pushService.js';
import type { Conversation, ConversationSummary, Message } from '../types/index.js';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const IMAGE_BUCKET = 'albums';

async function requireMembership(conversationId: string, memberId: string): Promise<void> {
  const { data, error } = await supabase
    .from('conversation_members')
    .select('member_id')
    .eq('conversation_id', conversationId)
    .eq('member_id', memberId)
    .maybeSingle();
  if (error) throw new AppError(500, error.message, 'DB_ERROR');
  if (!data) throw new AppError(403, "Tu n'es pas membre de cette conversation", 'FORBIDDEN');
}

export const messagingService = {
  /** Liste les conversations dont le membre fait partie, avec dernier message et non-lus. */
  async listForMember(memberId: string): Promise<ConversationSummary[]> {
    // Une seule RPC (cf. migration 012) au lieu de 3 requêtes par conversation.
    const { data, error } = await supabase.rpc('list_conversations', { p_member: memberId });
    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return (data ?? []) as ConversationSummary[];
  },

  /** Crée une conversation (réservé aux admins, vérifié par la route). */
  async create(createdBy: string, title: string | null, memberIds: string[]): Promise<Conversation> {
    const uniqueMemberIds = Array.from(new Set([...memberIds, createdBy]));

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({ title: title?.trim() || null, created_by: createdBy })
      .select()
      .single();
    if (error || !conversation) throw new AppError(400, error?.message ?? 'Création impossible', 'DB_ERROR');

    const { error: membersError } = await supabase.from('conversation_members').insert(
      uniqueMemberIds.map((memberId) => ({
        conversation_id: conversation.id,
        member_id: memberId,
        added_by: createdBy,
      })),
    );
    if (membersError) throw new AppError(400, membersError.message, 'DB_ERROR');

    return conversation;
  },

  /** Ajoute un membre à une conversation existante — accessible à tout membre de la conversation. */
  async addMember(conversationId: string, actingMemberId: string, newMemberId: string): Promise<void> {
    await requireMembership(conversationId, actingMemberId);

    const { error } = await supabase
      .from('conversation_members')
      .upsert(
        { conversation_id: conversationId, member_id: newMemberId, added_by: actingMemberId },
        { onConflict: 'conversation_id,member_id', ignoreDuplicates: true },
      );
    if (error) throw new AppError(400, error.message, 'DB_ERROR');
  },

  // Aucune suppression de membre (ni « quitter le groupe ») : volontairement non supportée, cf. migration 013.

  /** Renomme le groupe / modifie sa description — accessible à tout membre de la conversation. */
  async updateSettings(
    conversationId: string,
    actingMemberId: string,
    input: { title?: unknown; description?: unknown },
  ): Promise<Conversation> {
    await requireMembership(conversationId, actingMemberId);

    const patch: { title?: string | null; description?: string | null } = {};
    if (input.title !== undefined) {
      if (input.title !== null && typeof input.title !== 'string') {
        throw new AppError(400, 'Nom invalide', 'VALIDATION_ERROR');
      }
      const title = input.title?.trim() || null;
      if (title && title.length > MAX_TITLE_LENGTH) {
        throw new AppError(400, `Nom trop long (${MAX_TITLE_LENGTH} caractères max)`, 'VALIDATION_ERROR');
      }
      patch.title = title;
    }
    if (input.description !== undefined) {
      if (input.description !== null && typeof input.description !== 'string') {
        throw new AppError(400, 'Description invalide', 'VALIDATION_ERROR');
      }
      const description = input.description?.trim() || null;
      if (description && description.length > MAX_DESCRIPTION_LENGTH) {
        throw new AppError(400, `Description trop longue (${MAX_DESCRIPTION_LENGTH} caractères max)`, 'VALIDATION_ERROR');
      }
      patch.description = description;
    }
    if (Object.keys(patch).length === 0) {
      throw new AppError(400, 'Rien à modifier', 'VALIDATION_ERROR');
    }

    const { data, error } = await supabase
      .from('conversations')
      .update(patch)
      .eq('id', conversationId)
      .select()
      .single();
    if (error || !data) throw new AppError(400, error?.message ?? 'Modification impossible', 'DB_ERROR');
    return data;
  },

  /** Remplace l'image du groupe — accessible à tout membre de la conversation. */
  async uploadImage(conversationId: string, actingMemberId: string, file: Express.Multer.File): Promise<Conversation> {
    await requireMembership(conversationId, actingMemberId);

    const { data: current, error: currentError } = await supabase
      .from('conversations')
      .select('image_url')
      .eq('id', conversationId)
      .single();
    if (currentError || !current) throw new AppError(404, 'Conversation introuvable', 'NOT_FOUND');

    const ext = (file.originalname.split('.').pop() ?? 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
    const storagePath = `conversations/${conversationId}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
    if (uploadError) throw new AppError(500, uploadError.message, 'STORAGE_ERROR');

    const { data: urlData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);

    const { data, error } = await supabase
      .from('conversations')
      .update({ image_url: urlData.publicUrl })
      .eq('id', conversationId)
      .select()
      .single();
    if (error || !data) throw new AppError(400, error?.message ?? 'Modification impossible', 'DB_ERROR');

    const marker = `/object/public/${IMAGE_BUCKET}/`;
    const index = current.image_url?.indexOf(marker) ?? -1;
    if (current.image_url && index !== -1) {
      await supabase.storage.from(IMAGE_BUCKET).remove([current.image_url.slice(index + marker.length)]);
    }

    return data;
  },

  /** Active/désactive le mode silencieux pour le membre courant sur cette conversation. */
  async setMuted(conversationId: string, memberId: string, muted: boolean): Promise<void> {
    await requireMembership(conversationId, memberId);

    const { error } = await supabase
      .from('conversation_members')
      .update({ muted })
      .eq('conversation_id', conversationId)
      .eq('member_id', memberId);
    if (error) throw new AppError(400, error.message, 'DB_ERROR');
  },

  /** Marque la conversation comme lue jusqu'à maintenant pour ce membre. */
  async markRead(conversationId: string, memberId: string): Promise<void> {
    await requireMembership(conversationId, memberId);

    const { error } = await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('member_id', memberId);
    if (error) throw new AppError(400, error.message, 'DB_ERROR');
  },

  /**
   * Pagination par curseur : les `limit` messages les plus récents (avant `before` si fourni),
   * renvoyés du plus ancien au plus récent. Évite aussi la coupe silencieuse à 1000 lignes de PostgREST.
   */
  async listMessages(
    conversationId: string,
    memberId: string,
    before?: string,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<Message[]> {
    await requireMembership(conversationId, memberId);

    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(Math.min(Math.max(limit, 1), MAX_PAGE_SIZE));
    if (before) query = query.lt('created_at', before);

    const { data, error } = await query;
    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return (data ?? []).reverse();
  },

  async sendMessage(conversationId: string, authorId: string, content: string): Promise<Message> {
    await requireMembership(conversationId, authorId);

    const trimmed = content.trim();
    if (!trimmed) throw new AppError(400, 'Le message ne peut pas être vide', 'VALIDATION_ERROR');
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new AppError(400, `Message trop long (${MAX_MESSAGE_LENGTH} caractères max)`, 'VALIDATION_ERROR');
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, author_id: authorId, content: trimmed })
      .select()
      .single();
    if (error || !message) throw new AppError(400, error?.message ?? 'Envoi impossible', 'DB_ERROR');

    // Déclenché en tâche de fond : un échec d'envoi push ne doit pas faire échouer l'envoi du message.
    pushService.notifyNewMessage(conversationId, authorId, trimmed).catch((err) => {
      console.error('[push] Échec de notification pour le message', message.id, err);
    });

    return message;
  },
};
