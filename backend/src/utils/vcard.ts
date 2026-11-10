import type { FamilyMember } from '../types/index.js';

export interface VCardExtras {
  email: string | null;
  /** Photo déjà encodée en base64 + son type vCard (JPEG, PNG). */
  photo: { base64: string; type: 'JPEG' | 'PNG' } | null;
  profileUrl: string;
}

/** Échappement des valeurs texte (RFC 2426) : \ , ; et retours à la ligne. */
export function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** Pliage à 75 octets (UTF-8) : on ne coupe jamais au milieu d'un caractère multi-octets. */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  let limit = 75;
  for (const char of line) {
    const bytes = Buffer.byteLength(char, 'utf8');
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
      limit = 74; // les lignes de continuation commencent par un espace
    }
    current += char;
    currentBytes += bytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function birthdayLine(member: FamilyMember): string | null {
  const match = member.birth_date?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  if (member.birth_date_display === 'day_month') {
    return `BDAY;X-APPLE-OMIT-YEAR=1604:1604-${month}-${day}`;
  }
  return `BDAY:${year}-${month}-${day}`;
}

/** vCard 3.0, fins de ligne CRLF. Pur, sans I/O. */
export function buildVCard(member: FamilyMember, extras: VCardExtras): string {
  const lines: Array<string | null> = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardText(member.last_name)};${escapeVCardText(member.first_name)};;;`,
    `FN:${escapeVCardText(`${member.first_name} ${member.last_name}`)}`,
    member.phone ? `TEL;TYPE=CELL:${member.phone}` : null,
    extras.email ? `EMAIL;TYPE=INTERNET:${escapeVCardText(extras.email)}` : null,
    birthdayLine(member),
    extras.photo ? `PHOTO;ENCODING=b;TYPE=${extras.photo.type}:${extras.photo.base64}` : null,
    'CATEGORIES:Famille Arbey',
    `NOTE:${escapeVCardText(`Famille Arbey - ${extras.profileUrl}`)}`,
    'END:VCARD',
  ];
  return lines
    .filter((l): l is string => l !== null)
    .map(foldLine)
    .join('\r\n') + '\r\n';
}
