import { Response } from 'express';
import { commentService } from '../services/commentService.js';
import { requireParam } from '../utils/params.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ApiResponse } from '../types/index.js';
import type { PhotoComment } from '../types/comment.js';

export const commentController = {
  async getByPhoto(req: AuthRequest, res: Response<ApiResponse<PhotoComment[]>>) {
    const data = await commentService.getByPhoto(
      requireParam(req.params.photoId, 'photoId'),
      req.member,
    );
    res.json({ data });
  },

  async create(req: AuthRequest, res: Response<ApiResponse<PhotoComment>>) {
    const { content } = req.body;
    const data = await commentService.create(
      requireParam(req.params.photoId, 'photoId'),
      content,
      req.member!,
    );
    res.status(201).json({ data });
  },

  async delete(req: AuthRequest, res: Response) {
    await commentService.delete(requireParam(req.params.id, 'id'), req.member!);
    res.status(204).send();
  },
};
