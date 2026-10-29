import { Link, Outlet } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
export function GuestLayout() {
  return (
    <div className="min-h-screen bg-cream-100">
      <header className="pt-safe border-b border-cream-300/60 bg-cream-50/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" data-testid="guest-logo-link" className="focus-ring min-w-0 rounded-lg px-1 py-0.5">
            <p className="font-display text-lg font-semibold text-ink-800">Famille Arbey</p>
            <p className="text-xs text-ink-400">Espace invité</p>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link
              to="/mes-invitations"
              data-testid="guest-invitations-link"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm font-medium text-ink-700 transition hover:border-warm-200 hover:bg-warm-50"
            >
              <Gift className="h-4 w-4 text-warm-600" strokeWidth={1.75} />
              Mes invitations
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
