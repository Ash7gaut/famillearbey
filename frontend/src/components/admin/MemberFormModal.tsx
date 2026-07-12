import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { FamilyMember, Gender, Tribu } from '../../types';
import { MemberRelationsEditor } from './MemberRelationsEditor';

interface MemberFormModalProps {
  /** null = création ; sinon édition */
  member: FamilyMember | null;
  allMembers: FamilyMember[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  first_name: string;
  last_name: string;
  gender: Gender;
  tribu_id: string;
  birth_date: string;
  death_date: string;
  bio: string;
}

function toForm(member: FamilyMember | null): FormState {
  return {
    first_name: member?.first_name ?? '',
    last_name: member?.last_name ?? 'Arbey',
    gender: member?.gender ?? 'male',
    tribu_id: member?.tribu_id ?? '',
    birth_date: member?.birth_date ?? '',
    death_date: member?.death_date ?? '',
    bio: member?.bio ?? '',
  };
}

export function MemberFormModal({ member, allMembers, onClose, onSaved }: MemberFormModalProps) {
  const isEdit = Boolean(member);
  const [form, setForm] = useState<FormState>(() => toForm(member));
  const [tribus, setTribus] = useState<Tribu[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(toForm(member));
  }, [member]);

  useEffect(() => {
    api.get<Tribu[]>('/tribus').then(setTribus).catch(() => setTribus([]));
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      first_name: form.first_name.trim(),
      // Nom de famille toujours en MAJUSCULES (le backend le garantit aussi).
      last_name: (form.last_name.trim() || 'Arbey').toLocaleUpperCase('fr-FR'),
      gender: form.gender,
      tribu_id: form.tribu_id || null,
      birth_date: form.birth_date || null,
      death_date: form.death_date || null,
      // Déduit : une date de décès renseignée ⇒ la personne n'est plus en vie.
      is_alive: !form.death_date,
      bio: form.bio.trim() || null,
    };

    try {
      if (isEdit && member) {
        await api.patch<FamilyMember>(`/members/${member.id}`, payload);
      } else {
        await api.post<FamilyMember>('/members', payload);
      }
      onSaved();
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
    >
      <div
        className="my-8 w-full max-w-lg space-y-6 rounded-2xl border border-cream-300 bg-cream-50 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-semibold text-ink-800">
            {isEdit ? `Modifier ${member?.first_name}` : 'Nouveau membre'}
          </h2>
          <button
            type="button"
            className="focus-ring rounded-lg p-1 text-ink-500 hover:text-ink-800"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Démographie */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-ink-600">Prénom *</span>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => update('first_name', e.target.value)}
                className="input-field"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-ink-600">Nom</span>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => update('last_name', e.target.value)}
                className="input-field uppercase"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-ink-600">Genre</span>
              <select
                value={form.gender}
                onChange={(e) => update('gender', e.target.value as Gender)}
                className="input-field"
              >
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-ink-600">Tribu</span>
              <select
                value={form.tribu_id}
                onChange={(e) => update('tribu_id', e.target.value)}
                className="input-field"
              >
                <option value="">Aucune</option>
                {tribus.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-ink-600">Naissance</span>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => update('birth_date', e.target.value)}
                className="input-field"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-ink-600">Décès</span>
              <input
                type="date"
                value={form.death_date}
                onChange={(e) => update('death_date', e.target.value)}
                className="input-field"
              />
            </label>
          </div>

          {/* Statut déduit de la date de décès — pas de saisie manuelle. */}
          <p className="text-xs text-ink-500">
            Statut :{' '}
            {form.death_date ? (
              <span className="font-medium text-warm-800">
                Décédé(e){form.death_date && ` le ${form.death_date}`}
              </span>
            ) : (
              <span className="font-medium text-ink-700">En vie</span>
            )}{' '}
            — renseigne une date de décès pour marquer la personne comme décédée.
          </p>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-600">Bio</span>
            <textarea
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              rows={3}
              className="input-field resize-none"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le membre'}
            </button>
          </div>
        </form>

        {/* Liens de parenté — uniquement en édition (le membre doit exister) */}
        {isEdit && member && (
          <div className="border-t border-cream-300 pt-5">
            <MemberRelationsEditor member={member} allMembers={allMembers} />
          </div>
        )}
        {!isEdit && (
          <p className="border-t border-cream-300 pt-4 text-xs text-ink-500">
            Les liens de parenté pourront être ajoutés après la création, en modifiant le membre.
          </p>
        )}
      </div>
    </div>
  );
}
