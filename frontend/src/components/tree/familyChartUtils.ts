import type { Data } from 'family-chart';
import type { FamilyMember, Relationship } from '../../types';

function addToSet(map: Map<string, Set<string>>, key: string, value: string) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(value);
}

export function formatBirthYear(date: string | null): string {
  if (!date) return '';
  return String(new Date(date).getFullYear());
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

  return { parents, spouses, children };
}

/** Genre pour l'affichage de l'arbre, lu directement depuis la base. */
export function inferGenders(members: FamilyMember[]): Map<string, 'M' | 'F'> {
  const genders = new Map<string, 'M' | 'F'>();
  for (const member of members) {
    genders.set(member.id, member.gender === 'female' ? 'F' : 'M');
  }

  return genders;
}

export function buildFamilyChartData(
  members: FamilyMember[],
  relationships: Relationship[],
): Data {
  const genders = inferGenders(members);
  const { parents, spouses, children } = buildRelationshipMaps(relationships);

  return members.map((member) => ({
    id: member.id,
    data: {
      gender: genders.get(member.id) ?? 'M',
      'first name': member.first_name,
      'last name': member.last_name,
      birthday: formatBirthYear(member.birth_date),
      avatar: member.photo_url ?? '',
    },
    rels: {
      parents: [...(parents.get(member.id) ?? [])],
      spouses: [...(spouses.get(member.id) ?? [])],
      children: [...(children.get(member.id) ?? [])],
    },
  }));
}
