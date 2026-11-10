import { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import type { FamilyMember, Tribu } from '../../types';
import { MemberAvatar } from '../profile/MemberAvatar';

interface GroupAccessPickerProps {
  /** Personnes pouvant être ajoutées (vivantes). */
  members: FamilyMember[];
  tribus: Tribu[];
  /** Personnes ayant accès (sélection courante). */
  selectedIds: string[];
  /** Créateur du groupe : il garde toujours accès (pas de bouton de retrait). */
  creatorId: string | null;
  onChange: (ids: string[]) => void;
}

interface Notice {
  text: string;
  addedIds: string[];
}

function fullName(m: Pick<FamilyMember, 'first_name' | 'last_name'>): string {
  return `${m.first_name} ${m.last_name}`;
}

/**
 * Sélecteur d'accès, un seul panneau :
 *  1. résumé + puces des personnes ayant accès (avatars, retrait au tap quand c'est permis) ;
 *  2. tribus : un tap ajoute tous les membres de la tribu (copie, « +N » = nouveaux arrivants) ;
 *  3. personnes : recherche, un tap ajoute (la liste ne montre que les personnes pas encore ajoutées).
 * Chaque ajout affiche une confirmation avec « Annuler ».
 */
export function GroupAccessPicker({ members, tribus, selectedIds, creatorId, onChange }: GroupAccessPickerProps) {
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const sortedMembers = useMemo(
    () =>
      [...members].sort(
        (a, b) => a.first_name.localeCompare(b.first_name, 'fr') || a.last_name.localeCompare(b.last_name, 'fr'),
      ),
    [members],
  );

  const tribuStats = useMemo(
    () =>
      tribus
        .map((tribu) => {
          const tribuMembers = members.filter((m) => m.tribu_id === tribu.id);
          return { tribu, total: tribuMembers.length, missing: tribuMembers.filter((m) => !selected.has(m.id)) };
        })
        .filter((s) => s.total > 0),
    [tribus, members, selected],
  );

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortedMembers.filter((m) => !selected.has(m.id) && (!q || fullName(m).toLowerCase().includes(q)));
  }, [sortedMembers, selected, query]);

  const selectedMembers = sortedMembers.filter((m) => selected.has(m.id));
  const count = selectedMembers.length;

  function add(ids: string[], text: string) {
    onChange([...selectedIds, ...ids.filter((id) => !selected.has(id))]);
    setNotice({ text, addedIds: ids });
  }

  function remove(id: string) {
    onChange(selectedIds.filter((s) => s !== id));
    setNotice(null);
  }

  function undo() {
    if (!notice) return;
    const undoable = new Set(notice.addedIds.filter((id) => id !== creatorId));
    onChange(selectedIds.filter((id) => !undoable.has(id)));
    setNotice(null);
  }

  return (
    <div className="space-y-4" data-testid="group-access-picker">
      <div>
        <p className="text-sm font-semibold text-ink-800" data-testid="group-access-summary">
          {count} {count > 1 ? 'personnes ont' : 'personne a'} accès
        </p>
        <ul className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto" data-testid="group-access-selected-list">
          {selectedMembers.map((m) => {
            const isCreator = m.id === creatorId;
            return (
              <li
                key={m.id}
                data-testid={`group-access-chip-${m.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-cream-400 bg-cream-50 py-1 pl-1 pr-2 text-sm text-ink-700"
              >
                <MemberAvatar member={m} size="sm" />
                <span>{fullName(m)}</span>
                {isCreator ? (
                  <span className="text-xs text-ink-400" data-testid={`group-access-creator-${m.id}`}>créateur</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    aria-label={`Retirer ${fullName(m)}`}
                    data-testid={`group-access-remove-${m.id}`}
                    className="focus-ring -mr-0.5 flex h-6 w-6 items-center justify-center rounded-full text-ink-400 hover:bg-cream-200 hover:text-ink-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {notice && (
          <p
            className="mt-2 flex items-center gap-2 rounded-lg bg-arbey-50 px-3 py-1.5 text-sm text-arbey-800"
            role="status"
            data-testid="group-access-notice"
          >
            <span className="flex-1">{notice.text}</span>
            <button type="button" onClick={undo} className="focus-ring rounded px-1 font-semibold underline" data-testid="group-access-undo-button">
              Annuler
            </button>
          </p>
        )}
      </div>

      {tribuStats.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-600">Ajouter une tribu</p>
          <ul className="flex flex-wrap gap-2" data-testid="group-access-tribe-list">
            {tribuStats.map(({ tribu, total, missing }) => {
              const done = missing.length === 0;
              return (
                <li key={tribu.id}>
                  <button
                    type="button"
                    disabled={done}
                    onClick={() =>
                      add(
                        missing.map((m) => m.id),
                        `${missing.length} ${missing.length > 1 ? 'personnes ajoutées' : 'personne ajoutée'} (${tribu.name})`,
                      )
                    }
                    data-testid={`group-access-tribe-option-${tribu.id}`}
                    aria-label={done ? `${tribu.name} : tous les ${total} membres ont déjà accès` : `Ajouter la tribu ${tribu.name} (${missing.length} personnes)`}
                    className="focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-cream-400 bg-cream-50 px-3 text-sm font-medium text-ink-800 transition hover:border-warm-300 hover:bg-warm-50 active:scale-[0.98] disabled:cursor-default disabled:opacity-60 disabled:hover:border-cream-400 disabled:hover:bg-cream-50"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-warm-500"
                      style={tribu.color ? { backgroundColor: tribu.color } : undefined}
                      aria-hidden
                    />
                    <span>{tribu.name}</span>
                    {done ? (
                      <Check className="h-4 w-4 text-arbey-600" aria-hidden />
                    ) : (
                      <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-semibold text-warm-800" data-testid={`group-access-tribe-count-${tribu.id}`}>
                        +{missing.length}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-600">Ajouter des personnes</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une personne…"
            className="input-field !pl-9 !text-base sm:!text-sm"
            data-testid="group-access-search-input"
          />
        </div>
        <ul className="mt-2 max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-cream-300" data-testid="group-access-member-list">
          {candidates.map((m) => (
            <li key={m.id} className="border-b border-cream-300/60 last:border-b-0">
              <button
                type="button"
                onClick={() => add([m.id], `${fullName(m)} ajouté(e)`)}
                data-testid={`group-access-member-option-${m.id}`}
                className="focus-ring flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-800 hover:bg-cream-200/60 focus-visible:ring-inset"
              >
                <MemberAvatar member={m} size="sm" />
                <span className="flex-1 truncate">{fullName(m)}</span>
                <Plus className="h-4 w-4 shrink-0 text-warm-600" aria-hidden />
              </button>
            </li>
          ))}
          {candidates.length === 0 && (
            <li className="px-3 py-4 text-center text-sm text-ink-400" data-testid="group-access-member-empty">
              {query.trim() ? 'Aucune personne trouvée.' : 'Tout le monde a déjà accès.'}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
