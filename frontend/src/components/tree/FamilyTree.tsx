import { useState } from 'react';
import type { FamilyMember, TreeNode } from '../../types';
import { MemberCard } from './MemberCard';
import { MemberModal } from './MemberModal';

interface FamilyTreeProps {
  tree: TreeNode[];
}

function PersonColumn({
  member,
  exclusiveChildren,
  onSelect,
}: {
  member: FamilyMember;
  exclusiveChildren: TreeNode[];
  onSelect: (member: FamilyMember) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <MemberCard member={member} onClick={() => onSelect(member)} />
      {exclusiveChildren.length > 0 && (
        <>
          <Connector />
          <div className="flex items-start justify-center gap-6 sm:gap-8">
            {exclusiveChildren.map((child) => (
              <TreeNodeView key={child.member.id} node={child} onSelect={onSelect} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SpouseGroup({
  node,
  onSelect,
}: {
  node: TreeNode;
  onSelect: (member: FamilyMember) => void;
}) {
  const spouseBranches =
    node.spouseBranches ??
    node.spouses.map((spouse) => ({ spouse, children: [] as TreeNode[] }));

  return (
    <div className="flex items-start justify-center gap-3">
      <PersonColumn member={node.member} exclusiveChildren={[]} onSelect={onSelect} />
      {spouseBranches.map(({ spouse, children }) => (
        <div key={spouse.id} className="flex items-start gap-3">
          <span className="mt-8 text-arbey-300 text-lg" aria-hidden>
            ♥
          </span>
          <PersonColumn member={spouse} exclusiveChildren={children} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex flex-col items-center py-2">
      <div className="h-6 w-px bg-arbey-200" />
      <div className="h-6 w-px bg-arbey-200" />
    </div>
  );
}

/** Rendu récursif : les enfants s'affichent directement sous leurs parents */
function TreeNodeView({
  node,
  onSelect,
}: {
  node: TreeNode;
  onSelect: (member: FamilyMember) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <SpouseGroup node={node} onSelect={onSelect} />

      {node.children.length > 0 && (
        <>
          <Connector />
          <div className="flex items-start justify-center gap-6 sm:gap-8">
            {node.children.map((child) => (
              <TreeNodeView key={child.member.id} node={child} onSelect={onSelect} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function branchLabel(_root: TreeNode): string {
  return 'Famille Arbey';
}

function TreeBranch({
  root,
  onSelect,
}: {
  root: TreeNode;
  onSelect: (member: FamilyMember) => void;
}) {
  return (
    <div className="overflow-x-auto pb-4">
      <h2 className="mb-6 text-center font-display text-sm font-semibold text-arbey-700">
        {branchLabel(root)}
      </h2>
      <div className="flex justify-center min-w-max mx-auto px-4">
        <TreeNodeView node={root} onSelect={onSelect} />
      </div>
    </div>
  );
}

export function FamilyTree({ tree }: FamilyTreeProps) {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  if (tree.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-4xl mb-3">🌳</p>
        <p className="text-arbey-600">Aucun membre dans l'arbre généalogique.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-12">
        {tree.map((root) => (
          <TreeBranch key={root.member.id} root={root} onSelect={setSelectedMember} />
        ))}
      </div>

      {selectedMember && (
        <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </>
  );
}
