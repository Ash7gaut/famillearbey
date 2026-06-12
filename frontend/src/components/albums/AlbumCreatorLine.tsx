import { Link } from 'react-router-dom';
import type { AlbumCreator } from '../../types';
import { memberFullName } from '../profile/memberUtils';

interface AlbumCreatorLineProps {
  creator: AlbumCreator | null | undefined;
  className?: string;
  linkToProfile?: boolean;
}

export function AlbumCreatorLine({
  creator,
  className = '',
  linkToProfile = true,
}: AlbumCreatorLineProps) {
  if (!creator) {
    return (
      <p className={`text-xs text-ink-400 ${className}`}>Créé par un membre de la famille</p>
    );
  }

  const label = `Créé par ${memberFullName(creator)}`;

  if (linkToProfile) {
    return (
      <p className={`text-xs text-ink-400 ${className}`}>
        Créé par{' '}
        <Link
          to={`/profil/${creator.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-ink-600 underline decoration-ink-300/60 underline-offset-2 transition hover:text-warm-700"
        >
          {memberFullName(creator)}
        </Link>
      </p>
    );
  }

  return <p className={`text-xs text-ink-400 ${className}`}>{label}</p>;
}
