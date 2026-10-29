import { MemberAvatar } from '../profile/MemberAvatar';
import type { FamilyMember } from '../../types';

interface MemberCardProps {
  member: FamilyMember;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

function formatBirthYear(date: string | null) {
  if (!date) return null;
  return new Date(date).getFullYear();
}

export function MemberCard({ member, onClick, size = 'md' }: MemberCardProps) {
  const isSmall = size === 'sm';
  const birthYear = formatBirthYear(member.birth_date);

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`tree-member-card-${member.id}`}
      className={`tree-member-card group flex flex-col items-center gap-2 rounded-2xl border border-cream-300/80 bg-cream-50 p-3 shadow-warm transition hover:border-warm-300 hover:shadow-warm-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-400 ${
        isSmall ? 'w-24' : 'w-28'
      }`}
    >
      <MemberAvatar
        member={member}
        size={isSmall ? 'xl' : '2xl'}
        className="font-display ring-2 ring-white"
      />

      <div className="text-center">
        <p className={`font-medium text-ink-800 ${isSmall ? 'text-xs' : 'text-sm'}`}>
          {member.first_name}
        </p>
        {birthYear && (
          <p className={`text-ink-400 ${isSmall ? 'text-[10px]' : 'text-xs'}`}>{birthYear}</p>
        )}
      </div>
    </button>
  );
}
