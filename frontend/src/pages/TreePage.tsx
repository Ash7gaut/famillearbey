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
    'Vue détaillée de l\'arbre — filtre par personne si besoin. Glisse et zoome pour naviguer.',
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
    <div className="space-y-6" data-testid="tree-page">
      <BackLink to="/accueil" label="Accueil" data-testid="tree-back-link" />
      <div>
        <h1 className="page-title" data-testid="tree-title">
          Arbre généalogique
        </h1>
        <p className="mt-1 text-sm text-arbey-600" data-testid="tree-view-description">{VIEW_DESCRIPTIONS[viewMode]}</p>
      </div>

      {!loading && !error && (
        <div className="flex flex-wrap gap-2" data-testid="tree-view-switcher">
          <button
            type="button"
            data-testid="tree-view-familytreejs-button"
            onClick={() => setViewMode('familytreejs')}
            className={viewMode === 'familytreejs' ? 'btn-primary' : 'btn-secondary'}
          >
            Vue FamilyTree JS
          </button>
          <button
            type="button"
            data-testid="tree-view-custom-button"
            onClick={() => setViewMode('custom')}
            className={viewMode === 'custom' ? 'btn-primary' : 'btn-secondary'}
          >
            Vue détaillée
          </button>
          <button
            type="button"
            data-testid="tree-view-family-chart-button"
            onClick={() => setViewMode('family-chart')}
            className={viewMode === 'family-chart' ? 'btn-primary' : 'btn-secondary'}
          >
            Vue family-chart
          </button>
        </div>
      )}

      {loading && <LoadingSpinner data-testid="tree-loading-spinner" />}
      {error && <ErrorMessage message={error} onRetry={fetchTree} />}
      {!loading && !error && viewMode === 'custom' && <FamilyTree tree={tree} />}
      {!loading && !error && viewMode === 'family-chart' && (
        <Suspense fallback={<LoadingSpinner data-testid="tree-view-loading-spinner" />}>
          <FamilyChartView mainMemberId={rootMemberId} />
        </Suspense>
      )}
      {!loading && !error && viewMode === 'familytreejs' && (
        <Suspense fallback={<LoadingSpinner data-testid="tree-view-loading-spinner" />}>
          <FamilyTreeJSView mainMemberId={rootMemberId} />
        </Suspense>
      )}
    </div>
  );
}
