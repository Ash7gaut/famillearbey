import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.post('/sync', asyncHandler(authController.sync));
router.get('/me', asyncHandler(authController.me));

export default router;
