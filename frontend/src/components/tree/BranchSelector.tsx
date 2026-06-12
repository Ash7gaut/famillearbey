import type { TreeNode } from '../../types';
import { getBranchShortTitle } from './treeUtils';

export type BranchFilter = 'all' | string;

interface BranchSelectorProps {
  branches: TreeNode[];
  active: BranchFilter;
  onChange: (value: BranchFilter) => void;
}

export function BranchSelector({ branches, active, onChange }: BranchSelectorProps) {
  return (
    <div className="border-b border-arbey-100 bg-white px-4 py-3 sm:px-6">
      <p className="mb-2 text-xs font-medium text-arbey-500">Filtrer la vue</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          label="Tout voir"
          active={active === 'all'}
          onClick={() => onChange('all')}
        />
        {branches.map((branch) => (
          <FilterChip
            key={branch.member.id}
            label={getBranchShortTitle(branch)}
            active={active === branch.member.id}
            onClick={() => onChange(branch.member.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tree-control shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-arbey-800 text-white shadow-sm'
          : 'border border-arbey-200 bg-arbey-50 text-arbey-700 hover:border-arbey-300 hover:bg-arbey-100'
      }`}
    >
      {label}
    </button>
  );
}
