export function LoadingSpinner({ 'data-testid': testId = 'loading-spinner' }: { 'data-testid'?: string }) {
  return (
    <div className="flex items-center justify-center py-16" data-testid={testId}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-400 border-t-warm-600" />
    </div>
  );
}
