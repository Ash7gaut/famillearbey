import type { Data } from 'family-chart';
import type { FamilyMember, Relationship } from '../../types';

const LIKELY_MALE = new Set([
  'Antonin',
  'Bernard',
  'Christian',
  'Eric',
  'Maxence',
  'Pierre',
  'Jean',
  'Paul',
  'Michel',
  'Philippe',
  'Nicolas',
  'Thomas',
  'Julien',
  'Alexandre',
  'François',
  'Henri',
  'Louis',
  'Jacques',
  'Daniel',
  'Patrick',
  'Olivier',
  'Christophe',
  'Stéphane',
  'Laurent',
  'David',
  'Marc',
  'Bruno',
  'Alain',
  'Gérard',
  'Robert',
  'Georges',
  'André',
  'Claude',
  'Luc',
  'Vincent',
  'Sébastien',
  'Guillaume',
  'Baptiste',
  'Hugo',
  'Lucas',
  'Gabriel',
  'Arthur',
  'Raphaël',
  'Léo',
  'Adam',
  'Noah',
  'Ethan',
  'Nathan',
  'Kleane',
]);

const LIKELY_FEMALE = new Set([
  'Anne-Marie',
  'Christine',
  'Florence',
  'Marie',
  'Jeanne',
  'Sophie',
  'Isabelle',
  'Nathalie',
  'Catherine',
  'Françoise',
  'Monique',
  'Sylvie',
  'Martine',
  'Nicole',
  'Brigitte',
  'Chantal',
  'Valérie',
  'Sandrine',
  'Stéphanie',
  'Céline',
  'Julie',
  'Camille',
  'Claire',
  'Émilie',
  'Charlotte',
  'Manon',
  'Léa',
  'Chloé',
  'Emma',
  'Louise',
  'Alice',
  'Juliette',
  'Zoé',
  'Malou',
  'Eva',
  'Sybille',
  'Anne',
  'Hélène',
  'Patricia',
  'Dominique',
  'Véronique',
  'Caroline',
  'Aurélie',
  'Laure',
  'Marion',
  'Pauline',
  'Margot',
  'Inès',
  'Jade',
  'Lola',
]);

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

export function inferGenders(
  members: FamilyMember[],
  relationships: Relationship[],
): Map<string, 'M' | 'F'> {
  const genders = new Map<string, 'M' | 'F'>();

  for (const member of members) {
    const first = member.first_name;
    if (LIKELY_MALE.has(first)) genders.set(member.id, 'M');
    else if (LIKELY_FEMALE.has(first)) genders.set(member.id, 'F');
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const rel of relationships) {
      if (rel.relationship_type !== 'spouse') continue;
      const genderA = genders.get(rel.member_id);
      const genderB = genders.get(rel.related_member_id);
      if (genderA && !genderB) {
        genders.set(rel.related_member_id, genderA === 'M' ? 'F' : 'M');
        changed = true;
      } else if (genderB && !genderA) {
        genders.set(rel.member_id, genderB === 'M' ? 'F' : 'M');
        changed = true;
      }
    }
  }

  for (const member of members) {
    if (!genders.has(member.id)) genders.set(member.id, 'M');
  }

  return genders;
}

export function buildFamilyChartData(
  members: FamilyMember[],
  relationships: Relationship[],
): Data {
  const genders = inferGenders(members, relationships);
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
