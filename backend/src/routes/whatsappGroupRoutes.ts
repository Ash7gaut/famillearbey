import { Router } from 'express';
import multer from 'multer';
import { whatsappGroupController } from '../controllers/whatsappGroupController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
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
const reportRateLimit = rateLimitPerMember(20, 60_000);

router.use(asyncMiddleware(requireAuth));

router.get('/', asyncHandler(whatsappGroupController.list));
router.post('/', asyncHandler(whatsappGroupController.create));

router.patch('/:id', asyncHandler(whatsappGroupController.update));
router.delete('/:id', asyncHandler(whatsappGroupController.remove));
router.post('/:id/image', upload.single('file'), asyncHandler(whatsappGroupController.uploadImage));

// Acces : tout membre ayant acces (et les admins) peut ajouter ET retirer ; le createur garde toujours acces.
router.post('/:id/access', asyncHandler(whatsappGroupController.addAccess));
router.delete('/:id/access/:memberId', asyncHandler(whatsappGroupController.removeAccess));

router.put('/:id/joined', asyncHandler(whatsappGroupController.setJoined));
router.post('/:id/report-link', reportRateLimit, asyncHandler(whatsappGroupController.reportLink));

export default router;
