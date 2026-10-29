import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, Trash2 } from 'lucide-react';
import { memberFullName } from '../components/profile/memberUtils';
import { useAlbumStore } from '../stores/albumStore';
import { AlbumCreatorLine } from '../components/albums/AlbumCreatorLine';
import { AlbumVisibilityBadge } from '../components/albums/AlbumVisibilityBadge';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { PhotoCommentsPanel } from '../components/comments/PhotoCommentsPanel';
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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

    const deletedIndex = photos.findIndex((photo) => photo.id === photoId);
    setDeletingPhotoId(photoId);
    try {
      await deletePhoto(photoId);
      if (lightboxIndex === null || deletedIndex === -1) return;

      if (photos.length <= 1) {
        setLightboxIndex(null);
      } else if (deletedIndex === lightboxIndex) {
        setLightboxIndex(Math.min(lightboxIndex, photos.length - 2));
      } else if (deletedIndex < lightboxIndex) {
        setLightboxIndex(lightboxIndex - 1);
      }
    } catch {
      // erreur API
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const activeLightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  if (loading && !currentAlbum) return <LoadingSpinner data-testid="album-detail-loading-spinner" />;
  if (error) return <ErrorMessage message={error} onRetry={() => id && fetchPhotos(id)} />;

  return (
    <div className="space-y-6" data-testid="album-detail-page">
      {activeLightboxPhoto && lightboxIndex !== null && (
        <PhotoLightbox
          src={activeLightboxPhoto.url}
          alt={activeLightboxPhoto.caption ?? 'Photo'}
          onClose={() => {
            setLightboxIndex(null);
            if (id) void fetchPhotos(id);
          }}
          size="full"
          hasPrevious={lightboxIndex > 0}
          hasNext={lightboxIndex < photos.length - 1}
          onPrevious={() => setLightboxIndex((index) => (index !== null && index > 0 ? index - 1 : index))}
          onNext={() =>
            setLightboxIndex((index) =>
              index !== null && index < photos.length - 1 ? index + 1 : index,
            )
          }
          positionLabel={`${lightboxIndex + 1} / ${photos.length}`}
          sidePanel={<PhotoCommentsPanel key={activeLightboxPhoto.id} photoId={activeLightboxPhoto.id} />}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <BackLink to="/albums" label="Albums" data-testid="album-detail-back-link" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="page-title" data-testid="album-detail-title">{currentAlbum?.title}</h1>
            {currentAlbum && <AlbumVisibilityBadge visibility={currentAlbum.visibility} />}
          </div>
          {currentAlbum && <AlbumCreatorLine creator={currentAlbum.creator} className="mt-1" />}
          {currentAlbum?.description && (
            <p className="mt-1 text-sm text-arbey-600" data-testid="album-detail-description">{currentAlbum.description}</p>
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
                data-testid="album-photo-upload-input"
              />
              <label htmlFor="photo-upload" className="btn-primary cursor-pointer" data-testid="album-photo-upload-label">
                + Ajouter une photo
              </label>
            </>
          ) : (
            <Link to="/login" className="btn-secondary" data-testid="album-detail-login-link">
              Se connecter pour ajouter
            </Link>
          )}

          {currentAlbum?.can_manage && (
            <button
              type="button"
              onClick={() => void handleDeleteAlbum()}
              disabled={deletingAlbum}
              data-testid="album-delete-button"
              className="btn-secondary inline-flex items-center gap-2 text-red-700 hover:border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              {deletingAlbum ? 'Suppression…' : 'Supprimer l\'album'}
            </button>
          )}
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="card py-12 text-center" data-testid="album-photos-empty">
          <p className="mb-3 text-4xl">🖼️</p>
          <p className="text-arbey-600">Cet album est vide. Ajoutez la première photo !</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4" data-testid="photo-list">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              data-testid={`photo-${photo.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-cream-300/70 bg-cream-100 shadow-sm"
            >
              <div className="relative aspect-square overflow-hidden">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  data-testid={`photo-open-button-${photo.id}`}
                  className="focus-ring block h-full w-full cursor-zoom-in"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption ?? 'Photo'}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-ink-900/0 transition group-hover:bg-ink-900/10" />
                </button>

                {photo.can_delete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeletePhoto(photo.id);
                    }}
                    disabled={deletingPhotoId === photo.id}
                    data-testid={`photo-delete-button-${photo.id}`}
                    className="focus-ring absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream-200 bg-cream-50/95 text-red-600 opacity-0 shadow-[0_2px_10px_rgba(44,36,25,0.18)] backdrop-blur-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 group-hover:opacity-100 disabled:opacity-60"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                )}

                {photo.caption && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 via-ink-900/25 to-transparent px-3 pb-3 pt-8">
                    <p className="line-clamp-2 text-xs text-white" data-testid={`photo-caption-${photo.id}`}>{photo.caption}</p>
                  </div>
                )}
              </div>

              {photo.latest_comment && (
                <div className="flex items-start gap-2 border-t border-cream-300/60 bg-cream-50 px-3 py-2" data-testid={`photo-latest-comment-${photo.id}`}>
                  <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-arbey-500" strokeWidth={2} />
                  <p className="line-clamp-2 min-w-0 text-xs leading-relaxed text-ink-600">
                    <span className="font-medium text-ink-800">
                      {memberFullName(photo.latest_comment.author)}
                    </span>
                    {' · '}
                    {photo.latest_comment.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
