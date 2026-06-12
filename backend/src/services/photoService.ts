import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember, Photo } from '../types/index.js';
import { canDeletePhoto } from './albumAccessService.js';
import { albumService } from './albumService.js';

const BUCKET = 'albums';

export const photoService = {
  async getByAlbum(albumId: string, viewerMemberId?: string | null): Promise<Photo[]> {
    await albumService.getById(albumId, viewerMemberId);

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return data ?? [];
  },

  async upload(
    albumId: string,
    file: Express.Multer.File,
    member: FamilyMember,
    caption?: string,
  ): Promise<Photo> {
    await albumService.getById(albumId, member.id);

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const storagePath = `${albumId}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw new AppError(500, uploadError.message, 'STORAGE_ERROR');

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const { data, error } = await supabase
      .from('photos')
      .insert({
        album_id: albumId,
        storage_path: storagePath,
        url: urlData.publicUrl,
        caption,
        uploaded_by: member.id,
      })
      .select()
      .single();

    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    // Mettre à jour la cover de l'album si absente
    const album = await albumService.getById(albumId);
    if (!album.cover_url) {
      await albumService.update(albumId, { cover_url: urlData.publicUrl });
    }

    return data;
  },

  async delete(id: string, member: FamilyMember): Promise<void> {
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !photo) throw new AppError(404, 'Photo introuvable', 'NOT_FOUND');

    const album = await albumService.getById(photo.album_id, member.id);
    if (!canDeletePhoto(photo, album, member)) {
      throw new AppError(403, 'Vous ne pouvez pas supprimer cette photo', 'FORBIDDEN');
    }

    await supabase.storage.from(BUCKET).remove([photo.storage_path]);

    const { error } = await supabase.from('photos').delete().eq('id', id);
    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    if (album.cover_url === photo.url) {
      const { data: remaining } = await supabase
        .from('photos')
        .select('url')
        .eq('album_id', photo.album_id)
        .order('created_at', { ascending: false })
        .limit(1);

      await albumService.update(photo.album_id, {
        cover_url: remaining?.[0]?.url ?? null,
      });
    }
  },
};
