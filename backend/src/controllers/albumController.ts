import { Response } from 'express';
import { albumService } from '../services/albumService.js';
import { withAlbumMeta } from '../services/albumAccessService.js';
import { requireParam } from '../utils/params.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { Album, ApiResponse } from '../types/index.js';

type AlbumResponse = Album & { can_manage: boolean };

export const albumController = {
  async getAll(req: AuthRequest, res: Response<ApiResponse<AlbumResponse[]>>) {
    const albums = await albumService.getAll(req.member?.id);
    res.json({
      data: albums.map((album) => withAlbumMeta(album, req.member)),
    });
  },

  async getById(req: AuthRequest, res: Response<ApiResponse<AlbumResponse>>) {
    const album = await albumService.getById(requireParam(req.params.id, 'id'), req.member?.id);
    res.json({ data: withAlbumMeta(album, req.member) });
  },

  async create(req: AuthRequest, res: Response<ApiResponse<AlbumResponse>>) {
    const { title, description, event_date, visibility } = req.body;
    const album = await albumService.create({
      title,
      description,
      event_date,
      visibility,
      created_by: req.member!.id,
    });
    res.status(201).json({ data: withAlbumMeta(album, req.member) });
  },

  async update(req: AuthRequest, res: Response<ApiResponse<AlbumResponse>>) {
    const album = await albumService.update(requireParam(req.params.id, 'id'), req.body);
    res.json({ data: withAlbumMeta(album, req.member) });
  },

  async delete(req: AuthRequest, res: Response) {
    await albumService.delete(requireParam(req.params.id, 'id'), req.member!);
    res.status(204).send();
  },
};
