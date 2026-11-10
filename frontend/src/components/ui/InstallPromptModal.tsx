import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAuthReady } from '../../hooks/useAuthReady';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

// Fermeture valable pour la session en cours uniquement (rien de persistant) :
// au prochain chargement de l'app, la modale revient.
let dismissedThisSession = false;

export function InstallPromptModal() {
  const { isAuthenticated } = useAuthReady();
  const { canInstall, isStandalone, isIOS, isMobileDevice, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(dismissedThisSession);

  // iOS : pas d'API d'installation, on affiche des instructions. Autres navigateurs :
  // seulement si beforeinstallprompt a été reçu (sinon non compatible, ex. Firefox Android).
  // Mobile/tablette uniquement : jamais sur ordinateur (le bouton du UserMenu reste disponible).
  const open =
    isAuthenticated && isMobileDevice && !isStandalone && !dismissed && (canInstall || isIOS);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  function close() {
    dismissedThisSession = true;
    setDismissed(true);
  }

  async function handleInstall() {
    await install();
    close();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      onClick={close}
      data-testid="install-prompt-overlay"
    >
      <div className="absolute inset-0 bg-ink-900/55 backdrop-blur-md" aria-hidden />

      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 shadow-[0_16px_48px_-12px_rgba(44,36,25,0.35)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-prompt-title"
        data-testid="install-prompt-modal"
      >
        <div className="flex items-start justify-between gap-3 border-b border-cream-300/60 px-5 py-4">
          <div>
            <h2 id="install-prompt-title" className="font-display text-lg font-semibold text-ink-800">
              Installe l'appli !
            </h2>
            <p className="mt-1 text-sm text-ink-500">C'est encore mieux !</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="focus-ring -mr-1 shrink-0 rounded-lg p-1 text-ink-400 transition hover:text-ink-700"
            data-testid="install-prompt-close-button"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {canInstall ? (
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="btn-primary w-full"
              data-testid="install-prompt-submit-button"
            >
              Installer
            </button>
          ) : (
            <ol className="space-y-3" data-testid="install-prompt-ios-instructions">
              <li className="flex items-center gap-3" data-testid="install-prompt-ios-step-share">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arbey-100 text-xs font-semibold text-arbey-700">
                  1
                </span>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cream-300 bg-cream-100 text-arbey-700"
                  aria-hidden
                >
                  {/* Bouton Partager d'iOS : carré ouvert en haut + flèche vers le haut */}
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1.5" />
                    <path d="M12 15V3" />
                    <path d="m8.5 6.5 3.5-3.5 3.5 3.5" />
                  </svg>
                </span>
                <p className="text-sm text-ink-700">
                  Appuie sur le bouton <strong>Partager</strong> dans la barre de Safari
                </p>
              </li>
              <li className="flex items-center gap-3" data-testid="install-prompt-ios-step-add">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arbey-100 text-xs font-semibold text-arbey-700">
                  2
                </span>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cream-300 bg-cream-100 text-arbey-700"
                  aria-hidden
                >
                  {/* Entrée « Sur l'écran d'accueil » : carré arrondi avec un + */}
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
                    <path d="M12 8v8" />
                    <path d="M8 12h8" />
                  </svg>
                </span>
                <p className="text-sm text-ink-700">
                  Choisis <strong>« Sur l'écran d'accueil »</strong>
                </p>
              </li>
            </ol>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
