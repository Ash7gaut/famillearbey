import { Router } from 'express';
import { familyMemberController } from '../controllers/familyMemberController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(familyMemberController.getAll));
router.get('/:id', asyncHandler(familyMemberController.getById));
router.post('/', asyncHandler(familyMemberController.create));
router.patch('/:id', asyncHandler(familyMemberController.update));

export default router;
