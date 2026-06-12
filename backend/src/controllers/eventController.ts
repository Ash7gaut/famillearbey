import { Response } from 'express';
import { eventService } from '../services/eventService.js';
import { requireParam } from '../utils/params.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ApiResponse } from '../types/index.js';

export const eventController = {
  async create(req: AuthRequest, res: Response<ApiResponse<{ id: string }>>) {
    const event = await eventService.create(req.body, req.member!);
    res.status(201).json({ data: { id: event.id } });
  },

  async delete(req: AuthRequest, res: Response) {
    await eventService.delete(requireParam(req.params.id, 'id'), req.member!);
    res.status(204).send();
  },
};
