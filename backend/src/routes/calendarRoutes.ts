import { Router } from 'express';
import { calendarController } from '../controllers/calendarController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(asyncMiddleware(requireAuth));

router.get('/:year/:month', asyncHandler(calendarController.getMonth));

export default router;
