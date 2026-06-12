import { Router } from 'express';
import { commentController } from '../controllers/commentController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(asyncMiddleware(requireAuth));

router.get('/photo/:photoId', asyncHandler(commentController.getByPhoto));
router.post('/photo/:photoId', asyncHandler(commentController.create));
router.delete('/:id', asyncHandler(commentController.delete));

export default router;
