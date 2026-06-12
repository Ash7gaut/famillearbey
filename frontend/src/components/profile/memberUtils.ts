import type { FamilyMember } from '../../types';

/** Retire les tags techniques de seed type [branche-gautier-arbey]. */
export function sanitizeMemberBio(bio: string | null | undefined): string | null {
  if (!bio) return null;

  const cleaned = bio
    .replace(/\s*\[branche[-\w]+\]/gi, '')
    .replace(/\s*branche-gautier-arbey/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || null;
}

export function getInitials(member: FamilyMember) {
  return `${member.first_name[0] ?? ''}${member.last_name[0] ?? ''}`.toUpperCase();
}

export function memberFullName(member: FamilyMember) {
  return `${member.first_name} ${member.last_name}`;
}

export function sortMembersByName(members: FamilyMember[]) {
  return [...members].sort((a, b) =>
    a.first_name.localeCompare(b.first_name, 'fr', { sensitivity: 'base' }),
  );
}
