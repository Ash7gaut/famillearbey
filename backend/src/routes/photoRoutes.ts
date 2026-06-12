import { Router } from 'express';
import multer from 'multer';
import { photoController } from '../controllers/photoController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
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

router.get('/album/:albumId', asyncHandler(photoController.getByAlbum));
router.post('/album/:albumId', upload.single('file'), asyncHandler(photoController.upload));
router.delete('/:id', asyncHandler(photoController.delete));

export default router;
