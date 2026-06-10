import { useEffect } from 'react';
import { useFamilyStore } from '../stores/familyStore';
import { FamilyTree } from '../components/tree/FamilyTree';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export function TreePage() {
  const { tree, loading, error, fetchTree } = useFamilyStore();

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-arbey-900">
          Arbre généalogique
        </h1>
        <p className="mt-1 text-sm text-arbey-600">
          La Famille Arbey, de génération en génération.
        </p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={fetchTree} />}
      {!loading && !error && <FamilyTree tree={tree} />}
    </div>
  );
}
