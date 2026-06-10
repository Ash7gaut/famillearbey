import { Request, Response } from 'express';
import { albumService } from '../services/albumService.js';
import { requireParam } from '../utils/params.js';
import type { Album, ApiResponse } from '../types/index.js';

export const albumController = {
  async getAll(_req: Request, res: Response<ApiResponse<Album[]>>) {
    const data = await albumService.getAll();
    res.json({ data });
  },

  async getById(req: Request, res: Response<ApiResponse<Album>>) {
    const data = await albumService.getById(requireParam(req.params.id, 'id'));
    res.json({ data });
  },

  async create(req: Request, res: Response<ApiResponse<Album>>) {
    const data = await albumService.create(req.body);
    res.status(201).json({ data });
  },

  async update(req: Request, res: Response<ApiResponse<Album>>) {
    const data = await albumService.update(requireParam(req.params.id, 'id'), req.body);
    res.json({ data });
  },

  async delete(req: Request, res: Response) {
    await albumService.delete(requireParam(req.params.id, 'id'));
    res.status(204).send();
  },
};
