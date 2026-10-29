import { useEffect, useId, useRef, useState } from 'react';
import { createChart } from 'family-chart';
import type { Chart, TreeDatum } from 'family-chart';
import 'family-chart/styles/family-chart.css';
import { api } from '../../services/api';
import type { FamilyMember, Relationship } from '../../types';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { buildFamilyChartData } from './familyChartUtils';
import { MemberModal } from './MemberModal';

interface FamilyChartViewProps {
  mainMemberId?: string;
}

function fitChartToContainer(chart: Chart) {
  chart.updateTree({ initial: false, tree_position: 'fit', transition_time: 0 });
}

export function FamilyChartView({ mainMemberId }: FamilyChartViewProps) {
  const chartId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
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

        const data = buildFamilyChartData(members, relationships);
        if (data.length === 0) {
          setError('Aucun membre à afficher.');
          setLoading(false);
          return;
        }

        containerRef.current.innerHTML = '';
        const chart = createChart(containerRef.current, data);
        chartRef.current = chart;

        chart
          .setCardHtml()
          .setCardDisplay([['first name'], ['birthday']])
          .setOnCardClick((_event: MouseEvent, datum: TreeDatum) => {
            const member = membersRef.current.get(datum.data.id);
            if (member) setSelectedMember(member);
          });
        chart.setOrientationVertical();

        if (mainMemberId && data.some((person) => person.id === mainMemberId)) {
          chart.updateMainId(mainMemberId);
        }

        chart.updateTree({ initial: true, tree_position: 'fit', transition_time: 0 });

        requestAnimationFrame(() => {
          if (!cancelled && chartRef.current) fitChartToContainer(chartRef.current);
        });

        if (containerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            if (chartRef.current) fitChartToContainer(chartRef.current);
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
      chartRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [mainMemberId]);

  return (
    <div className="space-y-3" data-testid="family-chart-view">
      <p className="text-sm text-arbey-600">
        Aperçu avec la librairie{' '}
        <a
          href="https://github.com/donatso/family-chart"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-arbey-700 underline decoration-arbey-300 underline-offset-2 hover:text-arbey-900"
        >
          family-chart
        </a>{' '}
        (arbre classique, pan/zoom intégré). Le genre est déduit automatiquement pour le layout —
        il n’est pas stocké en base.
      </p>

      <div className="card relative overflow-hidden p-0">
        <div
          id={chartId}
          data-testid="family-chart-container"
          ref={containerRef}
          className="f3 family-chart-preview"
          style={{
            backgroundColor: 'rgb(248, 250, 249)',
            color: 'rgb(30, 41, 39)',
          }}
        />
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
            <LoadingSpinner data-testid="family-chart-loading-spinner" />
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
