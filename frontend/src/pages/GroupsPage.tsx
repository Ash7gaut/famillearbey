import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useFamilyStore } from '../stores/familyStore';
import { useGroupsStore } from '../stores/groupsStore';
import { api } from '../services/api';
import type { Tribu, WhatsAppGroup } from '../types';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { GroupCard } from '../components/groups/GroupCard';
import { GroupFormModal } from '../components/groups/GroupFormModal';

export function GroupsPage() {
  const session = useAuthStore((s) => s.session);
  const { groups, loading, error, fetchGroups, setJoined, reportLink } = useGroupsStore();
  const members = useFamilyStore((s) => s.members);
  const fetchMembers = useFamilyStore((s) => s.fetchMembers);
  const [tribus, setTribus] = useState<Tribu[]>([]);
  // undefined = formulaire fermé ; null = création ; groupe = édition.
  const [editing, setEditing] = useState<WhatsAppGroup | null | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchGroups();
    fetchMembers();
    api.get<Tribu[]>('/tribus').then(setTribus).catch(() => {});
  }, [session, fetchGroups, fetchMembers]);

  if (!session) return <Navigate to="/login" replace />;
  // Pas de spinner plein page si le formulaire est ouvert : le remplacement de l'arbre le démonterait.
  if (loading && editing === undefined) return <LoadingSpinner data-testid="groups-loading-spinner" />;

  async function run(group: WhatsAppGroup, action: () => Promise<void>) {
    setActionError(null);
    setBusyId(group.id);
    try {
      await action();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6" data-testid="groups-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title" data-testid="groups-title">Groupes WhatsApp</h1>
          <p className="page-subtitle">Tous les groupes de la famille, au même endroit. Un clic pour rejoindre.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEditing(null)} data-testid="groups-add-button">
          <Plus className="h-4 w-4" aria-hidden /> Ajouter un groupe
        </button>
      </div>

      {(error || actionError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert" data-testid="groups-error">
          {error ?? actionError}
          {error && (
            <button type="button" onClick={fetchGroups} className="ml-3 font-semibold underline" data-testid="groups-retry-button">
              Réessayer
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2" data-testid="groups-list">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            busy={busyId === group.id}
            onEdit={setEditing}
            onToggleJoined={(g) => run(g, () => setJoined(g.id, !g.joined))}
            onReportLink={(g) => run(g, () => reportLink(g.id))}
          />
        ))}
      </div>

      {groups.length === 0 && !error && (
        <div className="card py-10 text-center" data-testid="groups-empty">
          <p className="font-medium text-ink-800">Aucun groupe pour l'instant.</p>
          <p className="mt-1 text-sm text-ink-500">Ajoute le premier groupe WhatsApp de la famille !</p>
        </div>
      )}

      {editing !== undefined && (
        <GroupFormModal
          key={editing?.id ?? 'new'}
          group={editing}
          members={members}
          tribus={tribus}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
