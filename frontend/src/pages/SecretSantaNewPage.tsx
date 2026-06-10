import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { SecretSantaGroupDetail } from '../types/secretSanta';

export function SecretSantaNewPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const group = await api.post<SecretSantaGroupDetail>('/secret-santa', {
        title,
        budget: budget || undefined,
      });
      navigate(`/secret-santa/${group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link to="/secret-santa" className="text-sm text-arbey-500 hover:text-arbey-700">
          ← Retour
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-arbey-900">
          Nouveau Secret Santa
        </h1>
        <p className="mt-1 text-sm text-arbey-600">
          Tu pourras ensuite inviter des membres de la famille ou des personnes externes par
          email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-arbey-700 mb-1">Titre</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Noël chez Eric"
            required
            className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-arbey-700 mb-1">
            Budget (optionnel)
          </label>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Ex. 25 €"
            className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Création…' : 'Créer le tirage'}
        </button>
      </form>
    </div>
  );
}
