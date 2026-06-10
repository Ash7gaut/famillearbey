import { Link } from 'react-router-dom';
import type { Album } from '../../types';

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
    <Link
      to={`/albums/${album.id}`}
      className="group overflow-hidden rounded-2xl border border-arbey-100 bg-white shadow-sm transition hover:border-arbey-200 hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-arbey-50 to-warm-50">
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt={album.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">📸</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-arbey-900">{album.title}</h3>
        {album.event_date && (
          <p className="mt-1 text-xs text-arbey-500">{formatDate(album.event_date)}</p>
        )}
        {album.description && (
          <p className="mt-2 line-clamp-2 text-sm text-arbey-600">{album.description}</p>
        )}
      </div>
    </Link>
  );
}
