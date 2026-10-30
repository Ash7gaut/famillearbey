import { memo } from 'react';
import { MemberAvatar } from '../profile/MemberAvatar';
import type { FamilyMember } from '../../types';
import { CARD_H, CARD_W } from './treeLayout';

interface TreeNodeCardProps {
  member: FamilyMember;
  x: number;
  y: number;
  highlighted: boolean;
  onSelect: (member: FamilyMember) => void;
}

function lifeSpan(member: FamilyMember): string {
  const birth = member.birth_date ? new Date(member.birth_date).getFullYear() : null;
  const death = member.death_date ? new Date(member.death_date).getFullYear() : null;
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return member.is_alive ? `${birth}` : `${birth} –`;
  if (death) return `† ${death}`;
  return '';
}

export const TreeNodeCard = memo(function TreeNodeCard({
  member,
  x,
  y,
  highlighted,
  onSelect,
}: TreeNodeCardProps) {
  const female = member.gender === 'female';
  const years = lifeSpan(member);

  return (
    <button
      type="button"
      data-testid={`tree-member-${member.id}`}
      onClick={() => onSelect(member)}
      style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
      className={`focus-ring absolute flex items-center gap-3 overflow-hidden rounded-2xl border border-l-4 bg-cream-50 py-3 pl-3 pr-3 text-left shadow-warm transition-shadow hover:shadow-warm-md ${
        female ? 'border-l-warm-400' : 'border-l-arbey-500'
      } ${highlighted ? 'border-warm-500 ring-2 ring-warm-500/60' : 'border-cream-300'} ${
        member.is_alive ? '' : 'bg-cream-100'
      }`}
    >
      <span>
        <MemberAvatar
          member={member}
          size="xl"
          initialsTone={member.is_alive ? (female ? 'warm' : 'arbey') : 'cream'}
          className="font-display"
          data-testid={`tree-member-avatar-${member.id}`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[17px] font-semibold leading-tight text-ink-800">
          {member.first_name}
        </span>
        <span className="block truncate text-sm text-ink-600">{member.last_name}</span>
        <span className="mt-1 flex items-center gap-1.5">
          {years && <span className="whitespace-nowrap text-sm tabular-nums text-ink-600">{years}</span>}
          {member.is_mamie && (
            <span
              data-testid={`tree-member-mamie-badge-${member.id}`}
              className="shrink-0 rounded-full bg-warm-100 px-2 py-0.5 text-[11px] font-semibold leading-none uppercase tracking-wide text-warm-800"
            >
              Mamie
            </span>
          )}
        </span>
      </span>
    </button>
  );
});
