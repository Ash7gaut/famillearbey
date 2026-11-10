import { useCallback, useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { api } from '../../services/api';
import type { ReceiverWishlistItem } from '../../types/secretSanta';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { WishlistItemCard } from './WishlistItemCard';

interface ReceiverWishlistProps {
  /** Ex. `/secret-santa/<id>` (membre) ou `/secret-santa/invite/<token>` (invité externe). */
  basePath: string;
  receiverName: string;
}

export function ReceiverWishlist({ basePath, receiverName }: ReceiverWishlistProps) {
  const [items, setItems] = useState<ReceiverWishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<ReceiverWishlistItem[]>(`${basePath}/receiver-wishlist`));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePick(item: ReceiverWishlistItem) {
    const picked = !item.picked;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, picked } : i)));
    try {
      const path = `${basePath}/receiver-wishlist/${item.id}/pick`;
      if (picked) await api.put(path);
      else await api.delete(path);
    } catch (e) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, picked: item.picked } : i)));
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  return (
    <div className="card" data-testid="receiver-wishlist">
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-arbey-600" strokeWidth={2} />
        <h2 className="font-display font-semibold text-arbey-900">
          Idées cadeaux de {receiverName}
        </h2>
      </div>
      <p className="mt-1 text-xs text-arbey-500">
        Coche ce que tu comptes offrir pour t&apos;y retrouver : {receiverName} ne le verra pas.
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300" data-testid="wishlist-error">
          {error}
        </p>
      )}

      {loading ? (
        <LoadingSpinner data-testid="wishlist-loading-spinner" />
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500" data-testid="wishlist-empty">
          {receiverName} n&apos;a pas encore ajouté d&apos;idées. Repasse un peu plus tard !
        </p>
      ) : (
        <ul className="mt-4 space-y-2" data-testid="wishlist-list">
          {items.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              highlighted={item.picked}
              actions={
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-700">
                  <input
                    type="checkbox"
                    checked={item.picked}
                    onChange={() => void togglePick(item)}
                    data-testid={`wishlist-pick-checkbox-${item.id}`}
                    className="h-4 w-4 rounded border-cream-400 accent-warm-600"
                  />
                  Je prends ça
                </label>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
