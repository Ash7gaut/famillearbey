import { Router } from 'express';
import { commentController } from '../controllers/commentController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get(
  '/photo/:photoId',
  asyncMiddleware(optionalAuth),
  asyncHandler(commentController.getByPhoto),
);
router.post(
  '/photo/:photoId',
  asyncMiddleware(requireAuth),
  asyncHandler(commentController.create),
);
router.delete('/:id', asyncMiddleware(requireAuth), asyncHandler(commentController.delete));

export default router;
