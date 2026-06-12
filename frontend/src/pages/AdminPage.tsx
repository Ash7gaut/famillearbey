import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import type { FamilyMember } from '../types';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface AccessRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  message: string | null;
  auth_user_id: string | null;
}

export function AdminPage() {
  const { member, session } = useAuthStore();
  const [unlinked, setUnlinked] = useState<FamilyMember[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteMemberId, setInviteMemberId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (member?.is_admin) loadData();
  }, [member]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [members, reqs] = await Promise.all([
        api.get<FamilyMember[]>('/admin/members/unlinked'),
        api.get<AccessRequest[]>('/admin/requests'),
      ]);
      setUnlinked(members);
      setRequests(reqs);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return <Navigate to="/login" replace />;
  if (!member?.is_admin) return <Navigate to="/" replace />;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const result = await api.post<{ message: string }>('/admin/invite', {
        memberId: inviteMemberId,
        email: inviteEmail,
      });
      setMessage(result.message);
      setInviteEmail('');
      loadData();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const handleApprove = async (requestId: string, memberId: string) => {
    setMessage(null);
    try {
      const result = await api.post<{ message: string }>(`/admin/requests/${requestId}/approve`, {
        memberId,
      });
      setMessage(result.message);
      loadData();
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const handleReject = async (requestId: string) => {
    await api.post(`/admin/requests/${requestId}/reject`);
    loadData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <BackLink to="/" label="Accueil" />
      <div>
        <h1 className="page-title">Administration</h1>
        <p className="mt-1 text-sm text-arbey-600">Gérer les invitations et demandes d'accès</p>
      </div>

      {message && (
        <div className="rounded-xl border border-arbey-200 bg-arbey-50 px-4 py-3 text-sm text-arbey-800">
          {message}
        </div>
      )}

      {/* Inviter un membre */}
      <section className="card space-y-4">
        <h2 className="font-display font-semibold text-arbey-900">Inviter un membre</h2>
        <form onSubmit={handleInvite} className="space-y-3">
          <select
            value={inviteMemberId}
            onChange={(e) => setInviteMemberId(e.target.value)}
            required
            className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm"
          >
            <option value="">Choisir un membre de l'arbre...</option>
            {unlinked.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
                {m.invite_email ? ` (invitation: ${m.invite_email})` : ''}
              </option>
            ))}
          </select>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@exemple.com"
            required
            className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm"
          />
          <button type="submit" className="btn-primary">Envoyer l'invitation</button>
        </form>
      </section>

      {/* Demandes en attente */}
      <section className="card space-y-4">
        <h2 className="font-display font-semibold text-arbey-900">
          Demandes d'accès ({requests.length})
        </h2>
        {requests.length === 0 ? (
          <p className="text-sm text-arbey-500">Aucune demande en attente.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="rounded-xl border border-arbey-100 p-4 space-y-3">
              <div>
                <p className="font-medium text-arbey-900">
                  {req.first_name} {req.last_name}
                </p>
                <p className="text-sm text-arbey-600">{req.email}</p>
                {req.auth_user_id && (
                  <span className="mt-1 inline-block rounded-full bg-arbey-100 px-2 py-0.5 text-xs font-medium text-arbey-700">
                    Compte déjà créé
                  </span>
                )}
                {req.message && <p className="text-sm text-arbey-500 mt-1">"{req.message}"</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  id={`member-${req.id}`}
                  className="flex-1 min-w-[160px] rounded-xl border border-arbey-200 px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Lier à un membre...</option>
                  {unlinked.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const select = document.getElementById(`member-${req.id}`) as HTMLSelectElement;
                    if (select.value) handleApprove(req.id, select.value);
                  }}
                >
                  Approuver
                </button>
                <button type="button" className="btn-secondary" onClick={() => handleReject(req.id)}>
                  Refuser
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
