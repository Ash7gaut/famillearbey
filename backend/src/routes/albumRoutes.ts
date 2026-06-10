import { Router } from 'express';
import { albumController } from '../controllers/albumController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(albumController.getAll));
router.get('/:id', asyncHandler(albumController.getById));
router.post('/', asyncHandler(albumController.create));
router.patch('/:id', asyncHandler(albumController.update));
router.delete('/:id', asyncHandler(albumController.delete));

export default router;
