import { Response } from 'express';
import { photoService } from '../services/photoService.js';
import { albumService } from '../services/albumService.js';
import { commentService } from '../services/commentService.js';
import { withPhotoMeta } from '../services/albumAccessService.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireParam } from '../utils/params.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { PhotoLatestComment } from '../types/comment.js';
import type { ApiResponse, Photo } from '../types/index.js';

type PhotoResponse = Photo & {
  can_delete: boolean;
  latest_comment: PhotoLatestComment | null;
};

export const photoController = {
  async getByAlbum(req: AuthRequest, res: Response<ApiResponse<PhotoResponse[]>>) {
    const albumId = requireParam(req.params.albumId, 'albumId');
    const album = await albumService.getById(albumId, req.member?.id);
    const photos = await photoService.getByAlbum(albumId, req.member?.id);
    const latestComments = await commentService.getLatestByPhotoIds(photos.map((photo) => photo.id));
    res.json({
      data: photos.map((photo) => ({
        ...withPhotoMeta(photo, album, req.member),
        latest_comment: latestComments.get(photo.id) ?? null,
      })),
    });
  },

  async upload(req: AuthRequest, res: Response<ApiResponse<PhotoResponse>>) {
    if (!req.file) {
      throw new AppError(400, 'Fichier requis', 'MISSING_FILE');
    }

    const albumId = requireParam(req.params.albumId, 'albumId');
    const { caption } = req.body;
    const photo = await photoService.upload(albumId, req.file, req.member!, caption);
    const album = await albumService.getById(albumId, req.member!.id);
    res.status(201).json({ data: withPhotoMeta(photo, album, req.member) });
  },

  async delete(req: AuthRequest, res: Response) {
    await photoService.delete(requireParam(req.params.id, 'id'), req.member!);
    res.status(204).send();
  },
};
