import { Router } from 'express';
import { relationshipController } from '../controllers/relationshipController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(asyncMiddleware(requireAuth));

router.get('/', asyncHandler(relationshipController.getAll));
router.get('/tree', asyncHandler(relationshipController.getTree));

// Mutations accessibles à tout membre connecté
router.post('/', asyncHandler(relationshipController.create));
router.delete('/:id', asyncHandler(relationshipController.remove));

export default router;
