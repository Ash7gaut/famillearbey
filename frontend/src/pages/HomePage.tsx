import { Link } from 'react-router-dom';

const features = [
  {
    to: '/tree',
    icon: '🌳',
    title: 'Arbre généalogique',
    description: 'Explorez les liens de la Famille Arbey à travers les générations.',
  },
  {
    to: '/albums',
    icon: '📸',
    title: 'Albums photos',
    description: 'Revivez Noël, les vacances et tous les moments partagés.',
  },
  {
    to: '/quiz',
    icon: '🧠',
    title: 'Quiz familial',
    description: 'Qui est né le 3 janvier ? Teste tes connaissances sur la famille !',
  },
  {
    to: '#',
    icon: '💬',
    title: 'Mur familial',
    description: 'Bientôt : partagez nouvelles et photos avec toute la famille.',
    soon: true,
  },
  {
    to: '#',
    icon: '🎁',
    title: 'Secret Santa',
    description: 'Bientôt : le tirage au sort annuel de la Famille Arbey.',
    soon: true,
  },
  {
    to: '#',
    icon: '📅',
    title: 'Événements',
    description: 'Bientôt : réunions, RSVP et calendrier familial.',
    soon: true,
  },
  {
    to: '#',
    icon: '📚',
    title: 'Mémoire familiale',
    description: 'Bientôt : recettes, anecdotes et histoires transmises.',
    soon: true,
  },
];

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center py-8">
        <p className="text-5xl mb-4">🌳</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-arbey-900">
          Bienvenue dans FamilyHub
        </h1>
        <p className="mt-3 text-arbey-600 max-w-lg mx-auto">
          La plateforme privée de la Famille Arbey — souvenirs, arbre généalogique
          et moments partagés, au même endroit.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.title} className="relative">
            {feature.soon ? (
              <div className="card opacity-60 cursor-not-allowed">
                <FeatureContent {...feature} />
                <span className="absolute top-4 right-4 rounded-full bg-warm-100 px-2.5 py-0.5 text-xs font-medium text-warm-700">
                  Bientôt
                </span>
              </div>
            ) : (
              <Link to={feature.to} className="card block transition hover:border-arbey-200 hover:shadow-md">
                <FeatureContent {...feature} />
              </Link>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function FeatureContent({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <span className="text-3xl">{icon}</span>
      <h2 className="mt-3 font-display text-lg font-semibold text-arbey-900">{title}</h2>
      <p className="mt-1.5 text-sm text-arbey-600">{description}</p>
    </>
  );
}
