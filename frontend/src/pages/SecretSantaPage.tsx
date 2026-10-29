import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { SecretSantaGroupSummary } from '../types/secretSanta';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuthReady } from '../hooks/useAuthReady';

const statusLabels: Record<string, string> = {
  open: 'En cours',
  drawn: 'Tirage fait',
};

export function SecretSantaPage() {
  const { initialized, member, isAuthenticated } = useAuthReady();
  const [groups, setGroups] = useState<SecretSantaGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    api
      .get<SecretSantaGroupSummary[]>('/secret-santa')
      .then(setGroups)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [initialized, isAuthenticated]);

  if (!initialized || loading) {
    return <LoadingSpinner data-testid="secret-santa-loading-spinner" />;
  }

  if (!member) {
    return (
      <div className="card mx-auto max-w-md text-center py-12" data-testid="secret-santa-login-prompt">
        <p className="text-4xl mb-3">🎁</p>
        <h1 className="font-display text-xl font-bold text-arbey-900">Secret Santa</h1>
        <p className="mt-2 text-sm text-arbey-600">
          Connecte-toi pour créer ou rejoindre un tirage.
        </p>
        <Link to="/login" className="btn-primary mt-6 inline-flex" data-testid="secret-santa-login-link">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="secret-santa-page">
      <BackLink to="/accueil" label="Accueil" data-testid="secret-santa-back-link" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title" data-testid="secret-santa-title">Secret Santa</h1>
          <p className="mt-1 text-sm text-arbey-600">
            Crée un tirage entre qui tu veux — famille ou invités externes.
          </p>
        </div>
        <Link to="/secret-santa/new" className="btn-primary shrink-0" data-testid="secret-santa-new-button">
          + Créer un tirage
        </Link>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}

      {!error && groups.length === 0 && (
        <div className="card text-center py-12" data-testid="secret-santa-empty">
          <p className="text-4xl mb-3">🎰</p>
          <p className="text-arbey-600">Aucun Secret Santa pour l'instant.</p>
          <Link to="/secret-santa/new" className="btn-secondary mt-4 inline-flex" data-testid="secret-santa-empty-new-button">
            Créer le premier
          </Link>
        </div>
      )}

      {!error && groups.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="secret-santa-group-list">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/secret-santa/${group.id}`}
              data-testid={`secret-santa-group-${group.id}`}
              className="card block transition hover:border-arbey-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display font-semibold text-arbey-900" data-testid={`secret-santa-group-title-${group.id}`}>{group.title}</h2>
                <span
                  data-testid={`secret-santa-group-status-${group.id}`}
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    group.status === 'drawn'
                      ? 'bg-arbey-100 text-arbey-700'
                      : 'bg-warm-100 text-warm-700'
                  }`}
                >
                  {statusLabels[group.status]}
                </span>
              </div>
              {group.budget && (
                <p className="mt-1 text-sm text-arbey-500">Budget : {group.budget}</p>
              )}
              <p className="mt-2 text-xs text-arbey-500">
                {group.accepted_count} participant{group.accepted_count > 1 ? 's' : ''} confirmé
                {group.accepted_count > 1 ? 's' : ''}
                {group.is_creator && ' · Tu es le créateur'}
                {group.my_status === 'invited' && ' · Invitation en attente'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
