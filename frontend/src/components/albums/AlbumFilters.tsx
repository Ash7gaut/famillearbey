import { Filter } from 'lucide-react';
import type { Album, AlbumCreator, AlbumVisibility } from '../../types';
import { memberFullName } from '../profile/memberUtils';

export type AlbumVisibilityFilter = 'all' | AlbumVisibility;
export type AlbumCreatorFilter = 'all' | 'mine' | string;

interface AlbumFiltersProps {
  albums: Album[];
  visibilityFilter: AlbumVisibilityFilter;
  creatorFilter: AlbumCreatorFilter;
  currentMemberId?: string;
  onVisibilityChange: (value: AlbumVisibilityFilter) => void;
  onCreatorChange: (value: AlbumCreatorFilter) => void;
}

function getUniqueCreators(albums: Album[]): AlbumCreator[] {
  const seen = new Set<string>();
  const creators: AlbumCreator[] = [];

  for (const album of albums) {
    if (!album.creator || seen.has(album.creator.id)) continue;
    seen.add(album.creator.id);
    creators.push(album.creator);
  }

  return creators.sort((a, b) =>
    memberFullName(a).localeCompare(memberFullName(b), 'fr', { sensitivity: 'base' }),
  );
}

export function filterAlbums(
  albums: Album[],
  visibilityFilter: AlbumVisibilityFilter,
  creatorFilter: AlbumCreatorFilter,
  currentMemberId?: string,
): Album[] {
  return albums.filter((album) => {
    if (visibilityFilter !== 'all' && album.visibility !== visibilityFilter) return false;

    if (creatorFilter === 'all') return true;
    if (creatorFilter === 'mine') return !!currentMemberId && album.created_by === currentMemberId;
    return album.created_by === creatorFilter;
  });
}

export function AlbumFilters({
  albums,
  visibilityFilter,
  creatorFilter,
  currentMemberId,
  onVisibilityChange,
  onCreatorChange,
}: AlbumFiltersProps) {
  const creators = getUniqueCreators(albums);
  const hasMine = !!currentMemberId && albums.some((album) => album.created_by === currentMemberId);

  return (
    <div className="card flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end" data-testid="album-filters">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-600">
        <Filter className="h-4 w-4 text-ink-400" strokeWidth={2} />
        Filtres
      </div>

      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="album-visibility-filter" className="mb-1 block text-xs font-medium text-ink-500">
            Visibilité
          </label>
          <select
            id="album-visibility-filter"
            data-testid="album-visibility-filter-select"
            value={visibilityFilter}
            onChange={(e) => onVisibilityChange(e.target.value as AlbumVisibilityFilter)}
            className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm text-ink-800 focus:border-warm-400 focus:outline-none focus:ring-2 focus:ring-warm-100"
          >
            <option value="all">Tous les albums</option>
            <option value="family">Toute la famille</option>
            <option value="close_family">Petite famille uniquement</option>
          </select>
        </div>

        <div>
          <label htmlFor="album-creator-filter" className="mb-1 block text-xs font-medium text-ink-500">
            Créateur
          </label>
          <select
            id="album-creator-filter"
            data-testid="album-creator-filter-select"
            value={creatorFilter}
            onChange={(e) => onCreatorChange(e.target.value as AlbumCreatorFilter)}
            className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm text-ink-800 focus:border-warm-400 focus:outline-none focus:ring-2 focus:ring-warm-100"
          >
            <option value="all">Tous les créateurs</option>
            {hasMine && <option value="mine">Mes albums</option>}
            {creators.map((creator) => (
              <option key={creator.id} value={creator.id}>
                {memberFullName(creator)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
