import { Router } from 'express';
import { tribuController } from '../controllers/tribuController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(asyncMiddleware(requireAuth));

router.get('/mine', asyncHandler(tribuController.getMine));
router.get('/:id', asyncHandler(tribuController.getById));
router.post('/', asyncHandler(tribuController.create));
router.patch('/:id', asyncHandler(tribuController.update));
router.delete('/:id', asyncHandler(tribuController.deleteTribu));
router.post('/:id/members', asyncHandler(tribuController.addMember));
router.delete('/:id/members/:memberId', asyncHandler(tribuController.removeMember));

export default router;
