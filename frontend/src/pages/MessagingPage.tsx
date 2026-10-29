import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMessagingStore } from '../stores/messagingStore';
import { api } from '../services/api';
import type { FamilyMember } from '../types';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { MemberAvatar } from '../components/profile/MemberAvatar';
import { NewConversationModal } from '../components/messaging/NewConversationModal';

function otherMembers(members: FamilyMember[], selfId: string | undefined): FamilyMember[] {
  return members.filter((m) => m.id !== selfId);
}

export function MessagingPage() {
  const { session, member } = useAuthStore();
  const { conversations, loading, error, fetchConversations } = useMessagingStore();
  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (session) fetchConversations();
  }, [session, fetchConversations]);

  useEffect(() => {
    if (member?.is_admin) {
      api.get<FamilyMember[]>('/members').then(setAllMembers).catch(() => {});
    }
  }, [member?.is_admin]);

  if (!session) return <Navigate to="/login" replace />;
  // Pas de spinner plein page si la modale est ouverte : le remplacement de l'arbre la démonterait (et perdrait son état).
  if (loading && !creating) return <LoadingSpinner data-testid="messaging-loading-spinner" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="messaging-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title" data-testid="messaging-title">Messagerie</h1>
          <p className="page-subtitle">Discussions de groupe avec la famille.</p>
        </div>
        {member?.is_admin && (
          <button type="button" className="btn-primary" onClick={() => setCreating(true)} data-testid="messaging-new-group-button">
            + Nouveau groupe
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" data-testid="messaging-error">
          {error}
        </div>
      )}

      <ul className="space-y-2" data-testid="conversation-list">
        {conversations.map((c) => {
          const label = c.title || otherMembers(c.members, member?.id).map((m) => m.first_name).join(', ');
          return (
            <li key={c.id}>
              <Link
                to={`/messagerie/${c.id}`}
                data-testid={`conversation-item-${c.id}`}
                className="card flex items-center gap-3 !p-3 no-underline transition hover:bg-cream-100"
              >
                <div className="flex -space-x-2">
                  {otherMembers(c.members, member?.id)
                    .slice(0, 3)
                    .map((m) => (
                      <MemberAvatar key={m.id} member={m} size="md" className="ring-2 ring-cream-50" />
                    ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-800" data-testid={`conversation-title-${c.id}`}>{label || 'Groupe'}</p>
                  <p className="truncate text-xs text-ink-500" data-testid={`conversation-last-message-${c.id}`}>
                    {c.last_message ? c.last_message.content : 'Aucun message pour l\'instant'}
                    {c.muted ? ' · 🔕' : ''}
                  </p>
                </div>
                {c.unread_count > 0 && (
                  <span className="shrink-0 rounded-full bg-warm-600 px-2 py-0.5 text-xs font-semibold text-white" data-testid={`conversation-unread-badge-${c.id}`}>
                    {c.unread_count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        {conversations.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-500" data-testid="conversation-list-empty">
            Aucune conversation pour l'instant.
            {member?.is_admin ? ' Crée le premier groupe !' : ' Demande à un admin de créer un groupe.'}
          </li>
        )}
      </ul>

      {creating && (
        <NewConversationModal
          allMembers={allMembers}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            fetchConversations();
          }}
        />
      )}
    </div>
  );
}
