import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface PhotoLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function PhotoLightbox({ src, alt, onClose }: PhotoLightboxProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
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

      <img
        src={src}
        alt={alt}
        className="relative z-10 max-h-[55vh] max-w-[min(88vw,22rem)] rounded-2xl object-contain shadow-[0_16px_48px_-12px_rgba(0,0,0,0.45)] sm:max-w-sm"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
