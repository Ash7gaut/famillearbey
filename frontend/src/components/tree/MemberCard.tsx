import type { FamilyMember } from '../../types';

interface MemberCardProps {
  member: FamilyMember;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
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
      className={`tree-member-card group flex flex-col items-center gap-2 rounded-2xl border border-cream-300/80 bg-cream-50 p-3 shadow-warm transition hover:border-warm-300 hover:shadow-warm-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-400 ${
        isSmall ? 'w-24' : 'w-28'
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-cream-200 to-warm-100 font-display font-semibold text-ink-700 ring-2 ring-white ${
          isSmall ? 'h-14 w-14 text-sm' : 'h-20 w-20 text-lg'
        }`}
      >
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={`${member.first_name} ${member.last_name}`}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          getInitials(member.first_name, member.last_name)
        )}
      </div>

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
