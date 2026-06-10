import { create } from 'zustand';
import { api } from '../services/api';
import type { QuizAnswerResult, QuizQuestion } from '../types/quiz';

type QuizPhase = 'playing' | 'feedback' | 'finished';

interface QuizState {
  question: QuizQuestion | null;
  result: QuizAnswerResult | null;
  score: number;
  total: number;
  streak: number;
  phase: QuizPhase;
  loading: boolean;
  error: string | null;
  fetchQuestion: () => Promise<void>;
  submitAnswer: (optionId: string) => Promise<void>;
  nextQuestion: () => Promise<void>;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  question: null,
  result: null,
  score: 0,
  total: 0,
  streak: 0,
  phase: 'playing',
  loading: false,
  error: null,

  fetchQuestion: async () => {
    set({ loading: true, error: null, result: null, phase: 'playing' });
    try {
      const question = await api.get<QuizQuestion>('/quiz/question');
      set({ question, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  submitAnswer: async (optionId: string) => {
    const { question } = get();
    if (!question) return;

    set({ loading: true, error: null });
    try {
      const result = await api.post<QuizAnswerResult>('/quiz/answer', {
        questionId: question.id,
        selectedOptionId: optionId,
      });

      const { score, total, streak } = get();
      set({
        result,
        loading: false,
        phase: 'feedback',
        score: result.correct ? score + 1 : score,
        total: total + 1,
        streak: result.correct ? streak + 1 : 0,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  nextQuestion: async () => {
    await get().fetchQuestion();
  },

  reset: () => {
    set({
      question: null,
      result: null,
      score: 0,
      total: 0,
      streak: 0,
      phase: 'playing',
      error: null,
    });
  },
}));
