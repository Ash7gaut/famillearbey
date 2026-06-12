import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlbumStore } from '../stores/albumStore';
import { AlbumCard } from '../components/albums/AlbumCard';
import {
  AlbumFilters,
  filterAlbums,
  type AlbumCreatorFilter,
  type AlbumVisibilityFilter,
} from '../components/albums/AlbumFilters';
import { AlbumVisibilityOption } from '../components/albums/AlbumVisibilityBadge';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuthReady } from '../hooks/useAuthReady';
import type { AlbumVisibility } from '../types';

export function AlbumsPage() {
  const { albums, loading, error, fetchAlbums, createAlbum } = useAlbumStore();
  const { isAuthenticated, member } = useAuthReady();
  const [showForm, setShowForm] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<AlbumVisibilityFilter>('all');
  const [creatorFilter, setCreatorFilter] = useState<AlbumCreatorFilter>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [visibility, setVisibility] = useState<AlbumVisibility>('family');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const filteredAlbums = useMemo(
    () => filterAlbums(albums, visibilityFilter, creatorFilter, member?.id),
    [albums, visibilityFilter, creatorFilter, member?.id],
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !isAuthenticated) return;
    setCreating(true);
    try {
      await createAlbum({
        title,
        description: description || undefined,
        event_date: eventDate || undefined,
        visibility,
      });
      setTitle('');
      setDescription('');
      setEventDate('');
      setVisibility('family');
      setShowForm(false);
    } catch {
      // erreur gérée par le store
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackLink to="/" label="Accueil" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Albums photos</h1>
          <p className="page-subtitle">
            Souvenirs de la famille, album par album.
          </p>
        </div>
        {isAuthenticated ? (
          <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary shrink-0">
            + Nouvel album
          </button>
        ) : (
          <Link to="/connexion" className="btn-secondary shrink-0">
            Se connecter pour créer
          </Link>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-arbey-700">
              Titre
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Noël Arbey 2026"
              className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm focus:border-arbey-400 focus:outline-none focus:ring-2 focus:ring-arbey-100"
              required
            />
          </div>
          <div>
            <label htmlFor="event-date" className="mb-1 block text-sm font-medium text-arbey-700">
              Date de l&apos;événement (optionnel)
            </label>
            <input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full max-w-xs rounded-xl border border-arbey-200 px-4 py-2.5 text-sm focus:border-arbey-400 focus:outline-none focus:ring-2 focus:ring-arbey-100"
            />
            <p className="mt-1 text-xs text-ink-400">Affichée sur le calendrier familial.</p>
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-arbey-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Un moment inoubliable en famille..."
              rows={2}
              className="w-full resize-none rounded-xl border border-arbey-200 px-4 py-2.5 text-sm focus:border-arbey-400 focus:outline-none focus:ring-2 focus:ring-arbey-100"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-arbey-700">Qui peut voir cet album ?</legend>
            <AlbumVisibilityOption
              value="family"
              selected={visibility === 'family'}
              onChange={setVisibility}
            />
            <AlbumVisibilityOption
              value="close_family"
              selected={visibility === 'close_family'}
              onChange={setVisibility}
            />
          </fieldset>
          <div className="flex gap-3">
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? 'Création...' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={fetchAlbums} />}

      {!loading && !error && albums.length > 0 && (
        <AlbumFilters
          albums={albums}
          visibilityFilter={visibilityFilter}
          creatorFilter={creatorFilter}
          currentMemberId={member?.id}
          onVisibilityChange={setVisibilityFilter}
          onCreatorChange={setCreatorFilter}
        />
      )}

      {!loading && !error && (
        albums.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="mb-3 text-4xl">📸</p>
            <p className="text-arbey-600">Aucun album pour l'instant. Créez le premier !</p>
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="text-arbey-600">Aucun album ne correspond à ces filtres.</p>
            <button
              type="button"
              onClick={() => {
                setVisibilityFilter('all');
                setCreatorFilter('all');
              }}
              className="btn-secondary mt-4"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-500">
              {filteredAlbums.length} album{filteredAlbums.length > 1 ? 's' : ''}
              {filteredAlbums.length !== albums.length && ` sur ${albums.length}`}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}
