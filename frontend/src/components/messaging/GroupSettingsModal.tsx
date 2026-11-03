import { useState } from 'react';
import { Camera } from 'lucide-react';
import type { ConversationSummary, FamilyMember } from '../../types';
import { MemberSelect } from '../ui/MemberSelect';
import { MemberAvatar } from '../profile/MemberAvatar';
import { useMessagingStore } from '../../stores/messagingStore';

interface GroupSettingsModalProps {
  conversation: ConversationSummary;
  allMembers: FamilyMember[];
  onClose: () => void;
}

/** Paramètres d'un groupe : nom, description, image, ajout de membres (aucun retrait possible). */
export function GroupSettingsModal({ conversation, allMembers, onClose }: GroupSettingsModalProps) {
  const { updateSettings, uploadImage, addMember } = useMessagingStore();
  const [title, setTitle] = useState(conversation.title ?? '');
  const [description, setDescription] = useState(conversation.description ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toAdd, setToAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shownImage = imagePreview ?? conversation.image_url;

  function pickImage(file: File | undefined) {
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateSettings(conversation.id, { title: title.trim() || null, description: description.trim() || null });
      if (imageFile) await uploadImage(conversation.id, imageFile);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMember(memberId: string) {
    if (!memberId) return;
    setError(null);
    try {
      await addMember(conversation.id, memberId);
      setToAdd('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-testid="group-settings-overlay"
    >
      <div
        className="my-8 w-full max-w-lg space-y-6 rounded-2xl border border-cream-300 bg-cream-50 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="group-settings-modal"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-semibold text-ink-800" data-testid="group-settings-title">
            Paramètres du groupe
          </h2>
          <button
            type="button"
            className="focus-ring rounded-lg p-1 text-ink-500 hover:text-ink-800"
            onClick={onClose}
            data-testid="group-settings-close-button"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" data-testid="group-settings-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="group-settings-form">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream-200 text-ink-400">
              {shownImage ? (
                <img src={shownImage} alt="" className="h-full w-full object-cover" data-testid="group-settings-image-preview" />
              ) : (
                <Camera className="h-6 w-6" data-testid="group-settings-image-placeholder" />
              )}
            </div>
            <label className="btn-secondary cursor-pointer" data-testid="group-settings-image-label">
              Changer l'image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => pickImage(e.target.files?.[0])}
                data-testid="group-settings-image-input"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-600">Nom du groupe</span>
            <input
              type="text"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Cousins"
              className="input-field"
              data-testid="group-settings-name-input"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-600">Description (optionnelle)</span>
            <textarea
              value={description}
              maxLength={500}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              data-testid="group-settings-description-input"
            />
          </label>

          <div className="space-y-2">
            <span className="text-xs font-medium text-ink-600" data-testid="group-settings-members-title">
              Membres ({conversation.members.length})
            </span>
            <ul className="flex flex-wrap gap-2" data-testid="group-settings-member-list">
              {conversation.members.map((m) => (
                <li
                  key={m.id}
                  data-testid={`group-settings-member-${m.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cream-400 bg-cream-50 py-1 pl-1 pr-3 text-sm text-ink-700"
                >
                  <MemberAvatar member={m} size="sm" />
                  {m.first_name} {m.last_name}
                </li>
              ))}
            </ul>
            <MemberSelect
              members={allMembers.filter((m) => !conversation.members.some((cm) => cm.id === m.id))}
              value={toAdd}
              onChange={handleAddMember}
              placeholder="Ajouter un membre…"
              data-testid="group-settings-add-member-select"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose} data-testid="group-settings-cancel-button">
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={saving} data-testid="group-settings-submit-button">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
