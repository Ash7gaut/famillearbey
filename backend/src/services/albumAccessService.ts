import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Album, FamilyMember, Photo, Relationship } from '../types/index.js';

export type AlbumVisibility = 'family' | 'close_family';

async function getAllRelationships(): Promise<Relationship[]> {
  const { data, error } = await supabase.from('relationships').select('*');
  if (error) throw new AppError(500, error.message, 'DB_ERROR');
  return data ?? [];
}

export function getCloseFamilyMemberIds(
  memberId: string,
  relationships: Relationship[],
): Set<string> {
  const ids = new Set<string>([memberId]);

  for (const rel of relationships) {
    if (rel.relationship_type === 'parent' && rel.related_member_id === memberId) {
      ids.add(rel.member_id);
    }
    if (rel.relationship_type === 'parent' && rel.member_id === memberId) {
      ids.add(rel.related_member_id);
    }
    if (rel.relationship_type === 'spouse') {
      if (rel.member_id === memberId) ids.add(rel.related_member_id);
      if (rel.related_member_id === memberId) ids.add(rel.member_id);
    }
    if (rel.relationship_type === 'sibling') {
      if (rel.member_id === memberId) ids.add(rel.related_member_id);
      if (rel.related_member_id === memberId) ids.add(rel.member_id);
    }
  }

  return ids;
}

export function canViewAlbum(
  album: Album,
  viewerMemberId: string | null | undefined,
  relationships: Relationship[],
): boolean {
  if (album.visibility !== 'close_family') return true;
  if (!viewerMemberId || !album.created_by) return false;
  if (viewerMemberId === album.created_by) return true;

  const closeFamily = getCloseFamilyMemberIds(album.created_by, relationships);
  return closeFamily.has(viewerMemberId);
}

export function canManageAlbum(
  album: Album,
  member: FamilyMember | undefined,
): boolean {
  if (!member) return false;
  return member.is_admin || album.created_by === member.id;
}

export function canDeletePhoto(
  _photo: Photo,
  album: Album,
  member: FamilyMember | undefined,
): boolean {
  if (!member) return false;
  if (member.is_admin) return true;
  return album.created_by === member.id;
}

export async function filterAlbumsForViewer(
  albums: Album[],
  viewerMemberId: string | null | undefined,
): Promise<Album[]> {
  const relationships = await getAllRelationships();
  return albums.filter((album) => canViewAlbum(album, viewerMemberId, relationships));
}

export async function assertAlbumAccess(
  album: Album,
  viewerMemberId: string | null | undefined,
): Promise<void> {
  const relationships = await getAllRelationships();
  if (!canViewAlbum(album, viewerMemberId, relationships)) {
    throw new AppError(404, 'Album introuvable', 'NOT_FOUND');
  }
}

export function withAlbumMeta(album: Album, member: FamilyMember | undefined) {
  return {
    ...album,
    can_manage: canManageAlbum(album, member),
  };
}

export function withPhotoMeta(
  photo: Photo,
  album: Album,
  member: FamilyMember | undefined,
) {
  return {
    ...photo,
    can_delete: canDeletePhoto(photo, album, member),
  };
}
