import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ApiResponse } from '../types/index.js';
import type { AccessRequest } from '../types/auth.js';

export const accessRequestController = {
  async create(req: Request, res: Response<ApiResponse<AccessRequest>>) {
    const { first_name, last_name, email, message } = req.body;

    if (!first_name || !email) {
      throw new AppError(400, 'Prénom et email requis', 'MISSING_FIELDS');
    }

    const data = await authService.createAccessRequest({
      first_name,
      last_name,
      email,
      message,
    });

    res.status(201).json({ data });
  },
};
