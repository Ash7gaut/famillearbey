import type { BirthDateDisplay, FamilyMember } from '../../types';

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

export function getInitials(member: Pick<FamilyMember, 'first_name' | 'last_name'>) {
  return `${member.first_name[0] ?? ''}${member.last_name[0] ?? ''}`.toUpperCase();
}

export function avatarPersonFromDisplayName(
  displayName: string,
  photoUrl?: string | null,
): Pick<FamilyMember, 'first_name' | 'last_name' | 'photo_url'> {
  const parts = displayName.trim().split(/\s+/);
  const first_name = parts[0] ?? displayName;
  const last_name = parts.slice(1).join(' ');
  return { first_name, last_name, photo_url: photoUrl ?? null };
}

export function memberFullName(member: Pick<FamilyMember, 'first_name' | 'last_name'>) {
  return `${member.first_name} ${member.last_name}`;
}

export function getMemberAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function formatBirthDateForProfile(
  birthDate: string,
  display: BirthDateDisplay = 'full',
): { label: string; age: number | null } {
  const date = new Date(birthDate);
  const label =
    display === 'day_month'
      ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    label,
    age: display === 'full' ? getMemberAge(birthDate) : null,
  };
}

export function sortMembersByName(members: FamilyMember[]) {
  return [...members].sort((a, b) =>
    a.first_name.localeCompare(b.first_name, 'fr', { sensitivity: 'base' }),
  );
}
