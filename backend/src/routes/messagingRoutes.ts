import { Router } from 'express';
import multer from 'multer';
import { messagingController } from '../controllers/messagingController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

import { rateLimitPerMember } from '../middleware/rateLimit.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images (JPEG, PNG, WebP, GIF) sont acceptées'));
    }
  },
});

const router = Router();
const sendRateLimit = rateLimitPerMember(30, 60_000);

router.use(asyncMiddleware(requireAuth));

router.get('/', asyncHandler(messagingController.list));
router.post('/', requireAdmin, asyncHandler(messagingController.create));

router.get('/:id/messages', asyncHandler(messagingController.listMessages));
router.post('/:id/messages', sendRateLimit, asyncHandler(messagingController.sendMessage));

router.put('/:id/members/:memberId', asyncHandler(messagingController.addMember));
// Pas de DELETE sur les membres : personne ne peut retirer un membre d'un groupe.

router.patch('/:id', asyncHandler(messagingController.updateSettings));
router.post('/:id/image', upload.single('file'), asyncHandler(messagingController.uploadImage));

router.patch('/:id/muted', asyncHandler(messagingController.setMuted));
router.post('/:id/read', asyncHandler(messagingController.markRead));

export default router;
