import { Router } from 'express';
import { relationshipController } from '../controllers/relationshipController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(asyncMiddleware(requireAuth));

router.get('/', asyncHandler(relationshipController.getAll));
router.get('/tree', asyncHandler(relationshipController.getTree));

// Mutations réservées aux admins
router.post('/', requireAdmin, asyncHandler(relationshipController.create));
router.delete('/:id', requireAdmin, asyncHandler(relationshipController.remove));

export default router;
