import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { ZoomIn } from 'lucide-react';
import { getCroppedImageBlob } from '../../lib/cropImage';

interface ProfilePhotoCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void>;
}

export function ProfilePhotoCropModal({
  imageSrc,
  onClose,
  onConfirm,
}: ProfilePhotoCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  async function handleConfirm() {
    if (!croppedArea) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedArea);
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      await onConfirm(file);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-ink-900/55 backdrop-blur-md"
        aria-hidden
      />

      <div
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 shadow-[0_16px_48px_-12px_rgba(44,36,25,0.35)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-photo-title"
      >
        <div className="border-b border-cream-300/60 px-5 py-4">
          <h2 id="crop-photo-title" className="font-display text-lg font-semibold text-ink-800">
            Ajuster la photo
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Déplace et zoome pour cadrer ton portrait.
          </p>
        </div>

        <div className="relative h-72 bg-ink-900 sm:h-80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-ink-500">
              <ZoomIn className="h-3.5 w-3.5" strokeWidth={2} />
              Zoom
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-warm-600"
              aria-label="Zoom"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="btn-secondary">
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={saving || !croppedArea}
              className="btn-primary"
            >
              {saving ? 'Enregistrement…' : 'Valider la photo'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
