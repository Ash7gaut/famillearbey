import { useState } from 'react';
import type { FamilyMember, TreeNode } from '../../types';
import { MemberCard } from './MemberCard';
import { MemberModal } from './MemberModal';

interface FamilyTreeProps {
  tree: TreeNode[];
}

function SpouseGroup({
  node,
  onSelect,
}: {
  node: TreeNode;
  onSelect: (member: FamilyMember) => void;
}) {
  const allMembers = [node.member, ...node.spouses];

  return (
    <div className="flex items-end gap-3">
      {allMembers.map((member, i) => (
        <div key={member.id} className="flex items-end gap-3">
          {i > 0 && (
            <span className="mb-8 text-arbey-300 text-lg" aria-hidden>
              ♥
            </span>
          )}
          <MemberCard member={member} onClick={() => onSelect(member)} />
        </div>
      ))}
    </div>
  );
}

function Generation({
  nodes,
  label,
  onSelect,
}: {
  nodes: TreeNode[];
  label?: string;
  onSelect: (member: FamilyMember) => void;
}) {
  if (nodes.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {label && (
        <span className="text-xs font-medium uppercase tracking-wider text-arbey-400">
          {label}
        </span>
      )}
      <div className="flex flex-wrap justify-center gap-8">
        {nodes.map((node) => (
          <SpouseGroup key={node.member.id} node={node} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex flex-col items-center py-2">
      <div className="h-6 w-px bg-arbey-200" />
      <div className="h-px w-24 bg-arbey-200" />
      <div className="h-6 w-px bg-arbey-200" />
    </div>
  );
}

/** Aplatit l'arbre en générations pour l'affichage */
function flattenGenerations(tree: TreeNode[]): TreeNode[][] {
  const generations: TreeNode[][] = [];

  function walk(nodes: TreeNode[], depth: number) {
    if (nodes.length === 0) return;
    if (!generations[depth]) generations[depth] = [];
    generations[depth].push(...nodes);

    const children = nodes.flatMap((n) => n.children);
    walk(children, depth + 1);
  }

  walk(tree, 0);
  return generations;
}

const generationLabels = ['Aînés', 'Parents', 'Enfants', 'Petits-enfants'];

export function FamilyTree({ tree }: FamilyTreeProps) {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const generations = flattenGenerations(tree);

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
      <div className="overflow-x-auto pb-4">
        <div className="flex flex-col items-center min-w-max mx-auto gap-0">
          {generations.map((gen, i) => (
            <div key={i} className="flex flex-col items-center">
              <Generation
                nodes={gen}
                label={generationLabels[i] ?? `Génération ${i + 1}`}
                onSelect={setSelectedMember}
              />
              {i < generations.length - 1 && <Connector />}
            </div>
          ))}
        </div>
      </div>

      {selectedMember && (
        <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </>
  );
}
