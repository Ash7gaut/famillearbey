import { Router } from 'express';
import multer from 'multer';
import { familyMemberController } from '../controllers/familyMemberController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

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

router.use(asyncMiddleware(requireAuth));

router.get('/', asyncHandler(familyMemberController.getAll));
router.get('/directory', asyncHandler(familyMemberController.getDirectory));
router.patch('/me', asyncHandler(familyMemberController.updateMe));
router.post(
  '/me/photo',
  upload.single('file'),
  asyncHandler(familyMemberController.uploadMyPhoto),
);
router.get('/:id/profile', asyncHandler(familyMemberController.getProfile));
router.get('/:id', asyncHandler(familyMemberController.getById));

// Mutations réservées aux admins
router.post('/', requireAdmin, asyncHandler(familyMemberController.create));
router.patch('/:id', requireAdmin, asyncHandler(familyMemberController.update));
router.delete('/:id', requireAdmin, asyncHandler(familyMemberController.remove));

export default router;
