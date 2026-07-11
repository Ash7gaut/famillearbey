import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember, MemberProfile, Relationship, UpdateOwnProfileInput } from '../types/index.js';
import { sanitizeMember, sanitizeMemberBio, sanitizeMembers } from '../utils/memberBio.js';

const PROFILE_PHOTO_BUCKET = 'albums';

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
        last_name: input.last_name ?? 'Arbey',
        photo_url: input.photo_url,
        birth_date: input.birth_date,
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
        last_name: input.last_name,
        photo_url: input.photo_url,
        birth_date: input.birth_date,
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

  async getProfile(id: string): Promise<MemberProfile> {
    const context = await this.getDirectoryContext();
    const member = context.memberMap.get(id);
    if (!member) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');
    return buildMemberProfile(member, context);
  },

  async listDirectory(): Promise<MemberProfile[]> {
    const context = await this.getDirectoryContext();
    return context.members
      .map((member) => buildMemberProfile(member, context))
      .sort((a, b) => {
        const lastName = a.member.last_name.localeCompare(b.member.last_name, 'fr', {
          sensitivity: 'base',
        });
        if (lastName !== 0) return lastName;
        return a.member.first_name.localeCompare(b.member.first_name, 'fr', {
          sensitivity: 'base',
        });
      });
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

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${PROFILE_PHOTO_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return publicUrl.slice(index + marker.length);
}
