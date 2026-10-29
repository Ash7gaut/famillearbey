import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import type { FamilyMember, Tribu } from '../../types';
import { MemberSelect } from '../ui/MemberSelect';
import { MemberAvatar } from '../profile/MemberAvatar';

interface TribuFormModalProps {
  /** null = création ; sinon édition */
  tribu: Tribu | null;
  allMembers: FamilyMember[];
  membersInTribu: FamilyMember[];
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_COLOR = '#c66434';

export function TribuFormModal({
  tribu,
  allMembers,
  membersInTribu,
  onClose,
  onSaved,
}: TribuFormModalProps) {
  const isEdit = Boolean(tribu);
  const [name, setName] = useState(tribu?.name ?? '');
  const [description, setDescription] = useState(tribu?.description ?? '');
  const [color, setColor] = useState(tribu?.color ?? DEFAULT_COLOR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Membres de la tribu (état local, mis à jour au fil des ajouts/retraits).
  const [memberIds, setMemberIds] = useState<Set<string>>(
    () => new Set(membersInTribu.map((m) => m.id)),
  );
  const [toAdd, setToAdd] = useState('');

  useEffect(() => {
    setMemberIds(new Set(membersInTribu.map((m) => m.id)));
  }, [membersInTribu]);

  const memberMap = useMemo(() => new Map(allMembers.map((m) => [m.id, m])), [allMembers]);

  const currentMembers = useMemo(
    () =>
      [...memberIds]
        .map((id) => memberMap.get(id))
        .filter((m): m is FamilyMember => Boolean(m))
        .sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr')),
    [memberIds, memberMap],
  );

  // Membres assignables : ceux sans tribu, ou déjà dans celle-ci.
  const assignable = useMemo(
    () => allMembers.filter((m) => !m.tribu_id || m.tribu_id === tribu?.id),
    [allMembers, tribu?.id],
  );

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = { name: name.trim(), description: description.trim() || null, color };
    try {
      if (isEdit && tribu) {
        await api.patch<Tribu>(`/tribus/${tribu.id}`, payload);
      } else {
        await api.post<Tribu>('/tribus', payload);
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function addMember(memberId: string) {
    if (!tribu || !memberId) return;
    setError(null);
    try {
      await api.put(`/tribus/${tribu.id}/members/${memberId}`);
      setMemberIds((prev) => new Set(prev).add(memberId));
      setToAdd('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function removeMember(memberId: string) {
    if (!tribu) return;
    setError(null);
    try {
      await api.delete(`/tribus/${tribu.id}/members/${memberId}`);
      setMemberIds((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-testid="tribe-form-overlay"
    >
      <div
        className="my-8 w-full max-w-lg space-y-6 rounded-2xl border border-cream-300 bg-cream-50 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="tribe-form-modal"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-semibold text-ink-800" data-testid="tribe-form-title">
            {isEdit ? `Modifier ${tribu?.name}` : 'Nouvelle tribu'}
          </h2>
          <button
            type="button"
            className="focus-ring rounded-lg p-1 text-ink-500 hover:text-ink-800"
            onClick={onClose}
            data-testid="tribe-form-close-button"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" data-testid="tribe-form-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveDetails} className="space-y-4" data-testid="tribe-form">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-600">Nom *</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="tribe-form-name-input"
              className="input-field"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-600">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="tribe-form-description-input"
              rows={2}
              className="input-field resize-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-600">Couleur</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                data-testid="tribe-form-color-input"
                className="h-10 w-14 cursor-pointer rounded-lg border border-cream-300 bg-white"
              />
              <span className="text-sm text-ink-500">{color}</span>
            </div>
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose} data-testid="tribe-form-cancel-button">
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={saving} data-testid="tribe-form-submit-button">
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer la tribu'}
            </button>
          </div>
        </form>

        {/* Membres de la tribu — uniquement en édition (la tribu doit exister) */}
        {isEdit && tribu ? (
          <div className="space-y-3 border-t border-cream-300 pt-5">
            <h3 className="font-display text-sm font-semibold text-ink-800">
              Membres de la tribu ({currentMembers.length})
            </h3>

            {currentMembers.length === 0 ? (
              <p className="text-xs text-ink-400" data-testid="tribe-form-members-empty">Aucun membre pour l'instant.</p>
            ) : (
              <ul className="flex flex-wrap gap-2" data-testid="tribe-form-member-list">
                {currentMembers.map((m) => (
                  <li
                    key={m.id}
                    data-testid={`tribe-member-${m.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cream-400 bg-cream-50 py-1 pl-1 pr-2 text-sm text-ink-700"
                  >
                    <MemberAvatar member={m} size="sm" />
                    {m.first_name} {m.last_name}
                    <button
                      type="button"
                      className="text-ink-400 transition hover:text-red-600"
                      onClick={() => removeMember(m.id)}
                      aria-label={`Retirer ${m.first_name} de la tribu`}
                      data-testid={`tribe-member-remove-button-${m.id}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <MemberSelect
                  members={assignable.filter((m) => !memberIds.has(m.id))}
                  value={toAdd}
                  onChange={(id) => {
                    setToAdd(id);
                    if (id) addMember(id);
                  }}
                  placeholder="Ajouter un membre…"
                  data-testid="tribe-form-member-select"
                />
              </div>
            </div>
            <p className="text-xs text-ink-400">
              Un membre ne peut appartenir qu'à une seule tribu. Les membres déjà dans une autre
              tribu n'apparaissent pas ici.
            </p>
          </div>
        ) : (
          <p className="border-t border-cream-300 pt-4 text-xs text-ink-500">
            Les membres pourront être ajoutés après la création, en modifiant la tribu.
          </p>
        )}
      </div>
    </div>
  );
}
