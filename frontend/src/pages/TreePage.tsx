import { lazy, Suspense, useEffect, useState } from 'react';
import { useFamilyStore } from '../stores/familyStore';
import { FamilyTree } from '../components/tree/FamilyTree';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

const FamilyChartView = lazy(() =>
  import('../components/tree/FamilyChartView').then((m) => ({ default: m.FamilyChartView })),
);

const FamilyTreeJSView = lazy(() =>
  import('../components/tree/FamilyTreeJSView').then((m) => ({ default: m.FamilyTreeJSView })),
);

type TreeViewMode = 'custom' | 'family-chart' | 'familytreejs';

const VIEW_DESCRIPTIONS: Record<TreeViewMode, string> = {
  custom:
    'Choisis une branche pour une vue détaillée, ou affiche toutes les branches. Glisse et zoome pour naviguer.',
  'family-chart': 'Vue alternative avec family-chart : arbre classique pour comparer le rendu.',
  familytreejs:
    'Vue alternative avec FamilyTree JS 2 (BALKAN) : arbre classique pour comparer le rendu.',
};

export function TreePage() {
  const { tree, loading, error, fetchTree } = useFamilyStore();
  const [viewMode, setViewMode] = useState<TreeViewMode>('familytreejs');

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const rootMemberId = tree[0]?.member.id;

  return (
    <div className="space-y-6">
      <BackLink to="/" label="Accueil" />
      <div>
        <h1 className="page-title">
          Arbre généalogique
        </h1>
        <p className="mt-1 text-sm text-arbey-600">{VIEW_DESCRIPTIONS[viewMode]}</p>
      </div>

      {!loading && !error && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode('familytreejs')}
            className={viewMode === 'familytreejs' ? 'btn-primary' : 'btn-secondary'}
          >
            Vue FamilyTree JS
          </button>
          <button
            type="button"
            onClick={() => setViewMode('custom')}
            className={viewMode === 'custom' ? 'btn-primary' : 'btn-secondary'}
          >
            Vue Famille Arbey
          </button>
          <button
            type="button"
            onClick={() => setViewMode('family-chart')}
            className={viewMode === 'family-chart' ? 'btn-primary' : 'btn-secondary'}
          >
            Vue family-chart
          </button>
        </div>
      )}

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={fetchTree} />}
      {!loading && !error && viewMode === 'custom' && <FamilyTree tree={tree} />}
      {!loading && !error && viewMode === 'family-chart' && (
        <Suspense fallback={<LoadingSpinner />}>
          <FamilyChartView mainMemberId={rootMemberId} />
        </Suspense>
      )}
      {!loading && !error && viewMode === 'familytreejs' && (
        <Suspense fallback={<LoadingSpinner />}>
          <FamilyTreeJSView mainMemberId={rootMemberId} />
        </Suspense>
      )}
    </div>
  );
}
