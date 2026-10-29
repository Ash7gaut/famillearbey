import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { pushService } from './pushService.js';
import type { Conversation, ConversationSummary, Message } from '../types/index.js';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const MAX_MESSAGE_LENGTH = 4000;

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

  /** Retire un membre d'une conversation (soi-même ou un autre) — accessible à tout membre. */
  async removeMember(conversationId: string, actingMemberId: string, targetMemberId: string): Promise<void> {
    await requireMembership(conversationId, actingMemberId);

    const { error } = await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('member_id', targetMemberId);
    if (error) throw new AppError(400, error.message, 'DB_ERROR');

    // Plus aucun membre : la conversation est orpheline, on la supprime (messages en cascade).
    const { count } = await supabase
      .from('conversation_members')
      .select('member_id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);
    if (count === 0) {
      await supabase.from('conversations').delete().eq('id', conversationId);
    }
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
