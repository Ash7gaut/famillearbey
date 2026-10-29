import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, UserMinus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { FamilyMember } from '../types';
import type {
  InviteEmailResult,
  InviteMemberResult,
  SecretSantaGroupDetail,
  SecretSantaParticipantView,
} from '../types/secretSanta';
import { SecretSantaDrawRoster } from '../components/secretSanta/SecretSantaDrawRoster';
import { MemberSelect } from '../components/ui/MemberSelect';
import { MemberAvatar } from '../components/profile/MemberAvatar';
import { avatarPersonFromDisplayName } from '../components/profile/memberUtils';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuthReady } from '../hooks/useAuthReady';

const statusBadge: Record<string, string> = {
  invited: 'bg-warm-100 text-warm-700',
  accepted: 'bg-arbey-100 text-arbey-700',
  declined: 'bg-red-50 text-red-600',
};

const statusLabel: Record<string, string> = {
  invited: 'En attente',
  accepted: 'Confirmé',
  declined: 'Décliné',
};

export function SecretSantaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { initialized, isAuthenticated } = useAuthReady();
  const [group, setGroup] = useState<SecretSantaGroupDetail | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [g, m] = await Promise.all([
      api.get<SecretSantaGroupDetail>(`/secret-santa/${id}`),
      api.get<FamilyMember[]>('/members'),
    ]);
    setGroup(g);
    setMembers(m);
  }, [id]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load, initialized, isAuthenticated]);

  if (!initialized || loading) return <LoadingSpinner data-testid="secret-santa-detail-loading-spinner" />;

  if (!isAuthenticated) {
    return (
      <div className="card mx-auto max-w-md text-center py-12" data-testid="secret-santa-detail-login-prompt">
        <p className="text-sm text-arbey-600">Connecte-toi pour voir ce Secret Santa.</p>
        <Link to="/login" className="btn-primary mt-4 inline-flex" data-testid="secret-santa-detail-login-link">
          Se connecter
        </Link>
      </div>
    );
  }

  const acceptedCount = group?.participants.filter((p) => p.status === 'accepted').length ?? 0;
  const drawnParticipants =
    group?.participants.filter((p) => p.status === 'accepted') ?? [];
  const absentParticipants =
    group?.participants.filter((p) => p.status !== 'accepted') ?? [];
  const memberById = new Map(members.map((member) => [member.id, member]));
  const invitedMemberIds = new Set(
    group?.participants.map((p) => p.member_id).filter(Boolean) as string[],
  );
  const availableMembers = members.filter((m) => !invitedMemberIds.has(m.id));

  async function inviteMember() {
    if (!id || !selectedMemberId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const result = await api.post<InviteMemberResult>(`/secret-santa/${id}/invite-member`, {
        memberId: selectedMemberId,
      });
      setSelectedMemberId('');
      setFeedback(result.email_message ?? (result.email_sent ? 'Email envoyé.' : 'Invitation enregistrée.'));
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  }

  async function inviteGuest() {
    if (!id || !guestEmail || !guestName) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const result = await api.post<InviteEmailResult>(`/secret-santa/${id}/invite-email`, {
        email: guestEmail,
        displayName: guestName,
      });
      setLastInviteLink(result.invite_link);
      setFeedback(result.email_message ?? (result.email_sent ? 'Email envoyé.' : 'Invitation créée.'));
      setGuestEmail('');
      setGuestName('');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  }

  async function copyInviteLink(participantId: string) {
    if (!id) return;
    const { invite_link } = await api.get<{ invite_link: string }>(
      `/secret-santa/${id}/participants/${participantId}/invite-link`,
    );
    await navigator.clipboard.writeText(invite_link);
  }

  async function respond(status: 'accepted' | 'declined') {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.patch(`/secret-santa/${id}/respond`, { status });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  }

  async function removeParticipant(participantId: string, name: string) {
    if (!id) return;
    if (!confirm(`Retirer ${name} de ce Secret Santa ?`)) return;
    setActionLoading(true);
    try {
      const updated = await api.delete<SecretSantaGroupDetail>(
        `/secret-santa/${id}/participants/${participantId}`,
      );
      setGroup(updated);
      setFeedback(`${name} a été retiré.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteGroup() {
    if (!id) return;
    if (!confirm('Supprimer définitivement ce Secret Santa ? Cette action est irréversible.')) {
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/secret-santa/${id}`);
      navigate('/secret-santa');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  }

  async function launchDraw() {
    if (!id) return;
    if (!confirm('Lancer le tirage ? Cette action est définitive.')) return;
    setActionLoading(true);
    try {
      await api.post(`/secret-santa/${id}/draw`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  }

  if (error || !group) return <ErrorMessage message={error ?? 'Introuvable'} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="secret-santa-detail-page">
      <div>
        <BackLink to="/secret-santa" label="Secret Santa" data-testid="secret-santa-detail-back-link" />
        <h1 className="page-title" data-testid="secret-santa-detail-title">{group.title}</h1>
        {group.budget && <p className="text-sm text-arbey-600" data-testid="secret-santa-detail-budget">Budget : {group.budget}</p>}
      </div>

      {group.my_status === 'invited' && group.status === 'open' && (
        <div className="card flex flex-wrap gap-3 border-warm-200 bg-warm-50/50" data-testid="secret-santa-invitation-banner">
          <p className="w-full text-sm text-arbey-700">Tu es invité à ce Secret Santa.</p>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => respond('accepted')}
            data-testid="secret-santa-accept-button"
            className="btn-primary"
          >
            Accepter
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => respond('declined')}
            data-testid="secret-santa-decline-button"
            className="btn-secondary"
          >
            Décliner
          </button>
        </div>
      )}

      {feedback && (
        <div className="rounded-xl border border-arbey-200 bg-arbey-50 px-4 py-3 text-sm text-arbey-700" data-testid="secret-santa-feedback">
          {feedback}
        </div>
      )}

      {group.status === 'drawn' && group.my_status === 'accepted' && (
        <button
          type="button"
          onClick={() => navigate(`/secret-santa/${group.id}/reveal`)}
          data-testid="secret-santa-reveal-button"
          className="btn-primary w-full text-base py-3"
        >
          🎰 Découvrir mon tirage
        </button>
      )}

      {group.status === 'drawn' ? (
        <SecretSantaDrawRoster
          accepted={drawnParticipants}
          absent={absentParticipants}
          memberById={memberById}
          drawnAt={group.drawn_at}
        />
      ) : (
        <div className="card" data-testid="secret-santa-participants">
          <h2 className="font-display font-semibold text-arbey-900">Participants</h2>
          <p className="mt-1 text-xs text-arbey-500" data-testid="secret-santa-accepted-count">
            {acceptedCount} confirmé{acceptedCount > 1 ? 's' : ''} · minimum 3 pour tirer
          </p>
          <ul className="mt-4 space-y-2" data-testid="secret-santa-participant-list">
            {group.participants.map((p) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                isCreator={group.is_creator}
                canManage={group.is_creator && group.status === 'open'}
                onCopyLink={() => copyInviteLink(p.id)}
                onRemove={() => removeParticipant(p.id, p.display_name)}
              />
            ))}
          </ul>
        </div>
      )}

      {group.is_creator && group.status === 'open' && (
        <>
          <div className="card space-y-3" data-testid="secret-santa-invite-member-card">
            <h2 className="font-display font-semibold text-arbey-900">
              Inviter un membre famille
            </h2>
            <div className="flex gap-2">
              <MemberSelect
                members={availableMembers}
                value={selectedMemberId}
                onChange={setSelectedMemberId}
                placeholder="Choisir…"
                className="flex-1"
                data-testid="secret-santa-member-select"
              />
              <button
                type="button"
                disabled={!selectedMemberId || actionLoading}
                onClick={inviteMember}
                data-testid="secret-santa-invite-member-button"
                className="btn-primary shrink-0"
              >
                Inviter
              </button>
            </div>
          </div>

          <div className="card space-y-3" data-testid="secret-santa-invite-guest-card">
            <h2 className="font-display font-semibold text-arbey-900">
              Inviter quelqu'un hors famille
            </h2>
            <p className="text-xs text-arbey-500">
              Un email d'invitation sera envoyé automatiquement (avec lien de secours ci-dessous).
            </p>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              data-testid="secret-santa-guest-name-input"
              placeholder="Prénom (ex. Léa)"
              className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm"
            />
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              data-testid="secret-santa-guest-email-input"
              placeholder="email@exemple.com"
              className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm"
            />
            <button
              type="button"
              disabled={!guestEmail || !guestName || actionLoading}
              onClick={inviteGuest}
              data-testid="secret-santa-invite-guest-button"
              className="btn-secondary w-full"
            >
              Créer l'invitation
            </button>
            {lastInviteLink && (
              <div className="rounded-xl bg-arbey-50 p-3 text-xs break-all text-arbey-700" data-testid="secret-santa-invite-link">
                <p className="font-medium mb-1">Lien à partager :</p>
                {lastInviteLink}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={acceptedCount < 3 || actionLoading}
            onClick={launchDraw}
            data-testid="secret-santa-draw-button"
            className="btn-primary w-full text-base py-3"
          >
            🎰 Lancer la roulette ({acceptedCount}/3 min.)
          </button>
        </>
      )}

      {group.is_creator && (
        <div className="card border-red-100" data-testid="secret-santa-settings-card">
          <h2 className="font-display font-semibold text-arbey-900">Paramètres</h2>
          <p className="mt-1 text-xs text-arbey-500">
            {group.status === 'open'
              ? 'Tu peux retirer des participants avant le tirage.'
              : 'Après le tirage, seule la suppression complète est possible.'}
          </p>
          <button
            type="button"
            disabled={actionLoading}
            onClick={deleteGroup}
            data-testid="secret-santa-delete-button"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Supprimer ce Secret Santa
          </button>
        </div>
      )}
    </div>
  );
}

function ParticipantRow({
  participant,
  isCreator,
  canManage,
  onCopyLink,
  onRemove,
}: {
  participant: SecretSantaParticipantView;
  isCreator: boolean;
  canManage: boolean;
  onCopyLink: () => Promise<void>;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const showCopyLink =
    participant.is_external && isCreator && participant.status === 'invited';
  const showRemove = canManage && !participant.is_creator;
  const hasActions = showCopyLink || showRemove;

  async function handleCopy() {
    await onCopyLink();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <li data-testid={`participant-${participant.id}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-cream-300 bg-cream-50/60 px-3 py-2.5 sm:flex-nowrap">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <MemberAvatar
          member={avatarPersonFromDisplayName(participant.display_name, participant.photo_url)}
          size="md"
          initialsTone={participant.status === 'accepted' ? 'warm' : 'muted'}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-800" data-testid={`participant-name-${participant.id}`}>
            {participant.display_name}
          </p>
          {(participant.is_creator || participant.is_external) && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {participant.is_creator && (
                <span className="rounded-md bg-warm-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warm-700">
                  Créateur
                </span>
              )}
              {participant.is_external && (
                <span className="rounded-md bg-cream-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  Invité externe
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        {hasActions && (
          <div className="flex items-center rounded-lg border border-cream-400 bg-cream-50 p-0.5 shadow-sm">
            {showCopyLink && (
              <button
                type="button"
                onClick={() => void handleCopy()}
                data-testid={`participant-copy-link-button-${participant.id}`}
                className={`focus-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition focus-visible:ring-inset focus-visible:ring-offset-0 ${
                  copied
                    ? 'bg-arbey-100 text-arbey-700'
                    : 'text-ink-700 hover:bg-cream-200'
                }`}
                title="Copier le lien d'invitation"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                    Copier lien
                  </>
                )}
              </button>
            )}
            {showCopyLink && showRemove && (
              <span className="mx-0.5 h-5 w-px bg-cream-400" aria-hidden />
            )}
            {showRemove && (
              <button
                type="button"
                onClick={onRemove}
                data-testid={`participant-remove-button-${participant.id}`}
                className="focus-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#9A4A42] transition hover:bg-red-50 hover:text-red-700 focus-visible:ring-inset focus-visible:ring-offset-0 focus-visible:ring-red-300/60"
                title="Retirer ce participant"
              >
                <UserMinus className="h-3.5 w-3.5" strokeWidth={2} />
                Retirer
              </button>
            )}
          </div>
        )}
        <span
          data-testid={`participant-status-${participant.id}`}
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge[participant.status]}`}
        >
          {statusLabel[participant.status]}
        </span>
      </div>
    </li>
  );
}
