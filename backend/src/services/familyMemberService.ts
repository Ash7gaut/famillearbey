import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember, MemberProfile, Relationship, UpdateOwnProfileInput } from '../types/index.js';
import { sanitizeMember, sanitizeMemberBio, sanitizeMembers } from '../utils/memberBio.js';

import { env } from '../config/env.js';
import { buildVCard, type VCardExtras } from '../utils/vcard.js';
import { signVCardLink, VCARD_LINK_TTL_MS } from '../utils/signedLink.js';

const PROFILE_PHOTO_BUCKET = 'albums';
const VCARD_PHOTO_TIMEOUT_MS = 3000;
const VCARD_PHOTO_MAX_BYTES = 1024 * 1024;

/** Nom de famille toujours stocké en MAJUSCULES (locale FR). */
function upperLastName(value: string): string {
  return value.trim().toLocaleUpperCase('fr-FR');
}

/**
 * Numéro de téléphone : vide => null ; sinon numéro français uniquement (+33 ou 0 national,
 * 9 chiffres, 08 refusé), stocké en E.164 `+33XXXXXXXXX`. `undefined` = champ non fourni (inchangé).
 */
function normalizePhone(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const phone = value?.trim();
  if (!phone) return null;
  const invalid = () =>
    new AppError(
      400,
      'Numéro de téléphone invalide : seuls les numéros français (+33) à 9 chiffres sont acceptés, hors numéros en 08',
      'VALIDATION_ERROR',
    );
  if (!/^\+?[0-9 .()-]+$/.test(phone)) throw invalid();
  let digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) {
    if (!digits.startsWith('33')) throw invalid();
    digits = digits.slice(2);
  } else if (digits.startsWith('0033')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  } else {
    throw invalid();
  }
  // Format +33 (0)6… toléré : zéro résiduel après l'indicatif.
  if (digits.length === 10 && digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[1-79]\d{8}$/.test(digits)) throw invalid();
  return `+33${digits}`;
}

export const familyMemberService = {
  async getAll(): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .order('birth_date', { ascending: true });

    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return sanitizeMembers(data ?? []);
  },

  async getById(id: string): Promise<FamilyMember> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');
    return sanitizeMember(data);
  },

  async create(input: Partial<FamilyMember>): Promise<FamilyMember> {
    const { data, error } = await supabase
      .from('family_members')
      .insert({
        first_name: input.first_name,
        last_name: upperLastName(input.last_name ?? 'Arbey'),
        gender: input.gender ?? 'male',
        photo_url: input.photo_url,
        birth_date: input.birth_date,
        phone: normalizePhone(input.phone),
        death_date: input.death_date,
        bio: sanitizeMemberBio(input.bio),
        is_alive: input.is_alive ?? true,
      })
      .select()
      .single();

    if (error) throw new AppError(400, error.message, 'DB_ERROR');
    return sanitizeMember(data);
  },

  async update(id: string, input: Partial<FamilyMember>): Promise<FamilyMember> {
    const { data, error } = await supabase
      .from('family_members')
      .update({
        first_name: input.first_name,
        last_name: input.last_name === undefined ? undefined : upperLastName(input.last_name),
        gender: input.gender,
        tribu_id: input.tribu_id,
        photo_url: input.photo_url,
        birth_date: input.birth_date,
        phone: normalizePhone(input.phone),
        death_date: input.death_date,
        bio: sanitizeMemberBio(input.bio),
        is_alive: input.is_alive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');
    return sanitizeMember(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) throw new AppError(400, error.message, 'DB_ERROR');
  },

  /** Lien signé (2 min) vers la vCard, relatif à la base de l'API (`/api/v1`). */
  async createVCardLink(id: string): Promise<{ url: string }> {
    await this.getById(id);
    const exp = Date.now() + VCARD_LINK_TTL_MS;
    return { url: `/members/${id}/vcard?exp=${exp}&sig=${signVCardLink(id, exp)}` };
  },

  async getVCard(id: string): Promise<{ content: string; fileName: string }> {
    const member = await this.getById(id);
    const [email, photo] = await Promise.all([getMemberEmail(member), fetchPhoto(member.photo_url)]);
    const content = buildVCard(member, {
      email,
      photo,
      profileUrl: `${env.appUrl}/profil/${member.id}`,
    });
    return { content, fileName: `${member.first_name} ${member.last_name}.vcf` };
  },

  async getProfile(id: string): Promise<MemberProfile> {
    const context = await this.getDirectoryContext();
    const member = context.memberMap.get(id);
    if (!member) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');
    return buildMemberProfile(member, context);
  },

  async getDirectoryContext() {
    const [members, relationships] = await Promise.all([this.getAll(), getAllRelationships()]);
    const memberMap = new Map(members.map((m) => [m.id, m]));
    return { members, relationships, memberMap };
  },

  async updateOwnProfile(memberId: string, input: UpdateOwnProfileInput): Promise<FamilyMember> {
    const payload: Record<string, string | null | undefined> = {};

    if (input.bio !== undefined) {
      payload.bio = sanitizeMemberBio(input.bio?.trim() ? input.bio.trim() : null);
    }

    if (input.birth_date !== undefined) {
      payload.birth_date = input.birth_date || null;
    }

    if (input.birth_date_display !== undefined) {
      payload.birth_date_display = input.birth_date_display;
    }

    if (input.phone !== undefined) {
      payload.phone = normalizePhone(input.phone);
    }

    if (Object.keys(payload).length === 0) {
      return this.getById(memberId);
    }

    const { data, error } = await supabase
      .from('family_members')
      .update(payload)
      .eq('id', memberId)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');
    return sanitizeMember(data);
  },

  async uploadProfilePhoto(memberId: string, file: Express.Multer.File): Promise<FamilyMember> {
    const member = await this.getById(memberId);
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const storagePath = `profiles/${memberId}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_PHOTO_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw new AppError(500, uploadError.message, 'STORAGE_ERROR');

    const { data: urlData } = supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(storagePath);

    if (member.photo_url?.includes('/profiles/')) {
      const oldPath = extractStoragePath(member.photo_url);
      if (oldPath) {
        await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([oldPath]);
      }
    }

    return this.update(memberId, { photo_url: urlData.publicUrl });
  },
};

function buildMemberProfile(
  member: FamilyMember,
  context: {
    relationships: Relationship[];
    memberMap: Map<string, FamilyMember>;
  },
): MemberProfile {
  const cleanMember = sanitizeMember(member);

  return {
    member: cleanMember,
    parents: getRelatedMembers(member.id, context.relationships, context.memberMap, 'parents'),
    children: getRelatedMembers(member.id, context.relationships, context.memberMap, 'children'),
    spouses: getRelatedMembers(member.id, context.relationships, context.memberMap, 'spouses'),
    siblings: getRelatedMembers(member.id, context.relationships, context.memberMap, 'siblings'),
  };
}

async function getAllRelationships(): Promise<Relationship[]> {
  const { data, error } = await supabase.from('relationships').select('*');
  if (error) throw new AppError(500, error.message, 'DB_ERROR');
  return data ?? [];
}

function getRelatedMembers(
  memberId: string,
  relationships: Relationship[],
  memberMap: Map<string, FamilyMember>,
  kind: 'parents' | 'children' | 'spouses' | 'siblings',
): FamilyMember[] {
  const seen = new Set<string>();
  const result: FamilyMember[] = [];

  const pushMember = (id: string) => {
    if (seen.has(id)) return;
    const related = memberMap.get(id);
    if (!related) return;
    seen.add(id);
    result.push(related);
  };

  for (const rel of relationships) {
    if (kind === 'parents' && rel.relationship_type === 'parent' && rel.related_member_id === memberId) {
      pushMember(rel.member_id);
    }
    if (kind === 'children' && rel.relationship_type === 'parent' && rel.member_id === memberId) {
      pushMember(rel.related_member_id);
    }
    if (kind === 'spouses' && rel.relationship_type === 'spouse') {
      if (rel.member_id === memberId) pushMember(rel.related_member_id);
      if (rel.related_member_id === memberId) pushMember(rel.member_id);
    }
    if (kind === 'siblings' && rel.relationship_type === 'sibling') {
      if (rel.member_id === memberId) pushMember(rel.related_member_id);
      if (rel.related_member_id === memberId) pushMember(rel.member_id);
    }
  }

  return result.sort((a, b) => a.first_name.localeCompare(b.first_name, 'fr'));
}

/** Email réel du compte (auth), à défaut l'email d'invitation. */
async function getMemberEmail(member: FamilyMember): Promise<string | null> {
  if (member.auth_user_id) {
    const { data } = await supabase.auth.admin.getUserById(member.auth_user_id);
    if (data?.user?.email) return data.user.email;
  }
  return member.invite_email ?? null;
}

/** Photo encodée en base64 pour la vCard ; null si erreur, timeout, non-image ou > 1 Mo. */
async function fetchPhoto(url: string | null): Promise<VCardExtras['photo']> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(VCARD_PHOTO_TIMEOUT_MS) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    const type = contentType === 'image/jpeg' ? 'JPEG' : contentType === 'image/png' ? 'PNG' : null;
    if (!type) return null;
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > VCARD_PHOTO_MAX_BYTES) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > VCARD_PHOTO_MAX_BYTES) return null;
    return { base64: buffer.toString('base64'), type };
  } catch {
    return null;
  }
}

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${PROFILE_PHOTO_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return publicUrl.slice(index + marker.length);
}
