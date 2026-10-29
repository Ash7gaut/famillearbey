import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Bell, BellOff, UserMinus, UserPlus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMessagingStore } from '../stores/messagingStore';
import { api } from '../services/api';
import type { FamilyMember } from '../types';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { MemberAvatar } from '../components/profile/MemberAvatar';
import { MemberSelect } from '../components/ui/MemberSelect';

export function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, member } = useAuthStore();
  const {
    conversations,
    messages,
    hasMoreMessages,
    loading,
    fetchConversations,
    openConversation,
    closeConversation,
    loadOlderMessages,
    sendMessage,
    addMember,
    removeMember,
    setMuted,
  } = useMessagingStore();

  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [memberToAdd, setMemberToAdd] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === id);

  useEffect(() => {
    if (!conversations.length && session) fetchConversations();
  }, [session, conversations.length, fetchConversations]);

  useEffect(() => {
    if (id) openConversation(id);
    return () => closeConversation();
  }, [id, openConversation, closeConversation]);

  useEffect(() => {
    api.get<FamilyMember[]>('/members').then(setAllMembers).catch(() => {});
  }, []);

  // On ne descend qu'à l'arrivée d'un nouveau message, pas quand on charge l'historique plus ancien.
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId]);

  if (!session) return <Navigate to="/login" replace />;
  if (!id) return <Navigate to="/messagerie" replace />;

  const memberMap = new Map(allMembers.map((m) => [m.id, m]));
  const label =
    conversation?.title ||
    conversation?.members.filter((m) => m.id !== member?.id).map((m) => m.first_name).join(', ');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !id) return;
    setSending(true);
    try {
      await sendMessage(id, content);
      setDraft('');
    } finally {
      setSending(false);
    }
  }

  async function handleLeave() {
    if (!id || !member) return;
    if (!window.confirm('Quitter ce groupe ?')) return;
    await removeMember(id, member.id);
    navigate('/messagerie');
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col gap-4 lg:h-[calc(100vh-6rem)]" data-testid="conversation-page">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <BackLink to="/messagerie" label="Messagerie" data-testid="conversation-back-link" />
          <h1 className="truncate font-display text-xl font-semibold text-ink-800" data-testid="conversation-title">
            {label || 'Groupe'}
          </h1>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className="focus-ring rounded-lg p-2 text-ink-500 hover:bg-cream-200 hover:text-ink-800"
            onClick={() => id && setMuted(id, !conversation?.muted)}
            data-testid="conversation-mute-button"
            aria-label={conversation?.muted ? 'Réactiver les notifications' : 'Couper les notifications'}
            title={conversation?.muted ? 'Réactiver les notifications' : 'Couper les notifications'}
          >
            {conversation?.muted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </button>
          <button
            type="button"
            className="focus-ring rounded-lg p-2 text-ink-500 hover:bg-cream-200 hover:text-ink-800"
            onClick={() => setShowMembers((v) => !v)}
            data-testid="conversation-members-button"
            aria-label="Gérer les membres"
            title="Gérer les membres"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showMembers && conversation && (
        <div className="card space-y-3" data-testid="conversation-members-panel">
          <h2 className="text-sm font-semibold text-ink-800" data-testid="conversation-members-title">
            Membres ({conversation.members.length})
          </h2>
          <ul className="flex flex-wrap gap-2" data-testid="conversation-member-list">
            {conversation.members.map((m) => (
              <li
                key={m.id}
                data-testid={`conversation-member-${m.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-cream-400 bg-cream-50 py-1 pl-1 pr-2 text-sm text-ink-700"
              >
                <MemberAvatar member={m} size="sm" />
                {m.first_name} {m.last_name}
                <button
                  type="button"
                  className="text-ink-400 transition hover:text-red-600"
                  onClick={() => id && removeMember(id, m.id)}
                  aria-label={`Retirer ${m.first_name}`}
                  data-testid={`conversation-remove-member-${m.id}`}
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <MemberSelect
            members={allMembers.filter((m) => !conversation.members.some((cm) => cm.id === m.id))}
            value={memberToAdd}
            onChange={(memberId) => {
              if (id && memberId) {
                addMember(id, memberId);
                setMemberToAdd('');
              }
            }}
            placeholder="Ajouter un membre…"
            data-testid="conversation-add-member-select"
          />
          <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={handleLeave} data-testid="conversation-leave-button">
            Quitter le groupe
          </button>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto" data-testid="message-list">
        {hasMoreMessages && (
          <div className="flex justify-center">
            <button
              type="button"
              className="text-xs font-medium text-warm-700 hover:underline"
              onClick={() => loadOlderMessages().catch(() => {})}
              data-testid="conversation-load-older-button"
            >
              Charger les messages précédents
            </button>
          </div>
        )}
        {loading && messages.length === 0 ? (
          <LoadingSpinner data-testid="conversation-loading-spinner" />
        ) : (
          messages.map((m) => {
            const isSelf = m.author_id === member?.id;
            const author = m.author_id ? memberMap.get(m.author_id) : undefined;
            return (
              <div key={m.id} data-testid={`message-${m.id}`} className={`flex items-end gap-2 ${isSelf ? 'flex-row-reverse' : ''}`}>
                {!isSelf && author && <MemberAvatar member={author} size="sm" />}
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isSelf ? 'bg-warm-600 text-white' : 'bg-cream-200 text-ink-800'
                  }`}
                >
                  {!isSelf && author && (
                    <p className="mb-0.5 text-xs font-semibold opacity-70" data-testid={`message-author-${m.id}`}>{author.first_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words" data-testid={`message-content-${m.id}`}>{m.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2" data-testid="conversation-form">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écrire un message…"
          className="input-field flex-1"
          data-testid="conversation-message-input"
        />
        <button type="submit" className="btn-primary" disabled={sending || !draft.trim()} data-testid="conversation-send-button">
          Envoyer
        </button>
      </form>
    </div>
  );
}
