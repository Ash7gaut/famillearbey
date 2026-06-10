import { Request, Response } from 'express';
import { quizService } from '../services/quizService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ApiResponse } from '../types/index.js';
import type { QuizAnswerResult, QuizQuestion } from '../types/quiz.js';

export const quizController = {
  async getQuestion(_req: Request, res: Response<ApiResponse<QuizQuestion>>) {
    const data = await quizService.generateQuestion();
    res.json({ data });
  },

  async checkAnswer(req: Request, res: Response<ApiResponse<QuizAnswerResult>>) {
    const { questionId, selectedOptionId } = req.body;

    if (!questionId || !selectedOptionId) {
      throw new AppError(400, 'questionId et selectedOptionId requis', 'MISSING_FIELDS');
    }

    const data = quizService.checkAnswer(questionId, selectedOptionId);
    res.json({ data });
  },
};
