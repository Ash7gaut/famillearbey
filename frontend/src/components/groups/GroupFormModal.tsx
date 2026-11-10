import { useMemo, useState } from 'react';
import { Camera, CircleHelp, Lock, Users, X } from 'lucide-react';
import type { FamilyMember, Tribu, WhatsAppGroup } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useGroupsStore } from '../../stores/groupsStore';
import { GroupAccessPicker } from './GroupAccessPicker';
import { GroupHelpModal } from './GroupHelpModal';

const INVITE_LINK_PREFIX = 'https://chat.whatsapp.com/';

interface GroupFormModalProps {
  /** null = création ; sinon édition. */
  group: WhatsAppGroup | null;
  members: FamilyMember[];
  tribus: Tribu[];
  onClose: () => void;
}

function isValidInviteLink(value: string): boolean {
  const v = value.trim();
  return v.startsWith(INVITE_LINK_PREFIX) && v.length > INVITE_LINK_PREFIX.length && !/\s/.test(v);
}

/** Création / modification d'un groupe WhatsApp (nom, image, description, lien, accès). */
export function GroupFormModal({ group, members, tribus, onClose }: GroupFormModalProps) {
  const self = useAuthStore((s) => s.member);
  const { createGroup, updateGroup, addAccess, removeAccess, uploadImage, deleteGroup } = useGroupsStore();

  const isEdit = group !== null;
  const isCreator = !isEdit || group.is_creator;
  const canPin = isCreator || Boolean(self?.is_admin);
  const canDelete = isEdit && (group.is_creator || Boolean(self?.is_admin));

  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [inviteLink, setInviteLink] = useState(group?.invite_link ?? '');
  const [linkTouched, setLinkTouched] = useState(false);
  const [pinned, setPinned] = useState(group?.pinned ?? false);
  const [restricted, setRestricted] = useState(group?.restricted ?? false);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    group?.restricted ? group.access_member_ids : self ? [self.id] : [],
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Personnes déjà enregistrées (pour calculer les ajouts / retraits à l'enregistrement).
  const initialAccess = useMemo(() => new Set(group?.restricted ? group.access_member_ids : []), [group]);
  const creatorId = group?.created_by ?? self?.id ?? null;

  const livingMembers = useMemo(() => members.filter((m) => m.is_alive), [members]);

  const shownImage = imagePreview ?? group?.image_url ?? null;
  const linkInvalid = linkTouched && !isValidInviteLink(inviteLink);

  function pickImage(file: File | undefined) {
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLinkTouched(true);
    if (!name.trim()) {
      setError('Le nom du groupe est requis.');
      return;
    }
    if (!isValidInviteLink(inviteLink)) {
      setError(`Le lien d'invitation doit commencer par ${INVITE_LINK_PREFIX}`);
      return;
    }

    setSaving(true);
    try {
      let saved: WhatsAppGroup;
      if (!isEdit) {
        saved = await createGroup(
          {
            name: name.trim(),
            description: description.trim() || null,
            invite_link: inviteLink.trim(),
            restricted,
            ...(canPin && pinned ? { pinned } : {}),
          },
          restricted ? selectedIds : [],
        );
      } else {
        const fields: Parameters<typeof updateGroup>[1] = {};
        if (name.trim() !== group.name) fields.name = name.trim();
        if ((description.trim() || null) !== group.description) fields.description = description.trim() || null;
        if (inviteLink.trim() !== group.invite_link) fields.invite_link = inviteLink.trim();
        if (restricted !== group.restricted) fields.restricted = restricted;
        if (canPin && pinned !== group.pinned) fields.pinned = pinned;

        saved = Object.keys(fields).length > 0 ? await updateGroup(group.id, fields) : group;

        if (restricted) {
          const selected = new Set(selectedIds);
          const toAdd = selectedIds.filter((id) => !initialAccess.has(id));
          const toRemove = [...initialAccess].filter((id) => !selected.has(id));
          if (toAdd.length > 0) saved = await addAccess(group.id, toAdd);
          for (const id of toRemove) await removeAccess(group.id, id);
        }
      }
      if (imageFile) await uploadImage(saved.id, imageFile);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!group) return;
    setError(null);
    setSaving(true);
    try {
      await deleteGroup(group.id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      data-testid="group-form-overlay"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        noValidate
        data-testid="group-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-form-title"
        className="flex h-[96dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-cream-300 bg-cream-50 shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-cream-300/60 px-5 py-4">
          <h2 id="group-form-title" className="font-display text-xl font-semibold text-ink-800" data-testid="group-form-title">
            {isEdit ? 'Modifier le groupe' : 'Ajouter un groupe'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            data-testid="group-form-close-button"
            className="focus-ring -mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:text-ink-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert" data-testid="group-form-error">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream-200 text-ink-400">
              {shownImage ? (
                <img src={shownImage} alt="" className="h-full w-full object-cover" data-testid="group-form-image-preview" />
              ) : (
                <Camera className="h-6 w-6" data-testid="group-form-image-placeholder" />
              )}
            </div>
            <label className="btn-secondary cursor-pointer" data-testid="group-form-image-label">
              {shownImage ? "Changer l'image" : 'Ajouter une image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => pickImage(e.target.files?.[0])}
                data-testid="group-form-image-input"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-600">Nom du groupe</span>
            <input
              type="text"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Cousins & cousines"
              className="input-field !text-base sm:!text-sm"
              data-testid="group-form-name-input"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-600">Description (optionnelle)</span>
            <textarea
              value={description}
              maxLength={500}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field !text-base sm:!text-sm"
              data-testid="group-form-description-input"
            />
          </label>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="group-form-link" className="text-xs font-medium text-ink-600">
                Lien d'invitation WhatsApp
              </label>
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                data-testid="group-form-help-button"
                className="focus-ring inline-flex items-center gap-1 rounded px-1 text-xs font-medium text-warm-700 underline hover:text-warm-800"
              >
                <CircleHelp className="h-3.5 w-3.5" aria-hidden /> Besoin d'aide ?
              </button>
            </div>
            <input
              id="group-form-link"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={inviteLink}
              maxLength={200}
              onChange={(e) => setInviteLink(e.target.value)}
              onBlur={() => inviteLink && setLinkTouched(true)}
              placeholder={`${INVITE_LINK_PREFIX}…`}
              aria-invalid={linkInvalid}
              className={`input-field !text-base sm:!text-sm ${linkInvalid ? '!border-red-400' : ''}`}
              data-testid="group-form-link-input"
            />
            {linkInvalid && (
              <p className="text-xs text-red-700" data-testid="group-form-link-error">
                Le lien doit commencer par {INVITE_LINK_PREFIX}
              </p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-ink-600">Qui peut voir ce groupe ?</legend>
            <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-xl bg-cream-200 p-1" data-testid="group-access-mode">
              <button
                type="button"
                role="radio"
                aria-checked={!restricted}
                onClick={() => setRestricted(false)}
                data-testid="group-access-mode-family"
                className={`focus-ring flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition ${
                  !restricted ? 'bg-cream-50 text-warm-800 shadow-sm' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                <Users className="h-4 w-4" aria-hidden /> Toute la famille
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={restricted}
                onClick={() => setRestricted(true)}
                data-testid="group-access-mode-limited"
                className={`focus-ring flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition ${
                  restricted ? 'bg-cream-50 text-warm-800 shadow-sm' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                <Lock className="h-4 w-4" aria-hidden /> Accès limité
              </button>
            </div>

            {restricted ? (
              <div className="rounded-xl border border-cream-300 p-3">
                <GroupAccessPicker
                  members={livingMembers}
                  tribus={tribus}
                  selectedIds={selectedIds}
                  creatorId={creatorId}
                  onChange={setSelectedIds}
                />
              </div>
            ) : (
              <p className="text-sm text-ink-500" data-testid="group-access-family-hint">
                Toute la famille voit ce groupe et peut le rejoindre.
              </p>
            )}
          </fieldset>

          {canPin && (
            <label className="flex min-h-[44px] items-center gap-3 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-5 w-5 rounded border-cream-400 accent-warm-600"
                data-testid="group-form-pinned-input"
              />
              Épingler en haut de la liste
            </label>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-cream-300/60 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {canDelete ? (
            confirmDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                data-testid="group-form-delete-confirm-button"
                className="focus-ring rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                Confirmer la suppression
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                data-testid="group-form-delete-button"
                className="focus-ring rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Supprimer
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose} data-testid="group-form-cancel-button">
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={saving} data-testid="group-form-submit-button">
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </form>

      {showHelp && <GroupHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
