import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const { login, loading, error, member, session } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (session && member) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // erreur dans le store
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div className="text-center">
        <p className="text-4xl mb-2">🌳</p>
        <h1 className="font-display text-2xl font-bold text-arbey-900">Connexion</h1>
        <p className="mt-1 text-sm text-arbey-600">
          Accès réservé aux membres de la Famille Arbey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-arbey-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm focus:border-arbey-400 focus:outline-none focus:ring-2 focus:ring-arbey-100"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-arbey-700 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm focus:border-arbey-400 focus:outline-none focus:ring-2 focus:ring-arbey-100"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-sm text-arbey-600">
        Pas encore de compte ?{' '}
        <Link to="/demande-acces" className="font-medium text-arbey-800 hover:underline">
          Demander l'accès
        </Link>
      </p>
    </div>
  );
}
