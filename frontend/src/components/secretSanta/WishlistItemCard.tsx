import type { ReactNode } from 'react';
import { ExternalLink, Gift } from 'lucide-react';
import type { WishlistItem } from '../../types/secretSanta';

interface WishlistItemCardProps {
  item: WishlistItem;
  /** Boutons d'action (édition, suppression, case à cocher…) affichés sous le contenu. */
  actions?: ReactNode;
  highlighted?: boolean;
}

export function WishlistItemCard({ item, actions, highlighted = false }: WishlistItemCardProps) {
  return (
    <li
      data-testid={`wishlist-item-${item.id}`}
      className={`rounded-xl border p-3 ${
        highlighted
          ? 'border-warm-300 bg-warm-50/60 dark:border-warm-500/40 dark:bg-warm-500/10'
          : 'border-cream-300/70 bg-cream-50/80'
      }`}
    >
      <div className="flex items-start gap-3">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            data-testid={`wishlist-item-image-${item.id}`}
            className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-cream-200 text-warm-700">
            <Gift className="h-6 w-6" strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className="break-words text-sm font-medium text-ink-800"
            data-testid={`wishlist-item-title-${item.id}`}
          >
            {item.title}
          </p>
          {item.price && (
            <p className="mt-0.5 text-xs font-semibold text-warm-700" data-testid={`wishlist-item-price-${item.id}`}>
              {item.price}
            </p>
          )}
          {item.note && (
            <p className="mt-1 whitespace-pre-line break-words text-xs text-ink-500" data-testid={`wishlist-item-note-${item.id}`}>
              {item.note}
            </p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`wishlist-item-link-${item.id}`}
              className="focus-ring mt-1.5 inline-flex items-center gap-1 rounded text-xs font-medium text-warm-700 hover:underline"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={2} />
              Voir le produit
            </a>
          )}
        </div>
      </div>
      {actions && <div className="mt-3 flex flex-wrap items-center justify-end gap-2">{actions}</div>}
    </li>
  );
}
