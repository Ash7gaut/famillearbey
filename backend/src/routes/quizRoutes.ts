import { Router } from 'express';
import { quizController } from '../controllers/quizController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/question', asyncHandler(quizController.getQuestion));
router.post('/answer', asyncHandler(quizController.checkAnswer));

export default router;
