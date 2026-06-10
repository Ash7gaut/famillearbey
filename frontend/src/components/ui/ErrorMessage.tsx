interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="card text-center py-8">
      <p className="text-3xl mb-2">😕</p>
      <p className="text-arbey-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          Réessayer
        </button>
      )}
    </div>
  );
}
