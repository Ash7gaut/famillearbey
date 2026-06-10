import { Router } from 'express';
import multer from 'multer';
import { photoController } from '../controllers/photoController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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

router.get('/album/:albumId', asyncHandler(photoController.getByAlbum));
router.post('/album/:albumId', upload.single('file'), asyncHandler(photoController.upload));
router.delete('/:id', asyncHandler(photoController.delete));

export default router;
