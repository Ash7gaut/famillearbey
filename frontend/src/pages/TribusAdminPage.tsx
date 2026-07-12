import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import type { FamilyMember, Tribu } from '../types';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TribuFormModal } from '../components/admin/TribuFormModal';

export function TribusAdminPage() {
  const { session } = useAuthStore();
  const [tribus, setTribus] = useState<Tribu[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Tribu | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function loadData() {
    setLoading(true);
    try {
      const [t, m] = await Promise.all([
        api.get<Tribu[]>('/tribus'),
        api.get<FamilyMember[]>('/members'),
      ]);
      setTribus(t);
      setMembers(m);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Membres regroupés par tribu.
  const membersByTribu = useMemo(() => {
    const map = new Map<string, FamilyMember[]>();
    for (const m of members) {
      if (!m.tribu_id) continue;
      const list = map.get(m.tribu_id) ?? [];
      list.push(m);
      map.set(m.tribu_id, list);
    }
    return map;
  }, [members]);

  if (!session) return <Navigate to="/login" replace />;

  async function handleDelete(tribu: Tribu) {
    const count = membersByTribu.get(tribu.id)?.length ?? 0;
    const confirmed = window.confirm(
      `Supprimer la tribu « ${tribu.name} » ?` +
        (count > 0 ? `\n${count} membre(s) en seront détaché(s) (non supprimés).` : ''),
    );
    if (!confirmed) return;
    setError(null);
    try {
      await api.delete(`/tribus/${tribu.id}`);
      loadData();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleSaved() {
    setEditing(null);
    setCreating(false);
    loadData();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink to="/admin" label="Administration" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Gérer les tribus</h1>
          <p className="page-subtitle">
            {tribus.length} tribu{tribus.length > 1 ? 's' : ''} — regroupe des membres par tribu.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
          + Nouvelle tribu
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {tribus.map((t) => {
          const count = membersByTribu.get(t.id)?.length ?? 0;
          return (
            <li key={t.id} className="card flex items-center gap-3 !p-3">
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-cream-300"
                style={{ backgroundColor: t.color ?? '#E0D5C4' }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-800">{t.name}</p>
                <p className="truncate text-xs text-ink-500">
                  {count} membre{count > 1 ? 's' : ''}
                  {t.description ? ` · ${t.description}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-2"
                  onClick={() => setEditing(t)}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="focus-ring inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
                  onClick={() => handleDelete(t)}
                >
                  Supprimer
                </button>
              </div>
            </li>
          );
        })}
        {tribus.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-500">
            Aucune tribu pour l'instant. Crée la première !
          </li>
        )}
      </ul>

      {(editing || creating) && (
        <TribuFormModal
          tribu={editing}
          allMembers={members}
          membersInTribu={editing ? membersByTribu.get(editing.id) ?? [] : []}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
