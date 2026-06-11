import { Router } from 'express';
import multer from 'multer';
import { familyMemberController } from '../controllers/familyMemberController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'));
    }
  },
});

const router = Router();

router.get('/', asyncHandler(familyMemberController.getAll));
router.patch('/me', requireAuth, asyncHandler(familyMemberController.updateMe));
router.post(
  '/me/photo',
  requireAuth,
  upload.single('file'),
  asyncHandler(familyMemberController.uploadMyPhoto),
);
router.get('/:id/profile', asyncHandler(familyMemberController.getProfile));
router.get('/:id', asyncHandler(familyMemberController.getById));
router.post('/', asyncHandler(familyMemberController.create));
router.patch('/:id', asyncHandler(familyMemberController.update));

export default router;
