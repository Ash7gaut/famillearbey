import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { BackLink } from '../components/ui/BackLink';
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
      <div className="mx-auto max-w-sm space-y-4 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-100 text-warm-700">
          <MailCheck className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <h1 className="font-display text-xl font-semibold text-ink-800">Demande envoyée</h1>
        <p className="text-sm leading-relaxed text-ink-500">
          Ton compte est prêt. Dès qu&apos;un administrateur aura validé ta demande, connecte-toi
          avec ton email — tu recevras un lien de connexion, pas besoin de mot de passe.
        </p>
        <Link to="/login" className="btn-secondary inline-flex">
          Retour connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-8 py-4">
      <BackLink to="/" label="Accueil" />
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-warm-600">Invitation</p>
        <h1 className="page-title mt-2">Demander l&apos;accès</h1>
        <p className="page-subtitle">
          Crée ton compte maintenant — un admin validera ta demande avant l&apos;accès au site.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Prénom</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Nom</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Message (optionnel)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Je suis le fils de..."
            className="input-field resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Création...' : 'Créer mon compte et demander l\'accès'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-500">
        Déjà invité ?{' '}
        <Link to="/login" className="font-medium text-warm-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
