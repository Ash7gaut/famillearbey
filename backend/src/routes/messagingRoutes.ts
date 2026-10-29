import { Router } from 'express';
import { messagingController } from '../controllers/messagingController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

import { rateLimitPerMember } from '../middleware/rateLimit.js';

const router = Router();
const sendRateLimit = rateLimitPerMember(30, 60_000);

router.use(asyncMiddleware(requireAuth));

router.get('/', asyncHandler(messagingController.list));
router.post('/', requireAdmin, asyncHandler(messagingController.create));

router.get('/:id/messages', asyncHandler(messagingController.listMessages));
router.post('/:id/messages', sendRateLimit, asyncHandler(messagingController.sendMessage));

router.put('/:id/members/:memberId', asyncHandler(messagingController.addMember));
router.delete('/:id/members/:memberId', asyncHandler(messagingController.removeMember));

router.patch('/:id/muted', asyncHandler(messagingController.setMuted));
router.post('/:id/read', asyncHandler(messagingController.markRead));

export default router;
