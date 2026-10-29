import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, Link2 } from 'lucide-react';
import { api } from '../services/api';
import type { GuestInviteInfo, SecretSantaAssignment } from '../types/secretSanta';
import { AssignmentReveal } from '../components/secretSanta/AssignmentReveal';
import { DrawParticipantsPanel } from '../components/secretSanta/DrawParticipantsPanel';
import { LockedAssignment } from '../components/secretSanta/LockedAssignment';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { guestRevealStorageKey, isRevealStored } from '../lib/secretSantaRevealStorage';
import { guestInviteUrl, saveGuestInvite } from '../lib/guestInviteStorage';

export function SecretSantaGuestPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<GuestInviteInfo | null>(null);
  const [assignment, setAssignment] = useState<SecretSantaAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const storageKey = token ? guestRevealStorageKey(token) : '';

  useEffect(() => {
    if (!token) return;

    api
      .get<GuestInviteInfo>(`/secret-santa/invite/${token}`)
      .then(async (invite) => {
        setInfo(invite);
        saveGuestInvite(token, invite);
        if (invite.status === 'accepted' && invite.group_status === 'drawn') {
          const data = await api.get<SecretSantaAssignment>(
            `/secret-santa/invite/${token}/assignment`,
          );
          setAssignment(data);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function accept() {
    if (!token) return;
    setActionLoading(true);
    try {
      const data = await api.post<GuestInviteInfo>(`/secret-santa/invite/${token}/accept`);
      setInfo(data);
      saveGuestInvite(token, data);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  }

  async function decline() {
    if (!token) return;
    setActionLoading(true);
    try {
      const data = await api.post<GuestInviteInfo>(`/secret-santa/invite/${token}/decline`);
      setInfo(data);
      saveGuestInvite(token, data);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  }

  async function copyPersonalLink() {
    if (!token) return;
    await navigator.clipboard.writeText(guestInviteUrl(token));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <LoadingSpinner data-testid="guest-loading-spinner" />;
  if (error || !info) return <ErrorMessage message={error ?? 'Invitation introuvable'} />;

  const locked =
    assignment &&
    (assignment.revealed === true || isRevealStored(storageKey));

  if (locked && assignment) {
    return (
      <div className="mx-auto max-w-lg space-y-6" data-testid="guest-page-locked">
        <BookmarkCard onCopy={copyPersonalLink} copied={copied} />
        <LockedAssignment name={assignment.receiver_display_name} />
        <DrawParticipantsPanel
          participants={assignment.participants ?? []}
          showProfileLinks={false}
        />
        <HubReminder />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6" data-testid="guest-page">
      <div className="text-center">
        <p className="mb-2 text-4xl" aria-hidden>
          🎁
        </p>
        <h1 className="font-display text-2xl font-bold text-ink-800" data-testid="guest-group-title">{info.group_title}</h1>
        <p className="mt-1 text-sm text-ink-500" data-testid="guest-greeting">
          Bonjour {info.guest_display_name} !
          {info.budget && ` · Budget : ${info.budget}`}
        </p>
      </div>

      <BookmarkCard onCopy={copyPersonalLink} copied={copied} />

      {info.status === 'invited' && info.group_status === 'open' && (
        <div className="card flex flex-col gap-3 text-center" data-testid="guest-invitation-banner">
          <p className="text-sm text-ink-700">Tu es invité à ce Secret Santa.</p>
          <button type="button" disabled={actionLoading} onClick={accept} className="btn-primary" data-testid="guest-accept-button">
            Participer
          </button>
          <button type="button" disabled={actionLoading} onClick={decline} className="btn-secondary" data-testid="guest-decline-button">
            Décliner
          </button>
        </div>
      )}

      {info.status === 'accepted' && info.group_status === 'open' && (
        <div className="card space-y-3 text-center text-sm text-ink-600" data-testid="guest-accepted-notice">
          <p>C&apos;est noté ! Le créateur lancera la roulette quand tout le monde sera prêt.</p>
          <p className="text-ink-500">
            Tu peux fermer cette page — retrouve ton invitation dans{' '}
            <Link to="/mes-invitations" className="font-medium text-warm-700 hover:underline" data-testid="guest-accepted-invitations-link">
              Mes invitations
            </Link>
            .
          </p>
        </div>
      )}

      {info.status === 'declined' && (
        <div className="card text-center text-sm text-ink-600" data-testid="guest-declined-notice">
          Tu as décliné cette invitation.
        </div>
      )}

      {info.status === 'accepted' && info.group_status === 'drawn' && assignment && (
        <AssignmentReveal
          assignment={assignment}
          storageKey={storageKey}
          showProfileLinks={false}
          onConfirmReveal={async () => {
            const updated = await api.post<SecretSantaAssignment>(
              `/secret-santa/invite/${token}/confirm-reveal`,
            );
            setAssignment(updated);
          }}
        />
      )}

      <HubReminder />
    </div>
  );
}

function BookmarkCard({
  onCopy,
  copied,
}: {
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="card border-warm-200/80 bg-warm-50/40" data-testid="guest-bookmark-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream-50 text-warm-700 shadow-sm">
          <Bookmark className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-800">Ton lien personnel</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            Garde ce lien pour revenir ici après le tirage, sans compte famille.
          </p>
          <button
            type="button"
            onClick={() => void onCopy()}
            data-testid="guest-copy-link-button"
            className="btn-secondary mt-3"
          >
            <Link2 className="h-4 w-4" strokeWidth={2} />
            {copied ? 'Lien copié' : 'Copier mon lien'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HubReminder() {
  return (
    <p className="text-center text-xs text-ink-400" data-testid="guest-hub-reminder">
      Toutes tes invitations sont aussi dans{' '}
      <Link to="/mes-invitations" className="font-medium text-warm-700 hover:underline" data-testid="guest-hub-reminder-link">
        Mes invitations
      </Link>
      .
    </p>
  );
}
