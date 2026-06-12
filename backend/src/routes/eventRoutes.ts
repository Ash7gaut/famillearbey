import { Router } from 'express';
import { eventController } from '../controllers/eventController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', asyncMiddleware(requireAuth), asyncHandler(eventController.create));
router.delete('/:id', asyncMiddleware(requireAuth), asyncHandler(eventController.delete));

export default router;
