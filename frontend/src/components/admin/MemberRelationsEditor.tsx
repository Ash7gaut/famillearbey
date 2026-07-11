import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import type { FamilyMember, Relationship, RelationshipType } from '../../types';

interface MemberRelationsEditorProps {
  member: FamilyMember;
  allMembers: FamilyMember[];
}

/** Choix proposés à l'admin (plus parlants que les 3 types bruts). */
type RelationChoice = 'parent' | 'child' | 'spouse' | 'sibling';

const CHOICE_LABELS: Record<RelationChoice, string> = {
  parent: 'Parent (père / mère)',
  child: 'Enfant',
  spouse: 'Conjoint(e)',
  sibling: 'Frère / sœur',
};

/** Une ligne de lien affichée, catégorisée du point de vue du membre courant. */
interface DisplayRelation {
  relationshipId: string;
  category: RelationChoice;
  other: FamilyMember;
}

export function MemberRelationsEditor({ member, allMembers }: MemberRelationsEditorProps) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<RelationChoice>('parent');
  const [otherId, setOtherId] = useState('');
  const [saving, setSaving] = useState(false);

  const memberMap = useMemo(
    () => new Map(allMembers.map((m) => [m.id, m])),
    [allMembers],
  );

  useEffect(() => {
    loadRelationships();
  }, [member.id]);

  async function loadRelationships() {
    setLoading(true);
    try {
      const data = await api.get<Relationship[]>('/relationships');
      setRelationships(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Catégorise chaque lien impliquant le membre courant.
  const displayed = useMemo<DisplayRelation[]>(() => {
    const rows: DisplayRelation[] = [];
    for (const rel of relationships) {
      const involvesMember =
        rel.member_id === member.id || rel.related_member_id === member.id;
      if (!involvesMember) continue;

      let category: RelationChoice | null = null;
      let otherId: string;

      if (rel.relationship_type === 'parent') {
        // member_id = parent, related_member_id = enfant
        if (rel.member_id === member.id) {
          category = 'child';
          otherId = rel.related_member_id;
        } else {
          category = 'parent';
          otherId = rel.member_id;
        }
      } else {
        // spouse / sibling : symétrique
        category = rel.relationship_type === 'spouse' ? 'spouse' : 'sibling';
        otherId = rel.member_id === member.id ? rel.related_member_id : rel.member_id;
      }

      const other = memberMap.get(otherId);
      if (category && other) {
        rows.push({ relationshipId: rel.id, category, other });
      }
    }
    return rows;
  }, [relationships, member.id, memberMap]);

  const grouped = useMemo(() => {
    const g: Record<RelationChoice, DisplayRelation[]> = {
      parent: [],
      child: [],
      spouse: [],
      sibling: [],
    };
    for (const row of displayed) g[row.category].push(row);
    return g;
  }, [displayed]);

  // Membres sélectionnables : tout le monde sauf soi-même.
  const candidates = useMemo(
    () =>
      allMembers
        .filter((m) => m.id !== member.id)
        .sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr')),
    [allMembers, member.id],
  );

  /** Traduit le choix admin en (member_id, related_member_id, type) pour l'API. */
  function toApiPayload(selectedChoice: RelationChoice, selectedId: string) {
    switch (selectedChoice) {
      case 'parent':
        // l'autre est le parent DE member → parent = other, enfant = member
        return {
          member_id: selectedId,
          related_member_id: member.id,
          relationship_type: 'parent' as RelationshipType,
        };
      case 'child':
        // member est le parent de l'autre
        return {
          member_id: member.id,
          related_member_id: selectedId,
          relationship_type: 'parent' as RelationshipType,
        };
      case 'spouse':
        return {
          member_id: member.id,
          related_member_id: selectedId,
          relationship_type: 'spouse' as RelationshipType,
        };
      case 'sibling':
        return {
          member_id: member.id,
          related_member_id: selectedId,
          relationship_type: 'sibling' as RelationshipType,
        };
    }
  }

  async function handleAdd() {
    if (!otherId) return;
    setError(null);
    setSaving(true);
    try {
      await api.post<Relationship>('/relationships', toApiPayload(choice, otherId));
      setOtherId('');
      await loadRelationships();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(relationshipId: string) {
    setError(null);
    try {
      await api.delete(`/relationships/${relationshipId}`);
      setRelationships((prev) => prev.filter((r) => r.id !== relationshipId));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-semibold text-[#2C2419]">Liens de parenté</h3>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-[#7A6B5C]">Chargement des liens…</p>
      ) : (
        <div className="space-y-3">
          {(Object.keys(CHOICE_LABELS) as RelationChoice[]).map((cat) => (
            <div key={cat}>
              <p className="text-xs font-medium uppercase tracking-wide text-[#9A8B7A]">
                {CHOICE_LABELS[cat]}
              </p>
              {grouped[cat].length === 0 ? (
                <p className="text-xs text-[#B8A99A]">—</p>
              ) : (
                <ul className="mt-1 flex flex-wrap gap-2">
                  {grouped[cat].map((row) => (
                    <li
                      key={row.relationshipId}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E0D5C4] bg-white px-3 py-1 text-sm text-[#4A3F35]"
                    >
                      {row.other.first_name} {row.other.last_name}
                      <button
                        type="button"
                        className="text-[#B8A99A] transition hover:text-red-600"
                        onClick={() => handleRemove(row.relationshipId)}
                        aria-label={`Retirer le lien avec ${row.other.first_name}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ajouter un lien */}
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-[#EDE6DA] bg-[#F5F0E8]/50 p-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-[#5C4F42]">Type</span>
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value as RelationChoice)}
            className="input-field !py-2"
          >
            {(Object.keys(CHOICE_LABELS) as RelationChoice[]).map((c) => (
              <option key={c} value={c}>
                {CHOICE_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[160px] flex-1 space-y-1">
          <span className="text-xs font-medium text-[#5C4F42]">Membre</span>
          <select
            value={otherId}
            onChange={(e) => setOtherId(e.target.value)}
            className="input-field !py-2"
          >
            <option value="">Choisir…</option>
            {candidates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn-primary !py-2"
          onClick={handleAdd}
          disabled={!otherId || saving}
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
