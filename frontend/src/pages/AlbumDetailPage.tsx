import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useAlbumStore } from '../stores/albumStore';
import { AlbumVisibilityBadge } from '../components/albums/AlbumVisibilityBadge';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { PhotoLightbox } from '../components/ui/PhotoLightbox';
import { useAuthReady } from '../hooks/useAuthReady';

export function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuthReady();
  const {
    currentAlbum,
    photos,
    loading,
    error,
    fetchAlbum,
    fetchPhotos,
    uploadPhoto,
    deleteAlbum,
    deletePhoto,
  } = useAlbumStore();
  const [lightboxPhoto, setLightboxPhoto] = useState<{ src: string; alt: string } | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAlbum(id);
      fetchPhotos(id);
    }
  }, [id, fetchAlbum, fetchPhotos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      await uploadPhoto(id, file);
    } catch {
      // erreur API
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAlbum = async () => {
    if (!id || !currentAlbum) return;
    if (
      !confirm(
        `Supprimer l'album « ${currentAlbum.title} » et toutes ses photos ? Cette action est irréversible.`,
      )
    ) {
      return;
    }

    setDeletingAlbum(true);
    try {
      await deleteAlbum(id);
      navigate('/albums');
    } catch {
      setDeletingAlbum(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Supprimer cette photo ?')) return;

    const deletedPhoto = photos.find((photo) => photo.id === photoId);
    setDeletingPhotoId(photoId);
    try {
      await deletePhoto(photoId);
      if (lightboxPhoto && deletedPhoto?.url === lightboxPhoto.src) {
        setLightboxPhoto(null);
      }
    } catch {
      // erreur API
    } finally {
      setDeletingPhotoId(null);
    }
  };

  if (loading && !currentAlbum) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => id && fetchPhotos(id)} />;

  return (
    <div className="space-y-6">
      {lightboxPhoto && (
        <PhotoLightbox
          src={lightboxPhoto.src}
          alt={lightboxPhoto.alt}
          onClose={() => setLightboxPhoto(null)}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <BackLink to="/albums" label="Albums" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="page-title">{currentAlbum?.title}</h1>
            {currentAlbum && <AlbumVisibilityBadge visibility={currentAlbum.visibility} />}
          </div>
          {currentAlbum?.description && (
            <p className="mt-1 text-sm text-arbey-600">{currentAlbum.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="btn-primary cursor-pointer">
                + Ajouter une photo
              </label>
            </>
          ) : (
            <Link to="/connexion" className="btn-secondary">
              Se connecter pour ajouter
            </Link>
          )}

          {currentAlbum?.can_manage && (
            <button
              type="button"
              onClick={() => void handleDeleteAlbum()}
              disabled={deletingAlbum}
              className="btn-secondary inline-flex items-center gap-2 text-red-700 hover:border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              {deletingAlbum ? 'Suppression…' : 'Supprimer l\'album'}
            </button>
          )}
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="mb-3 text-4xl">🖼️</p>
          <p className="text-arbey-600">Cet album est vide. Ajoutez la première photo !</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl bg-arbey-50"
            >
              <button
                type="button"
                onClick={() =>
                  setLightboxPhoto({
                    src: photo.url,
                    alt: photo.caption ?? 'Photo',
                  })
                }
                className="focus-ring block h-full w-full cursor-zoom-in"
              >
                <img
                  src={photo.url}
                  alt={photo.caption ?? 'Photo'}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </button>

              {photo.can_delete && (
                <button
                  type="button"
                  onClick={() => void handleDeletePhoto(photo.id)}
                  disabled={deletingPhotoId === photo.id}
                  className="focus-ring absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-ink-900/55 text-white opacity-0 transition hover:bg-ink-900/75 group-hover:opacity-100 disabled:opacity-60"
                  title="Supprimer la photo"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </button>
              )}

              {photo.caption && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-arbey-950/60 to-transparent p-3">
                  <p className="line-clamp-2 text-xs text-white">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
