import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface GroupHelpModalProps {
  onClose: () => void;
}

// Source : pages d'aide officielles WhatsApp « How to create and invite into a group »
// (faq.whatsapp.com/3242937609289432). Les pages iPhone et Android décrivent le même parcours
// avec les mêmes libellés (en anglais : « Invite via link or QR code », « Copy link », « Reset link ») ;
// on reste donc générique sur les intitulés français, qui varient selon la version de l'app.
const STEPS: React.ReactNode[] = [
  <>Si le groupe n’existe pas encore, crée-le dans WhatsApp (nouveau groupe).</>,
  <>Ouvre le groupe, puis touche <strong>son nom</strong> en haut de l’écran pour ouvrir les infos du groupe.</>,
  <>Touche l’option d’invitation par lien (<strong>« Inviter via un lien ou un code QR »</strong>, ou un intitulé proche).</>,
  <>Touche <strong>« Copier le lien »</strong>.</>,
  <>Reviens ici et <strong>colle le lien</strong> dans le champ « Lien d’invitation ».</>,
];

const RESET = (
  <>
    Sur ce même écran, touche <strong>« Réinitialiser le lien »</strong> puis confirme. L’ancien lien ne fonctionne plus
    et ne peut pas être rétabli : les personnes qui l’ont encore verront une erreur.
  </>
);

/** Petit schéma d'un écran WhatsApp avec la ligne « Inviter via un lien » mise en avant. */
function Illustration() {
  return (
    <svg
      viewBox="0 0 220 120"
      className="mx-auto h-28 w-auto"
      role="img"
      aria-label="Schéma : dans les infos du groupe, la ligne d’invitation par lien"
      data-testid="group-help-illustration"
    >
      <rect x="62" y="4" width="96" height="112" rx="14" className="fill-cream-200 stroke-ink-400" strokeWidth="2" />
      <circle cx="110" cy="26" r="9" className="fill-cream-400" />
      <rect x="86" y="40" width="48" height="6" rx="3" className="fill-ink-400" />
      <rect x="72" y="56" width="76" height="14" rx="5" className="fill-cream-400" />
      <rect x="72" y="74" width="76" height="16" rx="5" className="fill-warm-200 stroke-warm-600" strokeWidth="2" />
      <rect x="78" y="80" width="42" height="4" rx="2" className="fill-warm-700" />
      <path d="M126 82h14m-4-4 4 4-4 4" className="stroke-warm-700" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="72" y="94" width="76" height="14" rx="5" className="fill-cream-400" />
    </svg>
  );
}

/** Tuto « Comment obtenir le lien d'invitation ? » (iPhone et Android). */
export function GroupHelpModal({ onClose }: GroupHelpModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onClose}
      data-testid="group-help-overlay"
    >
      <div className="absolute inset-0 bg-ink-900/55 backdrop-blur-md" aria-hidden />
      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-cream-300 bg-cream-50 shadow-[0_16px_48px_-12px_rgba(44,36,25,0.35)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-help-title"
        data-testid="group-help-modal"
      >
        <div className="flex items-start justify-between gap-3 border-b border-cream-300/60 px-5 py-4">
          <div>
            <h2 id="group-help-title" className="font-display text-lg font-semibold text-ink-800" data-testid="group-help-title">
              Comment obtenir le lien d’invitation ?
            </h2>
            <p className="mt-1 text-sm text-ink-500">Sur iPhone et Android : quelques touches dans WhatsApp, et c’est fait.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            data-testid="group-help-close-button"
            className="focus-ring -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:text-ink-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <Illustration />

          <ol className="space-y-3" data-testid="group-help-steps">
            {STEPS.map((text, i) => (
              <li key={i} className="flex items-start gap-3" data-testid={`group-help-step-${i}`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-arbey-100 text-sm font-bold text-arbey-700">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-ink-700">{text}</p>
              </li>
            ))}
          </ol>

          <p className="text-xs leading-relaxed text-ink-500">
            Par défaut, les administrateurs du groupe WhatsApp (et les membres, dans les groupes de moins de 33 personnes)
            peuvent créer ce lien ; un admin peut le réserver aux admins dans les autorisations du groupe. Si tu ne le
            trouves pas, demande à un admin. Toute personne qui a le lien peut rejoindre le groupe : ne le partage
            qu’avec des personnes de confiance. Les intitulés peuvent varier un peu selon la version de WhatsApp.
          </p>

          <div className="rounded-xl border border-warm-200 bg-warm-50 px-4 py-3" data-testid="group-help-reset-section">
            <p className="text-sm font-semibold text-warm-800">Si le lien est compromis</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-700">{RESET}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-700">Pense ensuite à coller le nouveau lien dans la fiche du groupe ici.</p>
          </div>

          <div className="flex justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-primary" data-testid="group-help-done-button">
              Compris
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
