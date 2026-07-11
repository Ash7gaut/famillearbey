import { Request, Response } from 'express';
import { relationshipService } from '../services/relationshipService.js';
import { requireParam } from '../utils/params.js';
import type { ApiResponse, Relationship, TreeNode } from '../types/index.js';

export const relationshipController = {
  async getAll(_req: Request, res: Response<ApiResponse<Relationship[]>>) {
    const data = await relationshipService.getAll();
    res.json({ data });
  },

  async create(req: Request, res: Response<ApiResponse<Relationship>>) {
    const data = await relationshipService.create(req.body);
    res.status(201).json({ data });
  },

  async remove(req: Request, res: Response) {
    await relationshipService.delete(requireParam(req.params.id, 'id'));
    res.status(204).send();
  },

  async getTree(req: Request, res: Response<ApiResponse<TreeNode[]>>) {
    const rootId = req.query.rootId as string | undefined;
    const data = await relationshipService.buildTree(rootId);
    res.json({ data });
  },
};
