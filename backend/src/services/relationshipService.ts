import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember, Relationship, SpouseBranch, TreeNode } from '../types/index.js';
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
      const rawRoots = members
        .filter((m) => !hasParent.has(m.id))
        .map((m) => m.id);
      rootIds = filterRoots(rawRoots, memberMap, relationships);
    }

    const buildNode = (memberId: string, visited: Set<string>): TreeNode | null => {
      if (visited.has(memberId)) return null;
      visited.add(memberId);

      const member = memberMap.get(memberId);
      if (!member) return null;

      const spouses = getSpouses(memberId, memberMap, relationships);
      const memberChildIds = new Set(getChildIds(memberId, relationships));

      const spouseBranches: SpouseBranch[] = spouses.map((spouse) => ({
        spouse,
        children: getChildIds(spouse.id, relationships)
          .filter((id) => !memberChildIds.has(id))
          .map((id) => buildNode(id, visited))
          .filter((n): n is TreeNode => n !== null),
      }));

      return {
        member,
        parents: [],
        spouses,
        spouseBranches,
        children: [...memberChildIds]
          .map((id) => buildNode(id, visited))
          .filter((n): n is TreeNode => n !== null),
      };
    };

    // Un visited par racine — évite que les branches se bloquent mutuellement
    return rootIds
      .map((id) => buildNode(id, new Set<string>()))
      .filter((n): n is TreeNode => n !== null);
  },
};

function getSpouses(
  memberId: string,
  memberMap: Map<string, FamilyMember>,
  relationships: Relationship[],
): FamilyMember[] {
  const seen = new Set<string>();
  const spouses: FamilyMember[] = [];

  for (const r of relationships) {
    if (r.relationship_type !== 'spouse') continue;
    if (r.member_id !== memberId && r.related_member_id !== memberId) continue;

    const spouseId = r.member_id === memberId ? r.related_member_id : r.member_id;
    if (seen.has(spouseId)) continue;

    const spouse = memberMap.get(spouseId);
    if (spouse) {
      seen.add(spouseId);
      spouses.push(spouse);
    }
  }

  return spouses;
}

function getParentIds(memberId: string, relationships: Relationship[]): string[] {
  return relationships
    .filter((r) => r.relationship_type === 'parent' && r.related_member_id === memberId)
    .map((r) => r.member_id);
}

/** Une seule racine par couple + exclut les beaux-parents déjà dans l'arbre */
function filterRoots(
  rootIds: string[],
  memberMap: Map<string, FamilyMember>,
  relationships: Relationship[],
): string[] {
  const rootSet = new Set(rootIds);

  const dedupedCouples = rootIds.filter((id) => {
    for (const spouse of getSpouses(id, memberMap, relationships)) {
      if (rootSet.has(spouse.id) && id > spouse.id) return false;
    }
    return true;
  });

  return dedupedCouples.filter((id) => {
    const spouses = getSpouses(id, memberMap, relationships);
    const children = getChildIds(id, relationships);
    const spouseHasParents = spouses.some(
      (s) => getParentIds(s.id, relationships).length > 0,
    );
    // Ex: Bernard (pas de parents) dont la femme Sybille est déjà dans l'arbre
    if (children.length > 0 && spouseHasParents) return false;
    return true;
  });
}

function getChildIds(memberId: string, relationships: Relationship[]): string[] {
  const seen = new Set<string>();
  const children: string[] = [];

  for (const r of relationships) {
    if (r.relationship_type !== 'parent' || r.member_id !== memberId) continue;
    if (seen.has(r.related_member_id)) continue;
    seen.add(r.related_member_id);
    children.push(r.related_member_id);
  }

  return children;
}
