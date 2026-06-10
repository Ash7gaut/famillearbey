import { Request, Response } from 'express';
import { photoService } from '../services/photoService.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireParam } from '../utils/params.js';
import type { ApiResponse, Photo } from '../types/index.js';

export const photoController = {
  async getByAlbum(req: Request, res: Response<ApiResponse<Photo[]>>) {
    const data = await photoService.getByAlbum(requireParam(req.params.albumId, 'albumId'));
    res.json({ data });
  },

  async upload(req: Request, res: Response<ApiResponse<Photo>>) {
    if (!req.file) {
      throw new AppError(400, 'Fichier requis', 'MISSING_FILE');
    }

    const { caption, uploaded_by } = req.body;
    const data = await photoService.upload(
      requireParam(req.params.albumId, 'albumId'),
      req.file,
      caption,
      uploaded_by,
    );
    res.status(201).json({ data });
  },

  async delete(req: Request, res: Response) {
    await photoService.delete(requireParam(req.params.id, 'id'));
    res.status(204).send();
  },
};
