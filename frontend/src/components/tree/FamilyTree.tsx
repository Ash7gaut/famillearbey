import { useMemo, useState, type ReactNode } from 'react';
import type { FamilyMember, TreeNode } from '../../types';
import { BranchSelector, type BranchFilter } from './BranchSelector';
import { MemberCard } from './MemberCard';
import { MemberModal } from './MemberModal';
import { TreePanZoom } from './TreePanZoom';
import { BRANCH_ACCENTS, getBranchShortTitle, getBranchTitle, sortTreeNodes } from './treeUtils';

interface FamilyTreeProps {
  tree: TreeNode[];
}

function GenerationLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-arbey-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-arbey-600">
      {children}
    </span>
  );
}

function VerticalLine({ height = 'h-5' }: { height?: string }) {
  return <div className={`${height} w-px bg-arbey-300`} />;
}

function ChildrenFork({
  nodes,
  onSelect,
  depth,
  compact,
}: {
  nodes: TreeNode[];
  onSelect: (member: FamilyMember) => void;
  depth: number;
  compact: boolean;
}) {
  if (nodes.length === 0) return null;

  const sorted = sortTreeNodes(nodes);

  return (
    <div className="flex flex-col items-center">
      <VerticalLine height="h-6" />
      <div className="flex items-start justify-center">
        {sorted.map((node, index) => (
          <div
            key={node.member.id}
            className="relative flex flex-col items-center px-3 sm:px-5"
          >
            <div className="relative flex h-6 w-full min-w-[8rem] items-start justify-center sm:min-w-[10rem]">
              {sorted.length > 1 && index > 0 && (
                <div className="absolute top-0 right-1/2 left-0 h-px bg-arbey-300" />
              )}
              {sorted.length > 1 && index < sorted.length - 1 && (
                <div className="absolute top-0 left-1/2 right-0 h-px bg-arbey-300" />
              )}
              <VerticalLine height="h-6" />
            </div>
            <TreeNodeView
              node={node}
              onSelect={onSelect}
              depth={depth + 1}
              compact={compact}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonColumn({
  member,
  exclusiveChildren,
  onSelect,
  depth,
  compact,
}: {
  member: FamilyMember;
  exclusiveChildren: TreeNode[];
  onSelect: (member: FamilyMember) => void;
  depth: number;
  compact: boolean;
}) {
  const size = compact && depth >= 1 ? 'sm' : depth >= 2 ? 'sm' : 'md';

  return (
    <div className="flex flex-col items-center">
      <MemberCard member={member} onClick={() => onSelect(member)} size={size} />
      {exclusiveChildren.length > 0 && (
        <ChildrenFork
          nodes={exclusiveChildren}
          onSelect={onSelect}
          depth={depth}
          compact={compact}
        />
      )}
    </div>
  );
}

function CoupleUnit({
  node,
  onSelect,
  depth,
  compact,
}: {
  node: TreeNode;
  onSelect: (member: FamilyMember) => void;
  depth: number;
  compact: boolean;
}) {
  const spouseBranches =
    node.spouseBranches ??
    node.spouses.map((spouse) => ({ spouse, children: [] as TreeNode[] }));

  return (
    <div className="inline-flex flex-col items-center">
      <div className="inline-flex max-w-full flex-wrap items-start justify-center gap-2 rounded-2xl border-2 border-arbey-200/80 bg-gradient-to-b from-white to-arbey-50/80 px-3 py-3 shadow-sm sm:gap-3 sm:px-4">
        <PersonColumn
          member={node.member}
          exclusiveChildren={[]}
          onSelect={onSelect}
          depth={depth}
          compact={compact}
        />
        {spouseBranches.map(({ spouse, children }) => (
          <div key={spouse.id} className="flex items-start gap-2 sm:gap-3">
            <span className="mt-8 text-base text-warm-400 sm:text-lg" aria-hidden title="Couple">
              ♥
            </span>
            <PersonColumn
              member={spouse}
              exclusiveChildren={children}
              onSelect={onSelect}
              depth={depth}
              compact={compact}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TreeNodeView({
  node,
  onSelect,
  depth = 0,
  compact = false,
}: {
  node: TreeNode;
  onSelect: (member: FamilyMember) => void;
  depth?: number;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <CoupleUnit node={node} onSelect={onSelect} depth={depth} compact={compact} />
      <ChildrenFork
        nodes={node.children}
        onSelect={onSelect}
        depth={depth}
        compact={compact}
      />
    </div>
  );
}

function AncestorsSection({
  root,
  branchCount,
  onSelect,
}: {
  root: TreeNode;
  branchCount: number;
  onSelect: (member: FamilyMember) => void;
}) {
  const rootTitle = getBranchTitle(root).replace('Branche ', '');

  return (
    <div className="flex flex-col items-center border-b border-arbey-100 bg-gradient-to-b from-arbey-50/80 to-white px-6 py-5">
      <GenerationLabel>Aïeuls</GenerationLabel>
      <div className="mt-3">
        <CoupleUnit node={root} onSelect={onSelect} depth={0} compact={false} />
      </div>
      {branchCount > 1 && (
        <div className="mt-4 flex flex-col items-center">
          <VerticalLine height="h-4" />
          <p className="mt-2 text-center text-xs text-arbey-500">
            Descendance de <span className="font-medium text-arbey-700">{rootTitle}</span>
            {' · '}
            {branchCount} branches
          </p>
        </div>
      )}
    </div>
  );
}

function BranchPanel({
  node,
  index,
  onSelect,
  compact,
}: {
  node: TreeNode;
  index: number;
  onSelect: (member: FamilyMember) => void;
  compact: boolean;
}) {
  const accent = BRANCH_ACCENTS[index % BRANCH_ACCENTS.length];

  return (
    <article
      className={`isolate flex w-max shrink-0 flex-col rounded-2xl border border-arbey-200/80 border-t-4 shadow-md ${accent}`}
    >
      <header className="border-b border-arbey-100/80 px-5 py-3 text-center">
        <h3 className="font-display text-sm font-semibold text-arbey-800">
          {getBranchTitle(node)}
        </h3>
        {node.children.length > 0 && (
          <p className="mt-0.5 text-xs text-arbey-500">
            {node.children.length} enfant{node.children.length > 1 ? 's' : ''}
          </p>
        )}
      </header>
      <div className="flex justify-center px-5 py-5">
        <TreeNodeView node={node} onSelect={onSelect} depth={0} compact={compact} />
      </div>
    </article>
  );
}

function TreeCanvas({
  root,
  branches,
  activeBranch,
  onSelect,
}: {
  root: TreeNode;
  branches: TreeNode[];
  activeBranch: BranchFilter;
  onSelect: (member: FamilyMember) => void;
}) {
  if (branches.length <= 1) {
    return (
      <div className="flex justify-center py-6">
        <TreeNodeView node={root} onSelect={onSelect} compact={false} />
      </div>
    );
  }

  if (activeBranch !== 'all') {
    const branch = branches.find((b) => b.member.id === activeBranch);
    if (!branch) return null;

    return (
      <div className="flex flex-col items-center py-8">
        <p className="mb-6 text-sm font-medium text-arbey-600">
          {getBranchShortTitle(branch)}
        </p>
        <TreeNodeView node={branch} onSelect={onSelect} compact={false} />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-8 py-6 sm:gap-10">
      {branches.map((branch, index) => (
        <BranchPanel
          key={branch.member.id}
          node={branch}
          index={index}
          onSelect={onSelect}
          compact
        />
      ))}
    </div>
  );
}

export function FamilyTree({ tree }: FamilyTreeProps) {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const root = tree[0];
  const branches = useMemo(
    () => (root ? sortTreeNodes(root.children) : []),
    [root],
  );

  const [activeBranch, setActiveBranch] = useState<BranchFilter>('all');

  if (tree.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-4xl mb-3">🌳</p>
        <p className="text-arbey-600">Aucun membre dans l'arbre généalogique.</p>
      </div>
    );
  }

  const panScale = activeBranch === 'all' ? 0.4 : 0.85;

  return (
    <>
      <div className="card overflow-hidden p-0">
        <div className="border-b border-arbey-100 bg-arbey-50/50 px-4 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-arbey-600">
            <span>
              <span className="text-warm-400">♥</span> Couple
            </span>
            <span>
              <span className="inline-block h-px w-4 bg-arbey-300 align-middle" /> Parenté
            </span>
          </div>
        </div>

        {root && branches.length > 1 && (
          <>
            <AncestorsSection
              root={root}
              branchCount={branches.length}
              onSelect={setSelectedMember}
            />
            <BranchSelector
              branches={branches}
              active={activeBranch}
              onChange={setActiveBranch}
            />
          </>
        )}

        <TreePanZoom
          key={activeBranch}
          viewKey={activeBranch}
          initialScale={panScale}
        >
          {root && (
            <TreeCanvas
              root={root}
              branches={branches}
              activeBranch={activeBranch}
              onSelect={setSelectedMember}
            />
          )}
        </TreePanZoom>
      </div>

      {selectedMember && (
        <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </>
  );
}
