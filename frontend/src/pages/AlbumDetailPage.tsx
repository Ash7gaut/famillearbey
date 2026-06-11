import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAlbumStore } from '../stores/albumStore';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentAlbum, photos, loading, error, fetchAlbum, fetchPhotos, uploadPhoto } =
    useAlbumStore();

  useEffect(() => {
    if (id) {
      fetchAlbum(id);
      fetchPhotos(id);
    }
  }, [id, fetchAlbum, fetchPhotos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await uploadPhoto(id, file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading && !currentAlbum) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => id && fetchPhotos(id)} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <BackLink to="/albums" label="Albums" />
          <h1 className="page-title">
            {currentAlbum?.title}
          </h1>
          {currentAlbum?.description && (
            <p className="mt-1 text-sm text-arbey-600">{currentAlbum.description}</p>
          )}
        </div>
        <div>
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
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="text-arbey-600">Cet album est vide. Ajoutez la première photo !</p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl bg-arbey-50"
            >
              <img
                src={photo.url}
                alt={photo.caption ?? 'Photo'}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-arbey-950/60 to-transparent p-3">
                  <p className="text-xs text-white line-clamp-2">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
