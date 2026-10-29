import type { FamilyMember } from '../../types';
import { getInitials } from './memberUtils';

export type AvatarPerson = Pick<FamilyMember, 'first_name' | 'last_name' | 'photo_url'>;

type InitialsTone = 'cream' | 'warm' | 'arbey' | 'muted';

interface MemberAvatarProps {
  member: AvatarPerson;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  shape?: 'circle' | 'rounded';
  /** Couleur du cercle quand il n'y a pas de photo. */
  initialsTone?: InitialsTone;
  className?: string;
  'data-testid'?: string;
}

const initialsToneClasses: Record<InitialsTone, string> = {
  cream: 'bg-cream-200 text-ink-600',
  warm: 'bg-warm-200 text-warm-800 ring-2 ring-warm-100',
  arbey: 'bg-arbey-200 text-arbey-800 ring-2 ring-arbey-100',
  muted: 'bg-ink-100 text-ink-500 ring-2 ring-cream-200',
};

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
  initialsTone = 'cream',
  className = '',
  'data-testid': testId = 'member-avatar',
}: MemberAvatarProps) {
  const hasPhoto = Boolean(member.photo_url);

  return (
    <span
      data-testid={testId}
      className={`flex shrink-0 items-center justify-center overflow-hidden font-semibold ${shapeClasses[shape]} ${sizeClasses[size]} ${
        hasPhoto ? 'bg-cream-200 text-ink-600' : initialsToneClasses[initialsTone]
      } ${className}`}
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
