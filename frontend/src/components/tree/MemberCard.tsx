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
      className={`tree-member-card group flex flex-col items-center gap-2 rounded-2xl border border-arbey-100 bg-white p-3 shadow-sm transition hover:border-arbey-400 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arbey-400 ${
        isSmall ? 'w-28' : 'w-36'
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-arbey-100 to-warm-100 font-display font-semibold text-arbey-700 ${
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
        <p className={`font-medium text-arbey-900 ${isSmall ? 'text-xs' : 'text-sm'}`}>
          {member.first_name}
        </p>
        <p className={`text-arbey-500 ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
          {member.last_name}
          {birthYear && ` · ${birthYear}`}
        </p>
      </div>
    </button>
  );
}
