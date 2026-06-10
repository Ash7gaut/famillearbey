import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember, Relationship, TreeNode } from '../types/index.js';
import { familyMemberService } from './familyMemberService.js';

export const relationshipService = {
  async getAll(): Promise<Relationship[]> {
    const { data, error } = await supabase.from('relationships').select('*');
    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return data ?? [];
  },

  async create(input: {
    member_id: string;
    related_member_id: string;
    relationship_type: string;
  }): Promise<Relationship> {
    const { data, error } = await supabase
      .from('relationships')
      .insert(input)
      .select()
      .single();

    if (error) throw new AppError(400, error.message, 'DB_ERROR');
    return data;
  },

  /** Construit l'arbre généalogique à partir d'un membre racine */
  async buildTree(rootId?: string): Promise<TreeNode[]> {
    const [members, relationships] = await Promise.all([
      familyMemberService.getAll(),
      this.getAll(),
    ]);

    const memberMap = new Map(members.map((m) => [m.id, m]));

    // Trouver les racines (membres sans parents connus)
    const hasParent = new Set<string>();
    for (const rel of relationships) {
      if (rel.relationship_type === 'parent') {
        hasParent.add(rel.related_member_id);
      }
    }

    let rootIds: string[];
    if (rootId) {
      rootIds = [rootId];
    } else {
      rootIds = members
        .filter((m) => !hasParent.has(m.id))
        .map((m) => m.id);
    }

    const visited = new Set<string>();

    const buildNode = (memberId: string): TreeNode | null => {
      if (visited.has(memberId)) return null;
      visited.add(memberId);

      const member = memberMap.get(memberId);
      if (!member) return null;

      const spouses = getSpouses(memberId, memberMap, relationships);
      const parentIds = getParentIds(memberId, relationships);
      const childIds = getChildIds(memberId, relationships);

      return {
        member,
        parents: parentIds
          .map((id) => buildNode(id))
          .filter((n): n is TreeNode => n !== null),
        spouses,
        children: childIds
          .map((id) => buildNode(id))
          .filter((n): n is TreeNode => n !== null),
      };
    };

    return rootIds
      .map((id) => buildNode(id))
      .filter((n): n is TreeNode => n !== null);
  },
};

function getSpouses(
  memberId: string,
  memberMap: Map<string, FamilyMember>,
  relationships: Relationship[],
): FamilyMember[] {
  return relationships
    .filter(
      (r) =>
        r.relationship_type === 'spouse' &&
        (r.member_id === memberId || r.related_member_id === memberId),
    )
    .map((r) => {
      const spouseId = r.member_id === memberId ? r.related_member_id : r.member_id;
      return memberMap.get(spouseId);
    })
    .filter((m): m is FamilyMember => m !== undefined);
}

function getParentIds(memberId: string, relationships: Relationship[]): string[] {
  return relationships
    .filter((r) => r.relationship_type === 'parent' && r.related_member_id === memberId)
    .map((r) => r.member_id);
}

function getChildIds(memberId: string, relationships: Relationship[]): string[] {
  return relationships
    .filter((r) => r.relationship_type === 'parent' && r.member_id === memberId)
    .map((r) => r.related_member_id);
}
