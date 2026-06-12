import { Router } from 'express';
import { albumController } from '../controllers/albumController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(asyncMiddleware(requireAuth));

router.get('/', asyncHandler(albumController.getAll));
router.get('/:id', asyncHandler(albumController.getById));
router.post('/', asyncHandler(albumController.create));
router.patch('/:id', asyncHandler(albumController.update));
router.delete('/:id', asyncHandler(albumController.delete));

export default router;
