import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useFamilyStore } from '../stores/familyStore';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { MemberAvatar } from '../components/profile/MemberAvatar';
import { memberFullName, sortMembersByName } from '../components/profile/memberUtils';
import { MemberModal } from '../components/tree/MemberModal';
import { ALL_ROOTS, buildTreeUnits, defaultRootId } from '../components/tree/treeModel';
import { layoutTree } from '../components/tree/treeLayout';
import type { TreeFocusRequest } from '../components/tree/TreeCanvas';
import type { FamilyMember } from '../types';

const TreeCanvas = lazy(() =>
  import('../components/tree/TreeCanvas').then((m) => ({ default: m.TreeCanvas })),
);

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function TreePage() {
  const { members, relationships, loading, error, fetchTreeData } = useFamilyStore();
  const [rootChoice, setRootChoice] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState<TreeFocusRequest | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  const sortedMembers = useMemo(() => sortMembersByName(members), [members]);
  const rootId = rootChoice ?? defaultRootId(members);

  const layout = useMemo(
    () => layoutTree(buildTreeUnits(members, relationships, rootId)),
    [members, relationships, rootId],
  );

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return sortedMembers.filter((m) => normalize(memberFullName(m)).includes(q)).slice(0, 6);
  }, [query, sortedMembers]);

  function pickMember(member: FamilyMember) {
    setQuery('');
    // Hors de la racine choisie : on bascule sur toute la famille avant de recentrer.
    if (!layout.nodeById.has(member.id)) setRootChoice(ALL_ROOTS);
    setHighlightedId(member.id);
    setFocus({ id: member.id, nonce: Date.now() });
  }

  const showTree = !loading && !error;

  return (
    <div className="space-y-6" data-testid="tree-page">
      <BackLink to="/messagerie" label="Messages" data-testid="tree-back-link" />
      <div>
        <h1 className="page-title" data-testid="tree-title">
          Arbre généalogique
        </h1>
        <p className="page-subtitle" data-testid="tree-subtitle">
          Glisse, zoome (molette ou pincement) et touche une carte pour ouvrir la fiche.
        </p>
      </div>

      {showTree && members.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end" data-testid="tree-toolbar">
          <label className="block sm:w-64">
            <span className="mb-1 block text-xs font-medium text-ink-500">Racine</span>
            <select
              data-testid="tree-root-select"
              value={rootId}
              onChange={(e) => {
                setRootChoice(e.target.value);
                setHighlightedId(null);
              }}
              className="input-field"
            >
              <option value={ALL_ROOTS}>Toute la famille</option>
              {sortedMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {memberFullName(m)}
                </option>
              ))}
            </select>
          </label>

          <div className="relative sm:w-72">
            <span className="mb-1 block text-xs font-medium text-ink-500">Rechercher un membre</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                data-testid="tree-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results[0]) pickMember(results[0]);
                }}
                placeholder="Prénom ou nom"
                className="input-field pl-9"
              />
            </div>
            {query.trim() && (
              <ul
                data-testid="tree-search-results"
                className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-warm-md"
              >
                {results.length === 0 && (
                  <li className="px-3 py-2 text-sm text-ink-500" data-testid="tree-search-empty">
                    Aucun membre trouvé
                  </li>
                )}
                {results.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      data-testid={`tree-search-result-${m.id}`}
                      onClick={() => pickMember(m)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-800 transition hover:bg-warm-50"
                    >
                      <MemberAvatar member={m} size="md" />
                      {memberFullName(m)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {loading && <LoadingSpinner data-testid="tree-loading-spinner" />}
      {error && (
        <div data-testid="tree-error">
          <ErrorMessage message={error} onRetry={fetchTreeData} />
        </div>
      )}
      {showTree && members.length === 0 && (
        <div className="card py-10 text-center text-ink-600" data-testid="tree-empty">
          Aucun membre à afficher pour l'instant.
        </div>
      )}
      {showTree && members.length > 0 && (
        <Suspense fallback={<LoadingSpinner data-testid="tree-canvas-loading-spinner" />}>
          <TreeCanvas
            layout={layout}
            focus={focus}
            rootId={rootId}
            highlightedId={highlightedId}
            onSelectMember={setSelectedMember}
          />
        </Suspense>
      )}

      {selectedMember && (
        <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  );
}
