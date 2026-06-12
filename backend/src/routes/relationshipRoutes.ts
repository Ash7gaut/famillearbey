import { Router } from 'express';
import { relationshipController } from '../controllers/relationshipController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(asyncMiddleware(requireAuth));

router.get('/', asyncHandler(relationshipController.getAll));
router.get('/tree', asyncHandler(relationshipController.getTree));
router.post('/', asyncHandler(relationshipController.create));

export default router;
