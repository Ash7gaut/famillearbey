import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Ellipsis, Share, SquarePlus } from 'lucide-react';

interface InstallInstructionsModalProps {
  onClose: () => void;
  platform: 'ios' | 'generic';
}

const steps = {
  ios: {
    subtitle: 'Sur iPhone/iPad, l\'installation se fait depuis Safari.',
    items: [
      { icon: Share, text: <>Appuie sur le bouton <strong>Partager</strong> dans la barre de Safari</> },
      { icon: SquarePlus, text: <>Choisis <strong>« Sur l'écran d'accueil »</strong></> },
    ],
  },
  generic: {
    subtitle: 'L\'installation se fait depuis le menu de ton navigateur.',
    items: [
      { icon: Ellipsis, text: <>Ouvre le menu <strong>⋮</strong> en haut à droite du navigateur</> },
      { icon: SquarePlus, text: <>Choisis <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong></> },
    ],
  },
};

export function InstallInstructionsModal({ onClose, platform }: InstallInstructionsModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const { subtitle, items } = steps[platform];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink-900/55 backdrop-blur-md" aria-hidden />

      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 shadow-[0_16px_48px_-12px_rgba(44,36,25,0.35)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-instructions-title"
      >
        <div className="border-b border-cream-300/60 px-5 py-4">
          <h2 id="install-instructions-title" className="font-display text-lg font-semibold text-ink-800">
            Installer l'app
          </h2>
          <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
        </div>

        <div className="space-y-4 px-5 py-4">
          {items.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-arbey-100 text-arbey-700">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <p className="text-sm text-ink-700">{text}</p>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-primary">
              Compris
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
