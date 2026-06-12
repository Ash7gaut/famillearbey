import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Album, AlbumCreator, AlbumVisibility, FamilyMember } from '../types/index.js';
import {
  assertAlbumAccess,
  canManageAlbum,
  filterAlbumsForViewer,
} from './albumAccessService.js';

const PHOTO_BUCKET = 'albums';

async function enrichAlbumsWithCreators(albums: Album[]): Promise<Album[]> {
  const creatorIds = [
    ...new Set(albums.map((album) => album.created_by).filter((id): id is string => !!id)),
  ];

  if (creatorIds.length === 0) {
    return albums.map((album) => ({ ...album, creator: null }));
  }

  const { data: members, error } = await supabase
    .from('family_members')
    .select('id, first_name, last_name, photo_url')
    .in('id', creatorIds);

  if (error) throw new AppError(500, error.message, 'DB_ERROR');

  const memberMap = new Map((members as AlbumCreator[] | null)?.map((member) => [member.id, member]));

  return albums.map((album) => ({
    ...album,
    creator: album.created_by ? memberMap.get(album.created_by) ?? null : null,
  }));
}

export const albumService = {
  async getAll(viewerMemberId?: string | null): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('event_date', { ascending: false, nullsFirst: false });

    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    const visible = await filterAlbumsForViewer(data ?? [], viewerMemberId);
    return enrichAlbumsWithCreators(visible);
  },

  async getById(id: string, viewerMemberId?: string | null): Promise<Album> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError(404, 'Album introuvable', 'NOT_FOUND');
    await assertAlbumAccess(data, viewerMemberId);
    const [album] = await enrichAlbumsWithCreators([data]);
    return album;
  },

  async create(input: {
    title: string;
    description?: string;
    event_date?: string;
    visibility?: AlbumVisibility;
    created_by: string;
  }): Promise<Album> {
    const { data, error } = await supabase
      .from('albums')
      .insert({
        title: input.title,
        description: input.description,
        event_date: input.event_date,
        visibility: input.visibility ?? 'family',
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) throw new AppError(400, error.message, 'DB_ERROR');
    const [album] = await enrichAlbumsWithCreators([data]);
    return album;
  },

  async update(id: string, input: Partial<Album>): Promise<Album> {
    const { data, error } = await supabase
      .from('albums')
      .update({
        title: input.title,
        description: input.description,
        event_date: input.event_date,
        cover_url: input.cover_url,
        visibility: input.visibility,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Album introuvable', 'NOT_FOUND');
    const [album] = await enrichAlbumsWithCreators([data]);
    return album;
  },

  async delete(id: string, member: FamilyMember): Promise<void> {
    const album = await this.getById(id, member.id);
    if (!canManageAlbum(album, member)) {
      throw new AppError(403, 'Vous ne pouvez pas supprimer cet album', 'FORBIDDEN');
    }

    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('storage_path')
      .eq('album_id', id);

    if (photosError) throw new AppError(500, photosError.message, 'DB_ERROR');

    const storagePaths = (photos ?? []).map((photo) => photo.storage_path);
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .remove(storagePaths);
      if (storageError) throw new AppError(500, storageError.message, 'STORAGE_ERROR');
    }

    const { error } = await supabase.from('albums').delete().eq('id', id);
    if (error) throw new AppError(500, error.message, 'DB_ERROR');
  },
};
