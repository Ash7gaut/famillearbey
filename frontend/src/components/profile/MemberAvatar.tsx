import type { FamilyMember } from '../../types';
import { getInitials } from './memberUtils';

export type AvatarPerson = Pick<FamilyMember, 'first_name' | 'last_name' | 'photo_url'>;

interface MemberAvatarProps {
  member: AvatarPerson;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  shape?: 'circle' | 'rounded';
  className?: string;
}

const sizeClasses = {
  xs: 'h-7 w-7 text-xs',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-9 w-9 text-sm',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-14 w-14 text-base',
  '2xl': 'h-20 w-20 text-lg',
  hero: 'h-28 w-28 text-3xl sm:h-32 sm:w-32',
};

const shapeClasses = {
  circle: 'rounded-full',
  rounded: 'rounded-2xl',
};

export function MemberAvatar({
  member,
  size = 'sm',
  shape = 'circle',
  className = '',
}: MemberAvatarProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-cream-200 font-semibold text-ink-600 ${shapeClasses[shape]} ${sizeClasses[size]} ${className}`}
    >
      {member.photo_url ? (
        <img
          src={member.photo_url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(member)
      )}
    </span>
  );
}
