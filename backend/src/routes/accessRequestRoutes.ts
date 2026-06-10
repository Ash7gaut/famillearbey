import { Router } from 'express';
import { accessRequestController } from '../controllers/accessRequestController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.post('/', asyncHandler(accessRequestController.create));

export default router;
