import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import type { FamilyMember } from '../types';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { MemberAvatar } from '../components/profile/MemberAvatar';
import { MemberFormModal } from '../components/admin/MemberFormModal';

export function MembersAdminPage() {
  const { session } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) loadMembers();
  }, [session]);

  async function loadMembers() {
    setLoading(true);
    try {
      const data = await api.get<FamilyMember[]>('/members');
      setMembers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q),
    );
  }, [members, search]);

  if (!session) return <Navigate to="/login" replace />;

  async function handleDelete(target: FamilyMember) {
    const confirmed = window.confirm(
      `Supprimer définitivement ${target.first_name} ${target.last_name} ?\n` +
        `Ses liens de parenté et contributions seront aussi supprimés.`,
    );
    if (!confirmed) return;
    setError(null);
    try {
      await api.delete(`/members/${target.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== target.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleSaved() {
    setEditing(null);
    setCreating(false);
    loadMembers();
  }

  if (loading) return <LoadingSpinner data-testid="members-admin-loading-spinner" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="members-admin-page">
      <BackLink to="/admin" label="Administration" data-testid="members-admin-back-link" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title" data-testid="members-admin-title">Gérer les membres</h1>
          <p className="page-subtitle">
            {members.length} membre{members.length > 1 ? 's' : ''} — ajouter, modifier
            (infos + liens) ou supprimer.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating(true)} data-testid="members-admin-add-button">
          + Ajouter un membre
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" data-testid="members-admin-error">
          {error}
        </div>
      )}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un membre…"
        className="input-field"
        data-testid="members-admin-search-input"
      />

      <ul className="space-y-2" data-testid="members-admin-list">
        {filtered.map((m) => (
          <li
            key={m.id}
            data-testid={`member-row-${m.id}`}
            className="card flex items-center gap-3 !p-3"
          >
            <MemberAvatar member={m} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink-800" data-testid={`member-row-name-${m.id}`}>
                {m.first_name} {m.last_name}
              </p>
              <p className="truncate text-xs text-ink-500" data-testid={`member-row-details-${m.id}`}>
                {m.birth_date ? `Né(e) le ${formatDate(m.birth_date)}` : 'Date de naissance inconnue'}
                {!m.is_alive && ' · Décédé(e)'}
                {m.auth_user_id && ' · Compte lié'}
                {m.is_admin && ' · Admin'}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="btn-secondary !px-3 !py-2"
                onClick={() => setEditing(m)}
                data-testid={`member-edit-button-${m.id}`}
              >
                Modifier
              </button>
              <button
                type="button"
                className="focus-ring inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
                onClick={() => handleDelete(m)}
                data-testid={`member-delete-button-${m.id}`}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-500" data-testid="members-admin-empty">Aucun membre trouvé.</li>
        )}
      </ul>

      {(editing || creating) && (
        <MemberFormModal
          member={editing}
          allMembers={members}
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
