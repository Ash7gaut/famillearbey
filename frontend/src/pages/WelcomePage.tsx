import { Link, Navigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BrainCircuit,
  Calendar,
  Gift,
  Images,
  Lock,
  TreePine,
  Users,
} from 'lucide-react';
import { useAuthReady } from '../hooks/useAuthReady';
import { hasGuestInvites } from '../lib/guestInviteStorage';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const highlights: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: TreePine,
    title: 'Arbre généalogique',
    description: 'Retrouve les liens entre les générations, du grand-père aux petits-enfants.',
  },
  {
    icon: Images,
    title: 'Albums photos',
    description: 'Noël, vacances, repas de famille — tous les souvenirs au même endroit.',
  },
  {
    icon: Calendar,
    title: 'Calendrier familial',
    description: 'Anniversaires, événements et albums datés pour ne rien oublier.',
  },
  {
    icon: Users,
    title: 'Annuaire',
    description: 'Les profils de chacun, avec bio, dates importantes et photos.',
  },
  {
    icon: Gift,
    title: 'Secret Santa',
    description: 'Organise les tirages entre cousins, même pour les invités externes.',
  },
  {
    icon: BrainCircuit,
    title: 'Quiz familial',
    description: 'Petits jeux pour tester qui connaît le mieux la famille.',
  },
];

export function WelcomePage() {
  const { initialized, isAuthenticated } = useAuthReady();
  const showGuestHub = hasGuestInvites();

  if (!initialized) return <LoadingSpinner data-testid="welcome-loading-spinner" />;
  if (isAuthenticated) return <Navigate to="/messagerie" replace />;

  return (
    <div className="space-y-14" data-testid="welcome-page">
      <section className="relative overflow-hidden rounded-3xl border border-cream-300/60 bg-cream-50/80 px-6 py-12 shadow-warm sm:px-12 sm:py-16">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-warm-200/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-arbey-200/25 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-100 text-2xl shadow-sm">
            🌳
          </div>
          <p className="text-sm font-medium uppercase tracking-widest text-warm-600">
            Espace privé
          </p>
          <h1 data-testid="welcome-title" className="mt-3 font-display text-4xl font-semibold leading-tight text-ink-800 sm:text-5xl">
            Famille Arbey
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink-500 sm:text-lg">
            Notre coin à nous pour retrouver l&apos;arbre, les photos, le calendrier et les petits
            jeux entre cousins. Réservé aux membres de la famille.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login" data-testid="welcome-login-link" className="btn-primary w-full px-6 py-3 text-base sm:w-auto">
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/demande-acces" data-testid="welcome-request-access-link" className="btn-secondary w-full px-6 py-3 text-base sm:w-auto">
              Demander l&apos;accès
            </Link>
          </div>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream-300/80 bg-cream-50/70 px-4 py-2 text-xs text-ink-500">
            <Lock className="h-3.5 w-3.5 text-arbey-500" strokeWidth={2} />
            Contenu visible uniquement après connexion
          </p>
        </div>
      </section>

      {showGuestHub && (
        <section className="card border-warm-200/80 bg-warm-50/50" data-testid="welcome-guest-hub">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-warm-700">Tu participes en invité</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-ink-800">
                Retrouve tes Secret Santa
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Pas besoin de compte — tes invitations sont enregistrées sur cet appareil.
              </p>
            </div>
            <Link to="/mes-invitations" data-testid="welcome-invitations-link" className="btn-primary shrink-0">
              Mes invitations
            </Link>
          </div>
        </section>
      )}

      <section>
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-ink-800">Ce qui t&apos;attend</h2>
          <p className="mt-2 text-sm text-ink-500">
            Une fois connecté, tu accèdes à tout l&apos;espace familial.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="welcome-highlights">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-cream-300/60 bg-cream-50/80 p-5 shadow-warm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-50 text-warm-700 shadow-sm">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink-800">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-arbey-200/60 bg-arbey-50/50 px-6 py-8 text-center sm:px-10">
        <h2 className="font-display text-xl font-semibold text-ink-800">Pas encore de compte ?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
          Crée ta demande d&apos;accès — un administrateur de la famille validera ton inscription
          avant que tu puisses te connecter.
        </p>
        <Link to="/demande-acces" data-testid="welcome-cta-request-access-link" className="btn-primary mt-5 inline-flex">
          Créer ma demande d&apos;accès
        </Link>
      </section>
    </div>
  );
}
