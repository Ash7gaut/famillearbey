import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { SecretSantaAssignment } from '../types/secretSanta';
import { RouletteWheel } from '../components/secretSanta/RouletteWheel';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuthReady } from '../hooks/useAuthReady';

export function SecretSantaRevealPage() {
  const { id } = useParams<{ id: string }>();
  const { initialized, isAuthenticated } = useAuthReady();
  const [assignment, setAssignment] = useState<SecretSantaAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!id || !initialized) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    api
      .get<SecretSantaAssignment>(`/secret-santa/${id}/my-assignment`)
      .then(setAssignment)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, initialized, isAuthenticated]);

  if (!initialized || loading) return <LoadingSpinner />;
  if (error || !assignment) return <ErrorMessage message={error ?? 'Tirage indisponible'} />;

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <Link to={`/secret-santa/${id}`} className="text-sm text-arbey-500 hover:text-arbey-700">
        ← Retour
      </Link>

      {!revealed ? (
        <>
          <h1 className="font-display text-2xl font-bold text-arbey-900">Ta roulette</h1>
          <p className="text-sm text-arbey-600">Prêt ? La roue va tourner…</p>
          <button type="button" onClick={() => setRevealed(true)} className="btn-primary">
            Lancer la roulette
          </button>
        </>
      ) : (
        <RouletteWheel
          names={assignment.participant_names}
          targetName={assignment.receiver_display_name}
        />
      )}
    </div>
  );
}
