import { Response } from 'express';
import { calendarService } from '../services/calendarService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ApiResponse } from '../types/index.js';
import type { CalendarMonth } from '../types/calendar.js';

export const calendarController = {
  async getMonth(req: AuthRequest, res: Response<ApiResponse<CalendarMonth>>) {
    const year = Number(req.params.year);
    const month = Number(req.params.month);

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      throw new AppError(400, 'Année ou mois invalide', 'VALIDATION_ERROR');
    }

    const data = await calendarService.getMonth(year, month, req.member);
    res.json({ data });
  },
};
