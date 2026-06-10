import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { GuestInviteInfo, SecretSantaAssignment } from '../types/secretSanta';
import { RouletteWheel } from '../components/secretSanta/RouletteWheel';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export function SecretSantaGuestPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<GuestInviteInfo | null>(null);
  const [assignment, setAssignment] = useState<SecretSantaAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    if (!token) return;
    api
      .get<GuestInviteInfo>(`/secret-santa/invite/${token}`)
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  async function accept() {
    if (!token) return;
    setActionLoading(true);
    try {
      const data = await api.post<GuestInviteInfo>(`/secret-santa/invite/${token}/accept`);
      setInfo(data);
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
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  }

  async function loadAssignment() {
    if (!token) return;
    const data = await api.get<SecretSantaAssignment>(`/secret-santa/invite/${token}/assignment`);
    setAssignment(data);
    setRevealed(true);
  }

  if (loading) return <LoadingSpinner />;
  if (error || !info) return <ErrorMessage message={error ?? 'Invitation introuvable'} />;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <p className="text-4xl mb-2">🎁</p>
        <h1 className="font-display text-2xl font-bold text-arbey-900">{info.group_title}</h1>
        <p className="mt-1 text-sm text-arbey-600">
          Bonjour {info.guest_display_name} !
          {info.budget && ` · Budget : ${info.budget}`}
        </p>
      </div>

      {info.status === 'invited' && info.group_status === 'open' && (
        <div className="card flex flex-col gap-3 text-center">
          <p className="text-sm text-arbey-700">Tu es invité à ce Secret Santa.</p>
          <button type="button" disabled={actionLoading} onClick={accept} className="btn-primary">
            Participer
          </button>
          <button type="button" disabled={actionLoading} onClick={decline} className="btn-secondary">
            Décliner
          </button>
        </div>
      )}

      {info.status === 'accepted' && info.group_status === 'open' && (
        <div className="card text-center text-sm text-arbey-600">
          C'est noté ! Le créateur lancera la roulette quand tout le monde sera prêt.
        </div>
      )}

      {info.status === 'declined' && (
        <div className="card text-center text-sm text-arbey-600">
          Tu as décliné cette invitation.
        </div>
      )}

      {info.status === 'accepted' && info.group_status === 'drawn' && !revealed && (
        <div className="text-center">
          <button type="button" onClick={loadAssignment} className="btn-primary">
            🎰 Découvrir mon tirage
          </button>
        </div>
      )}

      {revealed && assignment && (
        <RouletteWheel
          names={assignment.participant_names}
          targetName={assignment.receiver_display_name}
        />
      )}

      <p className="text-center text-xs text-arbey-400">
        <Link to="/" className="hover:text-arbey-600">
          FamilyHub — Famille Arbey
        </Link>
      </p>
    </div>
  );
}
