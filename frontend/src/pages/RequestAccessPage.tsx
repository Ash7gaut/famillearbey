import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export function RequestAccessPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('Arbey');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/access-requests', {
        first_name: firstName,
        last_name: lastName,
        email,
        message: message || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-sm text-center py-12 space-y-4">
        <p className="text-4xl">📬</p>
        <h1 className="font-display text-xl font-semibold text-arbey-900">Demande envoyée !</h1>
        <p className="text-sm text-arbey-600">
          Un administrateur de la famille va examiner ta demande et t'envoyer une invitation par email.
        </p>
        <Link to="/login" className="btn-secondary inline-flex">Retour connexion</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div className="text-center">
        <p className="text-4xl mb-2">✉️</p>
        <h1 className="font-display text-2xl font-bold text-arbey-900">Demander l'accès</h1>
        <p className="mt-1 text-sm text-arbey-600">
          Les comptes sont créés sur invitation uniquement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-arbey-700 mb-1">Prénom</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm focus:border-arbey-400 focus:outline-none focus:ring-2 focus:ring-arbey-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-arbey-700 mb-1">Nom</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm focus:border-arbey-400 focus:outline-none focus:ring-2 focus:ring-arbey-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-arbey-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm focus:border-arbey-400 focus:outline-none focus:ring-2 focus:ring-arbey-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-arbey-700 mb-1">Message (optionnel)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Je suis le fils de..."
            className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm resize-none focus:border-arbey-400 focus:outline-none focus:ring-2 focus:ring-arbey-100"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Envoi...' : 'Envoyer la demande'}
        </button>
      </form>

      <p className="text-center text-sm text-arbey-600">
        Déjà invité ? <Link to="/login" className="font-medium text-arbey-800 hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
