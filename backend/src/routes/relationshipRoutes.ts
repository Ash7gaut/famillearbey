import { Router } from 'express';
import { relationshipController } from '../controllers/relationshipController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(relationshipController.getAll));
router.get('/tree', asyncHandler(relationshipController.getTree));
router.post('/', asyncHandler(relationshipController.create));

export default router;
