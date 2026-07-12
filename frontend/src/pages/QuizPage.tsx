import { useEffect } from 'react';
import { useQuizStore } from '../stores/quizStore';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

const typeLabels: Record<string, string> = {
  birth_date: 'Date de naissance',
  birth_year: 'Année de naissance',
  parent: 'Liens familiaux',
  spouse: 'Conjoints',
};

export function QuizPage() {
  const {
    question,
    result,
    score,
    total,
    streak,
    phase,
    loading,
    error,
    fetchQuestion,
    submitAnswer,
    nextQuestion,
    reset,
  } = useQuizStore();

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackLink to="/accueil" label="Accueil" />
      <div className="text-center">
        <p className="text-4xl mb-2">🧠</p>
        <h1 className="page-title">Quiz familial</h1>
        <p className="mt-1 text-sm text-arbey-600">
          Teste tes connaissances sur la famille !
        </p>
      </div>

      {/* Score bar */}
      <div className="flex items-center justify-between rounded-2xl border border-arbey-100 bg-cream-50 px-5 py-3 shadow-sm">
        <div className="text-center">
          <p className="text-xs text-arbey-500">Score</p>
          <p className="font-display text-lg font-semibold text-arbey-900">
            {score}/{total}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-arbey-500">Précision</p>
          <p className="font-display text-lg font-semibold text-arbey-900">{accuracy}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-arbey-500">Série</p>
          <p className="font-display text-lg font-semibold text-warm-600">
            {streak > 0 ? `🔥 ${streak}` : '—'}
          </p>
        </div>
      </div>

      {loading && !question && <LoadingSpinner />}
      {error && !question && <ErrorMessage message={error} onRetry={fetchQuestion} />}

      {question && phase === 'playing' && !loading && (
        <div className="card space-y-5">
          <span className="inline-block rounded-full bg-arbey-50 px-3 py-1 text-xs font-medium text-arbey-600">
            {typeLabels[question.type] ?? question.type}
          </span>
          <h2 className="font-display text-xl font-semibold text-arbey-900 leading-snug">
            {question.prompt}
          </h2>
          <div className="grid gap-2">
            {question.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => submitAnswer(option.id)}
                disabled={loading}
                className="rounded-xl border border-arbey-100 bg-arbey-50/50 px-4 py-3.5 text-left text-sm font-medium text-arbey-800 transition hover:border-arbey-300 hover:bg-arbey-50 active:scale-[0.98] disabled:opacity-50"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && result && (
        <div
          className={`card space-y-4 ${
            result.correct
              ? 'border-green-200 bg-green-50/30'
              : 'border-red-200 bg-red-50/30'
          }`}
        >
          <div className="text-center">
            <p className="text-4xl mb-2">{result.correct ? '✅' : '❌'}</p>
            <p className="font-display text-lg font-semibold text-arbey-900">
              {result.correct ? 'Bravo !' : 'Pas tout à fait…'}
            </p>
            {!result.correct && (
              <p className="mt-1 text-sm text-arbey-600">
                La bonne réponse : <strong>{result.correctLabel}</strong>
              </p>
            )}
            {result.explanation && (
              <p className="mt-2 text-sm text-arbey-500">{result.explanation}</p>
            )}
          </div>
          <button type="button" onClick={nextQuestion} className="btn-primary w-full">
            Question suivante →
          </button>
        </div>
      )}

      {loading && question && phase === 'playing' && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-arbey-200 border-t-arbey-600" />
        </div>
      )}

      {total > 0 && (
        <button type="button" onClick={() => { reset(); fetchQuestion(); }} className="btn-secondary w-full">
          Recommencer
        </button>
      )}
    </div>
  );
}
