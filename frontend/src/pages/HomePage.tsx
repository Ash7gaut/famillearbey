import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BrainCircuit, Calendar, Gift, Images, MessageCircle, BookOpen, TreePine, Users } from 'lucide-react';
import { useAuthReady } from '../hooks/useAuthReady';

const mainFeatures: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}[] = [
  {
    to: '/tree',
    icon: TreePine,
    title: 'Arbre généalogique',
    description: 'Retrouve les liens entre les générations de la famille.',
    accent: 'from-arbey-100 to-arbey-50',
  },
  {
    to: '/albums',
    icon: Images,
    title: 'Albums photos',
    description: 'Noël, vacances, repas de famille — tous les souvenirs au même endroit.',
    accent: 'from-warm-100 to-cream-100',
  },
];

const otherFeatures: {
  to: string;
  icon: LucideIcon;
  title: string;
  soon?: boolean;
}[] = [
  { to: '/famille', icon: Users, title: 'Annuaire famille' },
  { to: '/quiz', icon: BrainCircuit, title: 'Quiz familial' },
  { to: '/secret-santa', icon: Gift, title: 'Secret Santa' },
  { to: '#', icon: MessageCircle, title: 'Mur familial', soon: true },
  { to: '/calendrier', icon: Calendar, title: 'Calendrier familial' },
  { to: '#', icon: BookOpen, title: 'Mémoire familiale', soon: true },
];

export function HomePage() {
  const { member } = useAuthReady();

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-cream-300/60 bg-cream-50/80 px-6 py-10 shadow-warm sm:px-10 sm:py-12">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-warm-200/30 blur-2xl" aria-hidden />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-arbey-200/25 blur-2xl" aria-hidden />

        <div className="relative max-w-xl">
          <p className="text-sm font-medium uppercase tracking-widest text-warm-600">Bienvenue</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-800 sm:text-4xl">
            Famille Arbey
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-500">
            {member
              ? `Content de te revoir, ${member.first_name} — retrouve l'arbre, les photos et les petits jeux entre cousins.`
              : "Retrouve l'arbre, les photos et les petits jeux entre cousins."}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {mainFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.title}
              to={feature.to}
              className="group relative overflow-hidden rounded-2xl border border-cream-300/60 bg-cream-50 p-6 shadow-warm transition hover:border-warm-200 hover:shadow-warm-md"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-60 transition group-hover:opacity-80`}
                aria-hidden
              />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-warm-700 shadow-sm">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h2 className="mt-4 font-display text-xl font-semibold text-ink-800">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{feature.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-warm-700">
                  Ouvrir
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-ink-700">Autour de la famille</h2>
        <ul className="mt-4 divide-y divide-cream-300/60 rounded-2xl border border-cream-300/60 bg-cream-50/80">
          {otherFeatures.map((feature) => {
            const Icon = feature.icon;
            const content = (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream-200/80 text-ink-600">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="flex-1 font-medium text-ink-700">{feature.title}</span>
                {feature.soon ? (
                  <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-xs font-medium text-warm-700">
                    Bientôt
                  </span>
                ) : (
                  <ArrowRight className="h-4 w-4 text-ink-400" />
                )}
              </>
            );

            if (feature.soon) {
              return (
                <li key={feature.title} className="flex items-center gap-3 px-4 py-3.5 opacity-60">
                  {content}
                </li>
              );
            }

            return (
              <li key={feature.title}>
                <Link
                  to={feature.to}
                  className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-cream-200/40"
                >
                  {content}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
