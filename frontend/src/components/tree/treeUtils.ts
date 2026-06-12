import type { TreeNode } from '../../types';

export function sortTreeNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => {
    const dateA = a.member.birth_date ?? '';
    const dateB = b.member.birth_date ?? '';
    if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
    return a.member.first_name.localeCompare(b.member.first_name, 'fr');
  });
}

export function getBranchTitle(node: TreeNode): string {
  return getBranchShortTitle(node);
}

export function getBranchShortTitle(node: TreeNode): string {
  const spouse = node.spouseBranches?.[0]?.spouse ?? node.spouses[0];
  if (spouse) return `${node.member.first_name} & ${spouse.first_name}`;
  return node.member.first_name;
}

export const BRANCH_ACCENTS = [
  'border-t-arbey-500 bg-arbey-50/70',
  'border-t-warm-500 bg-warm-50/60',
  'border-t-arbey-400 bg-arbey-50/50',
  'border-t-warm-400 bg-warm-50/50',
  'border-t-arbey-600 bg-arbey-100/40',
  'border-t-warm-600 bg-warm-100/40',
] as const;
