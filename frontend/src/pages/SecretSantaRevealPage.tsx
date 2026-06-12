import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { SecretSantaAssignment } from '../types/secretSanta';
import { AssignmentReveal } from '../components/secretSanta/AssignmentReveal';
import { DrawParticipantsPanel } from '../components/secretSanta/DrawParticipantsPanel';
import { LockedAssignment } from '../components/secretSanta/LockedAssignment';
import { BackLink } from '../components/ui/BackLink';
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
        <BackLink to="/secret-santa" label="Secret Santa" />
        <p className="text-sm text-ink-500">Connecte-toi pour voir ton tirage.</p>
        <Link to="/login" className="btn-primary mt-4 inline-flex">
          Se connecter
        </Link>
      </div>
    );
  }

  if (error || !assignment) return <ErrorMessage message={error ?? 'Tirage indisponible'} />;

  const locked = assignment.revealed === true || isRevealStored(storageKey);

  const participants = assignment.participants ?? [];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackLink to={`/secret-santa/${id}`} label="Secret Santa" />

      {locked ? (
        <>
          <LockedAssignment name={assignment.receiver_display_name} />
          <DrawParticipantsPanel participants={participants} />
        </>
      ) : (
        <AssignmentReveal
          assignment={assignment}
          storageKey={storageKey}
          onConfirmReveal={async () => {
            const updated = await api.post<SecretSantaAssignment>(`/secret-santa/${id}/confirm-reveal`);
            setAssignment(updated);
          }}
        />
      )}
    </div>
  );
}
