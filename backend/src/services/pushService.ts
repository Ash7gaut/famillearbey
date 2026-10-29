import webpush from 'web-push';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember, PushSubscriptionInput } from '../types/index.js';

const PREVIEW_LENGTH = 100;
const PUSH_TTL_SECONDS = 3600;
const STALE_SUBSCRIPTION_DAYS = 90;

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!env.vapidPublicKey || !env.vapidPrivateKey) return false;
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
  configured = true;
  return true;
}

export const pushService = {
  isConfigured(): boolean {
    return ensureConfigured();
  },

  publicKey(): string {
    return env.vapidPublicKey;
  },

  async subscribe(memberId: string, input: PushSubscriptionInput): Promise<void> {
    if (!input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
      throw new AppError(400, 'Abonnement push invalide', 'VALIDATION_ERROR');
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        member_id: memberId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        user_agent: input.user_agent ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    );
    if (error) throw new AppError(400, error.message, 'DB_ERROR');
  },

  async unsubscribe(memberId: string, endpoint: string): Promise<void> {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('member_id', memberId)
      .eq('endpoint', endpoint);
    if (error) throw new AppError(400, error.message, 'DB_ERROR');
  },

  /** Notifie tous les membres non-mutés d'une conversation, sauf l'auteur. */
  async notifyNewMessage(conversationId: string, authorId: string, content: string): Promise<void> {
    if (!ensureConfigured()) {
      console.warn('[push] VAPID non configuré — notification ignorée');
      return;
    }

    // Purge opportuniste des abonnements inactifs (last_seen_at est rafraîchi à chaque ouverture de l'app).
    const staleBefore = new Date(Date.now() - STALE_SUBSCRIPTION_DAYS * 24 * 3600 * 1000).toISOString();
    await supabase.from('push_subscriptions').delete().lt('last_seen_at', staleBefore);

    const { data: recipients, error: recipientsError } = await supabase
      .from('conversation_members')
      .select('member_id, muted, family_members(first_name, last_name)')
      .eq('conversation_id', conversationId)
      .neq('member_id', authorId)
      .eq('muted', false);
    if (recipientsError || !recipients?.length) return;

    const { data: conversation } = await supabase
      .from('conversations')
      .select('title')
      .eq('id', conversationId)
      .maybeSingle();

    const { data: author } = await supabase
      .from('family_members')
      .select('first_name, last_name')
      .eq('id', authorId)
      .maybeSingle<Pick<FamilyMember, 'first_name' | 'last_name'>>();

    const title = conversation?.title || (author ? `${author.first_name} ${author.last_name}` : 'Nouveau message');
    // Le payload Web Push est limité à ~4 Ko : on n'envoie qu'un aperçu.
    const preview = content.length > PREVIEW_LENGTH ? `${content.slice(0, PREVIEW_LENGTH - 1)}…` : content;
    const body = author ? `${author.first_name} : ${preview}` : preview;

    const memberIds = recipients.map((r) => r.member_id);
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('member_id', memberIds);
    if (!subscriptions?.length) return;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title, body, conversationId, url: `/messagerie/${conversationId}` }),
            { TTL: PUSH_TTL_SECONDS, urgency: 'normal' },
          );
        } catch (err: any) {
          // Abonnement expiré/révoqué (désinstallation, navigateur qui a nettoyé) : on le supprime.
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          } else {
            console.error('[push] Échec d\'envoi vers', sub.endpoint, err);
          }
        }
      }),
    );
  },
};
