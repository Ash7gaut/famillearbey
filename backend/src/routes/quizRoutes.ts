import { Router } from 'express';
import { quizController } from '../controllers/quizController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(asyncMiddleware(requireAuth));

router.get('/question', asyncHandler(quizController.getQuestion));
router.post('/answer', asyncHandler(quizController.checkAnswer));

export default router;
