import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BackLink } from '../components/ui/BackLink';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const { login, loading, error, member, session } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/accueil';

  if (session && member) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(redirectTo);
    } catch {
      // erreur dans le store
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-8 py-4">
      <BackLink to="/" label="Accueil" />
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-warm-600">Espace privé</p>
        <h1 className="page-title mt-2">Connexion</h1>
        <p className="page-subtitle">Réservé aux membres de la Famille Arbey.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-700">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-500">
        Pas encore de compte ?{' '}
        <Link to="/demande-acces" className="font-medium text-warm-700 hover:underline">
          Demander l&apos;accès
        </Link>
      </p>
    </div>
  );
}
