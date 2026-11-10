import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Gift, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { fetchLinkPreview, parseHttpsUrl } from '../../lib/linkPreview';
import type { WishlistItem, WishlistItemInput } from '../../types/secretSanta';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { WishlistItemCard } from './WishlistItemCard';

const MAX_ITEMS = 20;

interface WishlistEditorProps {
  /** Ex. `/secret-santa/<id>` (membre) ou `/secret-santa/invite/<token>` (invité externe). */
  basePath: string;
}

export function WishlistEditor({ basePath }: WishlistEditorProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ item: WishlistItem | null } | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<WishlistItem[]>(`${basePath}/wishlist`));
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

  async function remove(item: WishlistItem) {
    if (!confirm(`Retirer « ${item.title} » de ta liste ?`)) return;
    try {
      await api.delete(`${basePath}/wishlist/${item.id}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  return (
    <div className="card" data-testid="wishlist-editor">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-arbey-600" strokeWidth={2} />
            <h2 className="font-display font-semibold text-arbey-900">Ma liste de souhaits</h2>
          </div>
          <p className="mt-1 text-xs text-arbey-500">
            Ces idées seront visibles uniquement par la personne qui t&apos;aura tiré.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ item: null })}
          disabled={items.length >= MAX_ITEMS}
          data-testid="wishlist-add-button"
          className="btn-secondary shrink-0"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Ajouter
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300" data-testid="wishlist-error">
          {error}
        </p>
      )}

      {loading ? (
        <LoadingSpinner data-testid="wishlist-loading-spinner" />
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500" data-testid="wishlist-empty">
          Ta liste est vide. Ajoute des idées (avec un lien Amazon, Cdiscount…) pour aider ton Père Noël.
        </p>
      ) : (
        <ul className="mt-4 space-y-2" data-testid="wishlist-list">
          {items.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => setModal({ item })}
                    data-testid={`wishlist-edit-button-${item.id}`}
                    className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-700 hover:bg-cream-200"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    data-testid={`wishlist-delete-button-${item.id}`}
                    className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#9A4A42] hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Retirer
                  </button>
                </>
              }
            />
          ))}
        </ul>
      )}

      {modal && (
        <WishlistFormModal
          basePath={basePath}
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={(saved) => {
            setItems((prev) =>
              prev.some((i) => i.id === saved.id)
                ? prev.map((i) => (i.id === saved.id ? saved : i))
                : [...prev, saved],
            );
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function WishlistFormModal({
  basePath,
  item,
  onClose,
  onSaved,
}: {
  basePath: string;
  item: WishlistItem | null;
  onClose: () => void;
  onSaved: (item: WishlistItem) => void;
}) {
  const [url, setUrl] = useState(item?.url ?? '');
  const [title, setTitle] = useState(item?.title ?? '');
  const [price, setPrice] = useState(item?.price ?? '');
  const [note, setNote] = useState(item?.note ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image_url ?? null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPreview(rawUrl: string) {
    const clean = parseHttpsUrl(rawUrl);
    if (!clean) {
      setError('Colle un lien commençant par https://');
      return;
    }
    setError(null);
    setPreviewFailed(false);
    setPreviewLoading(true);
    try {
      const preview = await fetchLinkPreview(clean);
      if (preview.title) setTitle(preview.title);
      setImageUrl(preview.image_url);
    } catch {
      // Repli : l'utilisateur saisit titre / prix à la main, le lien reste enregistré
      setPreviewFailed(true);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const cleanUrl = url.trim() ? parseHttpsUrl(url) : null;
    if (url.trim() && !cleanUrl) {
      setError('Le lien doit commencer par https://');
      return;
    }
    if (!title.trim()) {
      setError('Donne un titre à cette idée');
      return;
    }

    const body: WishlistItemInput = {
      title: title.trim(),
      url: cleanUrl,
      image_url: imageUrl,
      price: price.trim() || null,
      note: note.trim() || null,
    };

    setSaving(true);
    setError(null);
    try {
      const saved = item
        ? await api.patch<WishlistItem>(`${basePath}/wishlist/${item.id}`, body)
        : await api.post<WishlistItem>(`${basePath}/wishlist`, body);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setSaving(false);
    }
  }

  // Verrouille le scroll de la page derrière la modale
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Portail dans <body> + z-[100] : au-dessus de la barre de navigation mobile (comme les autres modales)
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      data-testid="wishlist-add-overlay"
    >
      <div
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg space-y-4 overflow-y-auto overscroll-contain rounded-2xl border border-cream-300 bg-cream-50 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="wishlist-add-modal"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-800" data-testid="wishlist-modal-title">
            {item ? 'Modifier l\'idée' : 'Ajouter une idée'}
          </h2>
          <button
            type="button"
            className="focus-ring rounded-lg p-1 text-ink-500 hover:text-ink-800"
            onClick={onClose}
            data-testid="wishlist-close-button"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300"
            data-testid="wishlist-form-error"
          >
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3" data-testid="wishlist-form">
          <div className="space-y-1">
            <label htmlFor="wishlist-url-input" className="text-xs font-medium text-ink-600">
              Lien du produit (optionnel)
            </label>
            <div className="flex gap-2">
              <input
                id="wishlist-url-input"
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={(e) => {
                  // Aperçu auto au collage : on attend que la valeur soit à jour
                  const pasted = e.clipboardData.getData('text');
                  if (parseHttpsUrl(pasted) && !title.trim()) {
                    e.preventDefault();
                    setUrl(pasted.trim());
                    void loadPreview(pasted);
                  }
                }}
                placeholder="https://www.amazon.fr/…"
                maxLength={2000}
                data-testid="wishlist-url-input"
                className="input-field min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => void loadPreview(url)}
                disabled={!url.trim() || previewLoading}
                data-testid="wishlist-preview-button"
                className="btn-secondary shrink-0"
              >
                Aperçu
              </button>
            </div>
            {previewLoading && (
              <p className="text-xs text-ink-500" data-testid="wishlist-preview-loading">
                Récupération de l&apos;aperçu…
              </p>
            )}
            {previewFailed && (
              <p className="text-xs text-warm-700" data-testid="wishlist-preview-failed">
                Aperçu indisponible pour ce site : renseigne le titre et le prix à la main, le lien est conservé.
              </p>
            )}
          </div>

          {imageUrl && (
            <div className="flex items-center gap-3" data-testid="wishlist-preview-image-row">
              <img
                src={imageUrl}
                alt=""
                referrerPolicy="no-referrer"
                data-testid="wishlist-preview-image"
                className="h-16 w-16 rounded-lg bg-white object-contain"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                data-testid="wishlist-remove-image-button"
                className="text-xs font-medium text-ink-500 hover:underline"
              >
                Retirer l&apos;image
              </button>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="wishlist-title-input" className="text-xs font-medium text-ink-600">
              Titre *
            </label>
            <input
              id="wishlist-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              data-testid="wishlist-title-input"
              className="input-field"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="wishlist-price-input" className="text-xs font-medium text-ink-600">
              Prix (optionnel)
            </label>
            <input
              id="wishlist-price-input"
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              maxLength={40}
              placeholder="ex. 24,90 €"
              data-testid="wishlist-price-input"
              className="input-field"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="wishlist-note-input" className="text-xs font-medium text-ink-600">
              Précision (taille, couleur…)
            </label>
            <textarea
              id="wishlist-note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              rows={2}
              data-testid="wishlist-note-input"
              className="input-field resize-none"
            />
          </div>

          {/* Bouton collé en bas du défilement : toujours atteignable (petits écrans, clavier ouvert) */}
          <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-cream-300/60 bg-cream-50 px-5 pb-5 pt-3">
            <button
              type="submit"
              disabled={saving}
              data-testid="wishlist-submit-button"
              className="btn-primary w-full"
            >
              {item ? 'Enregistrer' : 'Ajouter à ma liste'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
