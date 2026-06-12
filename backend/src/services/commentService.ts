import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CommentAuthor, PhotoComment, PhotoLatestComment } from '../types/comment.js';
import type { FamilyMember } from '../types/index.js';
import { photoService } from './photoService.js';

async function getPhotoForComment(photoId: string, viewerMemberId?: string | null) {
  const { data: photo, error } = await supabase
    .from('photos')
    .select('*')
    .eq('id', photoId)
    .single();

  if (error || !photo) throw new AppError(404, 'Photo introuvable', 'NOT_FOUND');

  await photoService.getByAlbum(photo.album_id, viewerMemberId);
  return photo;
}

function withCommentMeta(
  comment: {
    id: string;
    photo_id: string;
    content: string;
    created_at: string;
    author: CommentAuthor;
  },
  member?: FamilyMember,
): PhotoComment {
  return {
    ...comment,
    can_delete: !!member && (member.is_admin || member.id === comment.author.id),
  };
}

export const commentService = {
  async getLatestByPhotoIds(photoIds: string[]): Promise<Map<string, PhotoLatestComment>> {
    if (photoIds.length === 0) return new Map();

    const { data: comments, error } = await supabase
      .from('comments')
      .select('id, photo_id, content, created_at, author_id')
      .in('photo_id', photoIds)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    const latestByPhoto = new Map<string, (typeof comments)[number]>();
    for (const comment of comments ?? []) {
      if (!comment.photo_id || latestByPhoto.has(comment.photo_id)) continue;
      latestByPhoto.set(comment.photo_id, comment);
    }

    if (latestByPhoto.size === 0) return new Map();

    const authorIds = [...new Set([...latestByPhoto.values()].map((comment) => comment.author_id))];
    const { data: authors, error: authorsError } = await supabase
      .from('family_members')
      .select('id, first_name, last_name, photo_url')
      .in('id', authorIds);

    if (authorsError) throw new AppError(500, authorsError.message, 'DB_ERROR');

    const authorMap = new Map((authors as CommentAuthor[] | null)?.map((author) => [author.id, author]));
    const result = new Map<string, PhotoLatestComment>();

    for (const [photoId, comment] of latestByPhoto) {
      const author = authorMap.get(comment.author_id);
      if (!author) continue;
      result.set(photoId, {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author,
      });
    }

    return result;
  },

  async getByPhoto(photoId: string, viewer?: FamilyMember): Promise<PhotoComment[]> {
    await getPhotoForComment(photoId, viewer?.id);

    const { data: comments, error } = await supabase
      .from('comments')
      .select('id, photo_id, content, created_at, author_id')
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });

    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    if (!comments?.length) return [];

    const authorIds = [...new Set(comments.map((comment) => comment.author_id))];
    const { data: authors, error: authorsError } = await supabase
      .from('family_members')
      .select('id, first_name, last_name, photo_url')
      .in('id', authorIds);

    if (authorsError) throw new AppError(500, authorsError.message, 'DB_ERROR');

    const authorMap = new Map((authors as CommentAuthor[] | null)?.map((author) => [author.id, author]));

    return comments.map((comment) => {
      const author = authorMap.get(comment.author_id);
      if (!author) throw new AppError(500, 'Auteur du commentaire introuvable', 'DB_ERROR');

      return withCommentMeta(
        {
          id: comment.id,
          photo_id: comment.photo_id!,
          content: comment.content,
          created_at: comment.created_at,
          author,
        },
        viewer,
      );
    });
  },

  async create(photoId: string, content: string, member: FamilyMember): Promise<PhotoComment> {
    const trimmed = content.trim();
    if (!trimmed) throw new AppError(400, 'Commentaire vide', 'VALIDATION_ERROR');

    await getPhotoForComment(photoId, member.id);

    const { data, error } = await supabase
      .from('comments')
      .insert({
        photo_id: photoId,
        author_id: member.id,
        content: trimmed,
      })
      .select('id, photo_id, content, created_at')
      .single();

    if (error) throw new AppError(400, error.message, 'DB_ERROR');

    return withCommentMeta(
      {
        ...data,
        photo_id: data.photo_id!,
        author: {
          id: member.id,
          first_name: member.first_name,
          last_name: member.last_name,
          photo_url: member.photo_url,
        },
      },
      member,
    );
  },

  async delete(commentId: string, member: FamilyMember): Promise<void> {
    const { data: comment, error } = await supabase
      .from('comments')
      .select('id, author_id, photo_id')
      .eq('id', commentId)
      .single();

    if (error || !comment) throw new AppError(404, 'Commentaire introuvable', 'NOT_FOUND');

    await getPhotoForComment(comment.photo_id!, member.id);

    if (!member.is_admin && comment.author_id !== member.id) {
      throw new AppError(403, 'Vous ne pouvez pas supprimer ce commentaire', 'FORBIDDEN');
    }

    const { error: deleteError } = await supabase.from('comments').delete().eq('id', commentId);
    if (deleteError) throw new AppError(500, deleteError.message, 'DB_ERROR');
  },
};
