import { Router } from 'express';
import { calendarController } from '../controllers/calendarController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get(
  '/:year/:month',
  asyncMiddleware(optionalAuth),
  asyncHandler(calendarController.getMonth),
);

export default router;
