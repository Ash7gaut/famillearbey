import type { FamilyMember, Relationship } from '../../types';

/** Valeur du sélecteur de racine pour afficher toute la famille. */
export const ALL_ROOTS = 'all';

/** Un couple (ou un parent seul) et les enfants qui en descendent. */
export interface TreeUnion {
  /** 1 ou 2 parents, tous dans la chaîne de l'unité (adjacents s'ils sont deux). */
  parentIds: string[];
  children: TreeUnit[];
}

/** Une personne "de sang" (main) avec ses conjoints, côte à côte dans `chain`. */
export interface TreeUnit {
  mainId: string;
  chain: FamilyMember[];
  unions: TreeUnion[];
}

function addToSet(map: Map<string, Set<string>>, key: string, value: string) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(value);
}

export function buildRelationshipMaps(relationships: Relationship[]) {
  const parents = new Map<string, Set<string>>();
  const spouses = new Map<string, Set<string>>();
  const children = new Map<string, Set<string>>();

  for (const rel of relationships) {
    if (rel.relationship_type === 'parent') {
      addToSet(parents, rel.related_member_id, rel.member_id);
      addToSet(children, rel.member_id, rel.related_member_id);
    } else if (rel.relationship_type === 'spouse') {
      addToSet(spouses, rel.member_id, rel.related_member_id);
      addToSet(spouses, rel.related_member_id, rel.member_id);
    }
  }

  // Deux parents d'un même enfant forment un couple, même sans lien "spouse" saisi.
  for (const parentIds of parents.values()) {
    const list = [...parentIds];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        addToSet(spouses, list[i], list[j]);
        addToSet(spouses, list[j], list[i]);
      }
    }
  }

  return { parents, spouses, children };
}

/** Racine par défaut : mamie si elle existe, sinon toute la famille. */
export function defaultRootId(members: FamilyMember[]): string {
  return members.find((m) => m.is_mamie)?.id ?? ALL_ROOTS;
}

function compareByBirth(a: FamilyMember, b: FamilyMember) {
  if (a.birth_date && b.birth_date) {
    const diff = a.birth_date.localeCompare(b.birth_date);
    if (diff !== 0) return diff;
  } else if (a.birth_date || b.birth_date) {
    return a.birth_date ? -1 : 1;
  }
  return a.first_name.localeCompare(b.first_name, 'fr', { sensitivity: 'base' });
}

/**
 * Construit la forêt d'unités à afficher : `rootId` = un membre (sa descendance
 * et ses conjoints) ou ALL_ROOTS (toutes les familles, mamie d'abord).
 * Chaque membre n'apparaît qu'une fois.
 */
export function buildTreeUnits(
  members: FamilyMember[],
  relationships: Relationship[],
  rootId: string,
): TreeUnit[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const { parents, spouses, children } = buildRelationshipMaps(relationships);
  const placed = new Set<string>();

  const known = (ids: Iterable<string> | undefined) =>
    [...(ids ?? [])].map((id) => byId.get(id)).filter((m): m is FamilyMember => !!m);

  function makeUnit(mainId: string): TreeUnit {
    const main = byId.get(mainId)!;
    placed.add(mainId);

    const spouseList = known(spouses.get(mainId))
      .filter((s) => !placed.has(s.id))
      .sort(compareByBirth);
    spouseList.forEach((s) => placed.add(s.id));

    // Un seul conjoint : homme à gauche, femme à droite ; sinon les conjoints
    // s'écartent de part et d'autre de la personne principale.
    let chain: FamilyMember[];
    if (spouseList.length === 1) {
      const [s] = spouseList;
      chain = main.gender === 'female' && s.gender === 'male' ? [s, main] : [main, s];
    } else {
      const right = spouseList.filter((_, i) => i % 2 === 0);
      const left = spouseList.filter((_, i) => i % 2 === 1).reverse();
      chain = [...left, main, ...right];
    }
    const indexOf = new Map(chain.map((m, i) => [m.id, i]));

    // Enfants non placés, regroupés par parents présents dans la chaîne.
    const groups = new Map<string, { parentIds: string[]; kids: FamilyMember[] }>();
    const childIds = new Set<string>();
    for (const person of chain) children.get(person.id)?.forEach((id) => childIds.add(id));
    for (const child of known(childIds).sort(compareByBirth)) {
      if (placed.has(child.id)) continue;
      let inChain = [...(parents.get(child.id) ?? [])]
        .filter((id) => indexOf.has(id))
        .sort((a, b) => indexOf.get(a)! - indexOf.get(b)!);
      const adjacent = inChain.length === 2 && indexOf.get(inChain[1])! - indexOf.get(inChain[0])! === 1;
      if (!adjacent) inChain = inChain.slice(0, 1);
      const key = inChain.join('|');
      if (!groups.has(key)) groups.set(key, { parentIds: inChain, kids: [] });
      groups.get(key)!.kids.push(child);
    }

    const ordered = [...groups.values()].sort(
      (a, b) =>
        indexOf.get(a.parentIds[0])! - indexOf.get(b.parentIds[0])! ||
        b.parentIds.length - a.parentIds.length,
    );
    const unions: TreeUnion[] = ordered.map(({ parentIds, kids }) => {
      const units: TreeUnit[] = [];
      for (const kid of kids) {
        // Un frère/une sœur a pu être placé(e) entre-temps comme conjoint(e).
        if (!placed.has(kid.id)) units.push(makeUnit(kid.id));
      }
      return { parentIds, children: units };
    });

    return { mainId, chain, unions };
  }

  const roots: TreeUnit[] = [];
  const addRoot = (id: string) => {
    if (!placed.has(id) && byId.has(id)) roots.push(makeUnit(id));
  };

  if (rootId !== ALL_ROOTS && byId.has(rootId)) {
    addRoot(rootId);
    return roots;
  }

  const mamie = members.find((m) => m.is_mamie);
  if (mamie) addRoot(mamie.id);
  // Racines : sans parent, et sans conjoint qui descend d'ailleurs (il sera rattaché à son conjoint).
  const sorted = [...members].sort(compareByBirth);
  for (const m of sorted) {
    if (parents.has(m.id)) continue;
    const marriedIn = known(spouses.get(m.id)).some((s) => parents.has(s.id));
    if (!marriedIn) addRoot(m.id);
  }
  // Filet de sécurité (cycles, données incohérentes).
  for (const m of sorted) addRoot(m.id);

  return roots;
}
