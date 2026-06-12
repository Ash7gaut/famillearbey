import type { FamilyMember } from '../../types';
import { getInitials } from './memberUtils';

interface MemberAvatarProps {
  member: FamilyMember;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function MemberAvatar({ member, size = 'sm' }: MemberAvatarProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream-200 font-semibold text-ink-600 ${sizeClasses[size]}`}
    >
      {member.photo_url ? (
        <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
      ) : (
        getInitials(member)
      )}
    </span>
  );
}
