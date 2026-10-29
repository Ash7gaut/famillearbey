import { useState } from 'react';
import type { FamilyMember } from '../../types';
import { MemberSelect } from '../ui/MemberSelect';
import { MemberAvatar } from '../profile/MemberAvatar';
import { useMessagingStore } from '../../stores/messagingStore';

interface NewConversationModalProps {
  allMembers: FamilyMember[];
  onClose: () => void;
  onCreated: () => void;
}

export function NewConversationModal({ allMembers, onClose, onCreated }: NewConversationModalProps) {
  const createConversation = useMessagingStore((s) => s.createConversation);
  const [title, setTitle] = useState('');
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [toAdd, setToAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberMap = new Map(allMembers.map((m) => [m.id, m]));
  const selectedMembers = [...memberIds]
    .map((id) => memberMap.get(id))
    .filter((m): m is FamilyMember => Boolean(m));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (memberIds.size === 0) {
      setError('Ajoute au moins un membre au groupe.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createConversation(title.trim() || null, [...memberIds]);
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-testid="new-conversation-overlay"
    >
      <div
        className="my-8 w-full max-w-lg space-y-6 rounded-2xl border border-cream-300 bg-cream-50 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="new-conversation-modal"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-semibold text-ink-800" data-testid="new-conversation-title">Nouveau groupe</h2>
          <button
            type="button"
            className="focus-ring rounded-lg p-1 text-ink-500 hover:text-ink-800"
            onClick={onClose}
            data-testid="new-conversation-close-button"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" data-testid="new-conversation-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="new-conversation-form">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-600">Nom du groupe (optionnel)</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Cousins"
              className="input-field"
              data-testid="new-conversation-title-input"
            />
          </label>

          <div className="space-y-2">
            <span className="text-xs font-medium text-ink-600">Membres du groupe</span>

            {selectedMembers.length > 0 && (
              <ul className="flex flex-wrap gap-2" data-testid="new-conversation-member-list">
                {selectedMembers.map((m) => (
                  <li
                    key={m.id}
                    data-testid={`new-conversation-member-${m.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cream-400 bg-cream-50 py-1 pl-1 pr-2 text-sm text-ink-700"
                  >
                    <MemberAvatar member={m} size="sm" />
                    {m.first_name} {m.last_name}
                    <button
                      type="button"
                      className="text-ink-400 transition hover:text-red-600"
                      onClick={() =>
                        setMemberIds((prev) => {
                          const next = new Set(prev);
                          next.delete(m.id);
                          return next;
                        })
                      }
                      aria-label={`Retirer ${m.first_name}`}
                      data-testid={`new-conversation-remove-member-${m.id}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <MemberSelect
              members={allMembers.filter((m) => !memberIds.has(m.id))}
              value={toAdd}
              onChange={(id) => {
                if (id) {
                  setMemberIds((prev) => new Set(prev).add(id));
                  setToAdd('');
                }
              }}
              placeholder="Ajouter un membre…"
              data-testid="new-conversation-member-select"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose} data-testid="new-conversation-cancel-button">
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={saving} data-testid="new-conversation-submit-button">
              {saving ? 'Création…' : 'Créer le groupe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
