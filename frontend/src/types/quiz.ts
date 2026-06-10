export type QuizQuestionType = 'birth_date' | 'birth_year' | 'parent' | 'spouse';

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options: QuizOption[];
  hint?: string;
}

export interface QuizAnswerResult {
  correct: boolean;
  correctOptionId: string;
  correctLabel: string;
  explanation?: string;
}
