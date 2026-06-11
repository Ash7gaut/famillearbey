import { useEffect, useId, useRef, useState } from 'react';
import FamilyTree from '@balkangraph/familytree.js';
import { api } from '../../services/api';
import type { FamilyMember, Relationship } from '../../types';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { buildFamilyTreeJSNodes } from './familyTreeJSUtils';
import { MemberModal } from './MemberModal';

interface FamilyTreeJSViewProps {
  mainMemberId?: string;
}

export function FamilyTreeJSView({ mainMemberId }: FamilyTreeJSViewProps) {
  const chartId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<FamilyTree | null>(null);
  const membersRef = useRef<Map<string, FamilyMember>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function loadChart() {
      setLoading(true);
      setError(null);

      try {
        const [members, relationships] = await Promise.all([
          api.get<FamilyMember[]>('/members'),
          api.get<Relationship[]>('/relationships'),
        ]);

        if (cancelled || !containerRef.current) return;

        membersRef.current = new Map(members.map((member) => [member.id, member]));

        const nodes = buildFamilyTreeJSNodes(members, relationships);
        if (nodes.length === 0) {
          setError('Aucun membre à afficher.');
          setLoading(false);
          return;
        }

        const hasMainMember =
          Boolean(mainMemberId) && nodes.some((node) => node.id === mainMemberId);

        const chart = new FamilyTree(containerRef.current, {
          mode: 'light',
          template: 'tommy',
          orientation: FamilyTree.orientation.top,
          nodeMouseClick: FamilyTree.action.none,
          nodeMouseDbClick: FamilyTree.action.none,
          enableSearch: false,
          nodeMenu: {},
          nodeCircleMenu: {},
          nodeContextMenu: {},
          toolbar: { zoom: true, fit: true },
          mouseScrool: FamilyTree.action.zoom,
          nodeBinding: {
            field_0: 'name',
            field_1: 'birthYear',
            img_0: 'img',
          },
          ...(hasMainMember ? { roots: [mainMemberId!] } : {}),
          nodes,
        });

        chartRef.current = chart;

        chart.on('click', (_sender, args: { node?: { id?: string } }) => {
          const memberId = args?.node?.id;
          if (!memberId) return;
          const member = membersRef.current.get(String(memberId));
          if (member) setSelectedMember(member);
        });

        chart.on('ready', () => {
          if (cancelled || !chartRef.current) return;
          requestAnimationFrame(() => {
            if (cancelled || !chartRef.current) return;
            chartRef.current.fit();
          });
        });

        if (containerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            if (cancelled || !chartRef.current) return;
            chartRef.current.fit();
          });
          resizeObserver.observe(containerRef.current);
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    }

    loadChart();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [mainMemberId]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-arbey-600">
        Aperçu avec{' '}
        <a
          href="https://balkan.app/FamilyTreeJS"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-arbey-700 underline decoration-arbey-300 underline-offset-2 hover:text-arbey-900"
        >
          FamilyTree JS 2
        </a>{' '}
        (BALKAN). Arbre classique, pan/zoom intégré. Le genre est déduit automatiquement pour le
        layout — licence commerciale si usage en production.
      </p>

      <div className="card relative overflow-hidden p-0">
        <div
          id={chartId}
          ref={containerRef}
          className="family-treejs-preview"
          style={{
            backgroundColor: 'rgb(248, 250, 249)',
          }}
        />
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
            <LoadingSpinner />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white p-6">
            <ErrorMessage message={error} onRetry={() => window.location.reload()} />
          </div>
        )}
      </div>

      {selectedMember && (
        <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  );
}
