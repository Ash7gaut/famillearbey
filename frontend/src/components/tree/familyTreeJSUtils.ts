import type { FamilyMember, Relationship } from '../../types';
import {
  buildRelationshipMaps,
  formatBirthYear,
  inferGenders,
} from './familyChartUtils';

export interface FamilyTreeJSNode {
  id: string;
  name: string;
  birthYear?: string;
  gender: 'male' | 'female';
  pids?: string[];
  fid?: string;
  mid?: string;
  img?: string;
}

export function buildFamilyTreeJSNodes(
  members: FamilyMember[],
  relationships: Relationship[],
): FamilyTreeJSNode[] {
  const genders = inferGenders(members, relationships);
  const { parents, spouses } = buildRelationshipMaps(relationships);

  return members.map((member) => {
    const node: FamilyTreeJSNode = {
      id: member.id,
      name: member.first_name,
      gender: genders.get(member.id) === 'F' ? 'female' : 'male',
    };

    const birthYear = formatBirthYear(member.birth_date);
    if (birthYear) node.birthYear = birthYear;
    if (member.photo_url) node.img = member.photo_url;

    const spouseIds = [...(spouses.get(member.id) ?? [])];
    if (spouseIds.length > 0) node.pids = spouseIds;

    const parentIds = [...(parents.get(member.id) ?? [])];
    for (const parentId of parentIds) {
      const parentGender = genders.get(parentId);
      if (parentGender === 'M' && !node.fid) node.fid = parentId;
      else if (parentGender === 'F' && !node.mid) node.mid = parentId;
      else if (!node.fid) node.fid = parentId;
      else if (!node.mid) node.mid = parentId;
    }

    return node;
  });
}
