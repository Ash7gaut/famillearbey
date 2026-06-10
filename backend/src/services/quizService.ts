import { randomUUID } from 'crypto';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember, Relationship } from '../types/index.js';
import type { QuizAnswerResult, QuizQuestion, QuizQuestionType } from '../types/quiz.js';
import { familyMemberService } from './familyMemberService.js';
import { relationshipService } from './relationshipService.js';

const QUESTION_TTL_MS = 10 * 60 * 1000;
const OPTION_COUNT = 4;

interface StoredQuestion {
  correctOptionId: string;
  correctLabel: string;
  explanation?: string;
  expiresAt: number;
}

const questionStore = new Map<string, StoredQuestion>();

function memberLabel(m: FamilyMember): string {
  return `${m.first_name} ${m.last_name}`;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatBirthDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatBirthYear(date: string): string {
  return String(new Date(date).getFullYear());
}

function buildOptions(correct: FamilyMember, pool: FamilyMember[]): QuizQuestion['options'] {
  const distractors = shuffle(
    pool.filter((m) => m.id !== correct.id),
  ).slice(0, OPTION_COUNT - 1);

  return shuffle([
    { id: correct.id, label: memberLabel(correct) },
    ...distractors.map((m) => ({ id: m.id, label: memberLabel(m) })),
  ]);
}

function buildYearOptions(correctYear: number, pool: FamilyMember[]): QuizQuestion['options'] {
  const years = new Set<number>([correctYear]);
  const birthYears = pool
    .filter((m) => m.birth_date)
    .map((m) => new Date(m.birth_date!).getFullYear());

  for (const y of shuffle(birthYears)) {
    if (years.size >= OPTION_COUNT) break;
    years.add(y);
  }

  while (years.size < OPTION_COUNT) {
    years.add(correctYear + Math.floor(Math.random() * 20) - 10);
  }

  return shuffle([...years]).slice(0, OPTION_COUNT).map((y) => ({
    id: String(y),
    label: String(y),
  }));
}

function getParents(
  memberId: string,
  relationships: Relationship[],
  memberMap: Map<string, FamilyMember>,
): FamilyMember[] {
  return relationships
    .filter((r) => r.relationship_type === 'parent' && r.related_member_id === memberId)
    .map((r) => memberMap.get(r.member_id))
    .filter((m): m is FamilyMember => m !== undefined);
}

function getSpouses(
  memberId: string,
  relationships: Relationship[],
  memberMap: Map<string, FamilyMember>,
): FamilyMember[] {
  const seen = new Set<string>();
  return relationships
    .filter(
      (r) =>
        r.relationship_type === 'spouse' &&
        (r.member_id === memberId || r.related_member_id === memberId),
    )
    .map((r) => {
      const spouseId = r.member_id === memberId ? r.related_member_id : r.member_id;
      return memberMap.get(spouseId);
    })
    .filter((m): m is FamilyMember => {
      if (!m || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
}

function storeQuestion(
  correctOptionId: string,
  correctLabel: string,
  explanation?: string,
): string {
  const id = randomUUID();
  questionStore.set(id, {
    correctOptionId,
    correctLabel,
    explanation,
    expiresAt: Date.now() + QUESTION_TTL_MS,
  });
  return id;
}

function purgeExpired() {
  const now = Date.now();
  for (const [id, q] of questionStore) {
    if (q.expiresAt < now) questionStore.delete(id);
  }
}

type QuestionBuilder = () => QuizQuestion | null;

export const quizService = {
  async generateQuestion(): Promise<QuizQuestion> {
    purgeExpired();

    const [members, relationships] = await Promise.all([
      familyMemberService.getAll(),
      relationshipService.getAll(),
    ]);

    if (members.length < OPTION_COUNT) {
      throw new AppError(
        400,
        `Il faut au moins ${OPTION_COUNT} membres pour jouer au quiz`,
        'INSUFFICIENT_DATA',
      );
    }

    const memberMap = new Map(members.map((m) => [m.id, m]));
    const withBirthDate = members.filter((m) => m.birth_date);

    const builders: QuestionBuilder[] = [];

    // Qui est né(e) le [date] ?
    for (const member of withBirthDate) {
      builders.push(() => {
        const options = buildOptions(member, members);
        const correctLabel = memberLabel(member);
        return {
          id: storeQuestion(
            member.id,
            correctLabel,
            `${member.first_name} est bien né(e) le ${formatBirthDate(member.birth_date!)}.`,
          ),
          type: 'birth_date' as QuizQuestionType,
          prompt: `Qui est né(e) le ${formatBirthDate(member.birth_date!)} ?`,
          options,
        };
      });
    }

    // En quelle année est né(e) [prénom] ?
    for (const member of withBirthDate) {
      builders.push(() => {
        const year = new Date(member.birth_date!).getFullYear();
        const options = buildYearOptions(year, members);
        const correctLabel = String(year);
        return {
          id: storeQuestion(
            correctLabel,
            correctLabel,
            `${member.first_name} ${member.last_name} est né(e) en ${year}.`,
          ),
          type: 'birth_year' as QuizQuestionType,
          prompt: `En quelle année est né(e) ${member.first_name} ${member.last_name} ?`,
          options,
        };
      });
    }

    // Qui est le parent de [prénom] ?
    for (const member of members) {
      const parents = getParents(member.id, relationships, memberMap);
      for (const parent of parents) {
        builders.push(() => {
          const options = buildOptions(parent, members);
          const correctLabel = memberLabel(parent);
          return {
            id: storeQuestion(
              parent.id,
              correctLabel,
              `${correctLabel} est parent de ${member.first_name}.`,
            ),
            type: 'parent' as QuizQuestionType,
            prompt: `Qui est parent de ${member.first_name} ${member.last_name} ?`,
            options,
          };
        });
      }
    }

    // Qui est le/la conjoint(e) de [prénom] ?
    for (const member of members) {
      const spouses = getSpouses(member.id, relationships, memberMap);
      for (const spouse of spouses) {
        builders.push(() => {
          const options = buildOptions(spouse, members);
          const correctLabel = memberLabel(spouse);
          return {
            id: storeQuestion(
              spouse.id,
              correctLabel,
              `${member.first_name} et ${spouse.first_name} sont conjoints.`,
            ),
            type: 'spouse' as QuizQuestionType,
            prompt: `Qui est le/la conjoint(e) de ${member.first_name} ${member.last_name} ?`,
            options,
          };
        });
      }
    }

    if (builders.length === 0) {
      throw new AppError(
        400,
        'Pas assez de données familiales pour générer une question (dates de naissance, relations…)',
        'INSUFFICIENT_DATA',
      );
    }

    const question = pickRandom(builders)();
    if (!question) {
      throw new AppError(500, 'Impossible de générer une question', 'QUIZ_ERROR');
    }

    return question;
  },

  checkAnswer(questionId: string, selectedOptionId: string): QuizAnswerResult {
    purgeExpired();

    const stored = questionStore.get(questionId);
    if (!stored) {
      throw new AppError(404, 'Question expirée ou introuvable', 'QUESTION_NOT_FOUND');
    }

    questionStore.delete(questionId);

    const correct = stored.correctOptionId === selectedOptionId;

    return {
      correct,
      correctOptionId: stored.correctOptionId,
      correctLabel: stored.correctLabel,
      explanation: stored.explanation,
    };
  },
};
