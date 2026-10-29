import { Router } from 'express';
import { pushController } from '../controllers/pushController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(asyncMiddleware(requireAuth));

router.get('/public-key', asyncHandler(pushController.publicKey));
router.post('/subscribe', asyncHandler(pushController.subscribe));
router.post('/unsubscribe', asyncHandler(pushController.unsubscribe));

export default router;
