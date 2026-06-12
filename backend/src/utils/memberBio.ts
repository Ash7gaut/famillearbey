import type { FamilyMember } from '../types/index.js';

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

export function sanitizeMember(member: FamilyMember): FamilyMember {
  return {
    ...member,
    bio: sanitizeMemberBio(member.bio),
  };
}

export function sanitizeMembers(members: FamilyMember[]): FamilyMember[] {
  return members.map(sanitizeMember);
}
