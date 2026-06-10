import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(asyncMiddleware(requireAuth), requireAdmin);

router.get('/members/unlinked', asyncHandler(adminController.listUnlinked));
router.post('/invite', asyncHandler(adminController.invite));
router.get('/requests', asyncHandler(adminController.listRequests));
router.post('/requests/:id/approve', asyncHandler(adminController.approveRequest));
router.post('/requests/:id/reject', asyncHandler(adminController.rejectRequest));

export default router;
