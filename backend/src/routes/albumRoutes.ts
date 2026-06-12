import { Router } from 'express';
import { albumController } from '../controllers/albumController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', asyncMiddleware(optionalAuth), asyncHandler(albumController.getAll));
router.get('/:id', asyncMiddleware(optionalAuth), asyncHandler(albumController.getById));
router.post('/', asyncMiddleware(requireAuth), asyncHandler(albumController.create));
router.patch('/:id', asyncMiddleware(requireAuth), asyncHandler(albumController.update));
router.delete('/:id', asyncMiddleware(requireAuth), asyncHandler(albumController.delete));

export default router;
