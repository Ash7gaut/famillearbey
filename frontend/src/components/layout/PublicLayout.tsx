import { Link, Outlet } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="pt-safe border-b border-cream-300/60 bg-cream-50/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" data-testid="public-logo-link" className="focus-ring min-w-0 rounded-lg px-1 py-0.5">
            <p className="font-display text-lg font-semibold text-ink-800">Famille Arbey</p>
            <p className="text-xs text-ink-400">Espace privé familial</p>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link to="/login" data-testid="public-login-link" className="btn-secondary hidden px-3 py-2 sm:inline-flex">
              Connexion
            </Link>
            <Link to="/demande-acces" data-testid="public-request-access-link" className="btn-primary px-3 py-2 text-sm">
              Demander l&apos;accès
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>

      <footer className="border-t border-cream-300/60 bg-cream-50/80 py-6">
        <p className="text-center text-xs text-ink-400">
          Réservé aux membres de la Famille Arbey ·{' '}
          <Link to="/login" data-testid="public-footer-login-link" className="font-medium text-warm-700 hover:underline">
            Connexion
          </Link>
        </p>
      </footer>
    </div>
  );
}
