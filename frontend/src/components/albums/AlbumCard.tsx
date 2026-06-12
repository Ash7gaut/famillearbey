import { Link } from 'react-router-dom';
import { Images } from 'lucide-react';
import type { Album } from '../../types';
import { AlbumVisibilityBadge } from './AlbumVisibilityBadge';

interface AlbumCardProps {
  album: Album;
}

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link to={`/albums/${album.id}`} className="card-photo group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-cream-200 to-warm-100">
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt={album.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <Images className="h-12 w-12" strokeWidth={1.25} />
          </div>
        )}
        {album.visibility === 'close_family' && (
          <div className="absolute left-3 top-3">
            <AlbumVisibilityBadge visibility={album.visibility} className="bg-cream-50/95 shadow-sm" />
          </div>
        )}
      </div>
      <div className="border-t border-cream-300/50 bg-cream-50 px-4 py-3.5">
        <h3 className="font-display font-semibold text-ink-800">{album.title}</h3>
        {album.event_date && (
          <p className="mt-1 text-xs text-ink-400">{formatDate(album.event_date)}</p>
        )}
        {album.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-500">{album.description}</p>
        )}
      </div>
    </Link>
  );
}
