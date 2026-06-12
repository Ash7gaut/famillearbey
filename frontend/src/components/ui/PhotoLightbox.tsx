import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PhotoLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
  /** compact = avatar profil · full = albums, taille réelle dans la fenêtre */
  size?: 'compact' | 'full';
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  positionLabel?: string;
}

export function PhotoLightbox({
  src,
  alt,
  onClose,
  size = 'full',
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  positionLabel,
}: PhotoLightboxProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && hasPrevious) onPrevious?.();
      if (event.key === 'ArrowRight' && hasNext) onNext?.();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, hasPrevious, hasNext, onPrevious, onNext]);

  const imageClassName =
    size === 'compact'
      ? 'relative z-10 max-h-[55vh] max-w-[min(88vw,22rem)] rounded-2xl object-contain shadow-[0_16px_48px_-12px_rgba(0,0,0,0.45)] sm:max-w-sm'
      : 'relative z-10 max-h-[90vh] max-w-[min(95vw,1200px)] w-auto h-auto rounded-lg object-contain shadow-[0_16px_48px_-12px_rgba(0,0,0,0.45)]';

  const navButtonClassName =
    'focus-ring absolute top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-cream-200 bg-cream-50 text-ink-800 shadow-[0_4px_24px_rgba(0,0,0,0.28)] transition hover:border-warm-300 hover:bg-white hover:text-warm-800 sm:h-14 sm:w-14';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-md" aria-hidden />

      <button
        type="button"
        onClick={onClose}
        className="focus-ring absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink-900/50 text-white transition hover:bg-ink-900/70"
        aria-label="Fermer"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </button>

      {positionLabel && (
        <p className="absolute left-4 top-4 z-20 rounded-full border border-white/15 bg-ink-900/45 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
          {positionLabel}
        </p>
      )}

      {hasPrevious && onPrevious && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className={`${navButtonClassName} left-4 sm:left-8`}
          aria-label="Photo précédente"
        >
          <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.5} />
        </button>
      )}

      {hasNext && onNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className={`${navButtonClassName} right-4 sm:right-8`}
          aria-label="Photo suivante"
        >
          <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.5} />
        </button>
      )}

      <img
        src={src}
        alt={alt}
        className={imageClassName}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
