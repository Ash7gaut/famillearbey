import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { SecretSantaAssignment } from '../types/secretSanta';
import { AssignmentReveal } from '../components/secretSanta/AssignmentReveal';
import { LockedAssignment } from '../components/secretSanta/LockedAssignment';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuthReady } from '../hooks/useAuthReady';
import { isRevealStored, revealStorageKey } from '../lib/secretSantaRevealStorage';

export function SecretSantaRevealPage() {
  const { id } = useParams<{ id: string }>();
  const { initialized, isAuthenticated } = useAuthReady();
  const [assignment, setAssignment] = useState<SecretSantaAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = id ? revealStorageKey(id) : '';

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

  if (!isAuthenticated) {
    return (
      <div className="card mx-auto max-w-md py-12 text-center">
        <p className="text-sm text-arbey-600">Connecte-toi pour voir ton tirage.</p>
        <Link to="/login" className="btn-primary mt-4 inline-flex">
          Se connecter
        </Link>
      </div>
    );
  }

  if (error || !assignment) return <ErrorMessage message={error ?? 'Tirage indisponible'} />;

  const locked = assignment.revealed === true || isRevealStored(storageKey);

  if (locked) {
    return (
      <div className="mx-auto max-w-md space-y-6 py-4">
        <Link to={`/secret-santa/${id}`} className="text-sm text-arbey-500 hover:text-arbey-700">
          ← Retour
        </Link>
        <LockedAssignment name={assignment.receiver_display_name} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link to={`/secret-santa/${id}`} className="text-sm text-arbey-500 hover:text-arbey-700">
        ← Retour
      </Link>

      <AssignmentReveal
        assignment={assignment}
        storageKey={storageKey}
        onConfirmReveal={async () => {
          const updated = await api.post<SecretSantaAssignment>(`/secret-santa/${id}/confirm-reveal`);
          setAssignment(updated);
        }}
      />
    </div>
  );
}
