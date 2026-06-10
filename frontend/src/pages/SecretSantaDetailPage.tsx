import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { FamilyMember } from '../types';
import type {
  InviteEmailResult,
  InviteMemberResult,
  SecretSantaGroupDetail,
  SecretSantaParticipantView,
} from '../types/secretSanta';
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

  if (!initialized || loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return (
      <div className="card mx-auto max-w-md text-center py-12">
        <p className="text-sm text-arbey-600">Connecte-toi pour voir ce Secret Santa.</p>
        <Link to="/login" className="btn-primary mt-4 inline-flex">
          Se connecter
        </Link>
      </div>
    );
  }

  const acceptedCount = group?.participants.filter((p) => p.status === 'accepted').length ?? 0;
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
    alert('Lien copié !');
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/secret-santa" className="text-sm text-arbey-500 hover:text-arbey-700">
          ← Mes Secret Santa
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-arbey-900">{group.title}</h1>
        {group.budget && <p className="text-sm text-arbey-600">Budget : {group.budget}</p>}
      </div>

      {group.my_status === 'invited' && group.status === 'open' && (
        <div className="card flex flex-wrap gap-3 border-warm-200 bg-warm-50/50">
          <p className="w-full text-sm text-arbey-700">Tu es invité à ce Secret Santa.</p>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => respond('accepted')}
            className="btn-primary"
          >
            Accepter
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => respond('declined')}
            className="btn-secondary"
          >
            Décliner
          </button>
        </div>
      )}

      {feedback && (
        <div className="rounded-xl border border-arbey-200 bg-arbey-50 px-4 py-3 text-sm text-arbey-700">
          {feedback}
        </div>
      )}

      <div className="card">
        <h2 className="font-display font-semibold text-arbey-900">Participants</h2>
        <p className="mt-1 text-xs text-arbey-500">
          {acceptedCount} confirmé{acceptedCount > 1 ? 's' : ''} · minimum 3 pour tirer
        </p>
        <ul className="mt-4 space-y-2">
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

      {group.is_creator && group.status === 'open' && (
        <>
          <div className="card space-y-3">
            <h2 className="font-display font-semibold text-arbey-900">
              Inviter un membre famille
            </h2>
            <div className="flex gap-2">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="flex-1 rounded-xl border border-arbey-200 px-3 py-2 text-sm"
              >
                <option value="">Choisir…</option>
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedMemberId || actionLoading}
                onClick={inviteMember}
                className="btn-primary shrink-0"
              >
                Inviter
              </button>
            </div>
          </div>

          <div className="card space-y-3">
            <h2 className="font-display font-semibold text-arbey-900">
              Inviter quelqu'un hors famille
            </h2>
            <p className="text-xs text-arbey-500">
              Un email d'invitation sera envoyé automatiquement (avec lien de secours ci-dessous).
            </p>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Prénom (ex. Léa)"
              className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm"
            />
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm"
            />
            <button
              type="button"
              disabled={!guestEmail || !guestName || actionLoading}
              onClick={inviteGuest}
              className="btn-secondary w-full"
            >
              Créer l'invitation
            </button>
            {lastInviteLink && (
              <div className="rounded-xl bg-arbey-50 p-3 text-xs break-all text-arbey-700">
                <p className="font-medium mb-1">Lien à partager :</p>
                {lastInviteLink}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={acceptedCount < 3 || actionLoading}
            onClick={launchDraw}
            className="btn-primary w-full text-base py-3"
          >
            🎰 Lancer la roulette ({acceptedCount}/3 min.)
          </button>
        </>
      )}

      {group.status === 'drawn' && group.my_status === 'accepted' && (
        <button
          type="button"
          onClick={() => navigate(`/secret-santa/${group.id}/reveal`)}
          className="btn-primary w-full text-base py-3"
        >
          🎰 Découvrir mon tirage
        </button>
      )}

      {group.is_creator && (
        <div className="card border-red-100">
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
  onCopyLink: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border border-arbey-100 px-3 py-2">
      <div>
        <p className="text-sm font-medium text-arbey-900">
          {participant.display_name}
          {participant.is_creator && (
            <span className="ml-1 text-xs text-arbey-500">(créateur)</span>
          )}
          {participant.is_external && (
            <span className="ml-1 text-xs text-arbey-500">(invité externe)</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {participant.is_external && isCreator && participant.status === 'invited' && (
          <button type="button" onClick={onCopyLink} className="text-xs text-arbey-600 underline">
            Copier lien
          </button>
        )}
        {canManage && !participant.is_creator && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-600 underline hover:text-red-800"
          >
            Retirer
          </button>
        )}
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[participant.status]}`}
        >
          {statusLabel[participant.status]}
        </span>
      </div>
    </li>
  );
}
