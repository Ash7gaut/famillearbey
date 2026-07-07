import { useEffect, useState } from 'react';
import { useTribuStore } from '../stores/tribuStore';
import { useFamilyStore } from '../stores/familyStore';
import { MemberAvatar } from '../components/profile/MemberAvatar';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export function TribuPage() {
  const { myTribu, loading, error, fetchMine, createTribu, updateTribu, deleteTribu, addMember, removeMember } =
    useTribuStore();
  const { members, fetchMembers } = useFamilyStore();

  const [label, setLabel] = useState('');
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  const [addMemberId, setAddMemberId] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchMine();
    fetchMembers();
  }, [fetchMine, fetchMembers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      await createTribu(label.trim() || undefined);
      setLabel('');
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLabel = async () => {
    if (!myTribu) return;
    setSaving(true);
    setActionError(null);
    try {
      await updateTribu(myTribu.id, labelDraft.trim() || null);
      setEditingLabel(false);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTribu || !addMemberId) return;
    setSaving(true);
    setActionError(null);
    try {
      await addMember(myTribu.id, addMemberId);
      setAddMemberId('');
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!myTribu) return;
    setActionError(null);
    try {
      await removeMember(myTribu.id, memberId);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!myTribu) return;
    if (!window.confirm('Supprimer cette tribu ? Cette action est irréversible.')) return;
    setActionError(null);
    try {
      await deleteTribu(myTribu.id);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const availableMembers = members.filter(
    (m) => !myTribu?.members.some((tm) => tm.id === m.id),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink to="/accueil" label="Accueil" />
      <div>
        <h1 className="page-title">Ma tribu</h1>
        <p className="page-subtitle">
          Un chef de tribu parle au nom de ses proches pour la Cousinade — pratique pour les enfants
          ou celles et ceux qui ne se connectent pas au site.
        </p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={fetchMine} />}

      {!loading && !error && actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {!loading && !error && !myTribu && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <p className="text-sm text-arbey-600">Vous n'appartenez à aucune tribu pour le moment.</p>
          <div>
            <label htmlFor="tribu-label" className="mb-1 block text-sm font-medium text-arbey-700">
              Surnom de la tribu (optionnel)
            </label>
            <input
              id="tribu-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Les Gautier-Arbey"
              className="w-full rounded-xl border border-arbey-200 px-4 py-2.5 text-sm focus:border-arbey-400 focus:outline-none focus:ring-2 focus:ring-arbey-100"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Création...' : 'Créer ma tribu'}
          </button>
        </form>
      )}

      {!loading && !error && myTribu && (
        <>
          <section className="card space-y-4">
            {editingLabel ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  placeholder="Les Gautier-Arbey"
                  className="flex-1 min-w-[160px] rounded-xl border border-arbey-200 px-3 py-2 text-sm"
                />
                <button type="button" className="btn-primary" disabled={saving} onClick={handleSaveLabel}>
                  Enregistrer
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditingLabel(false)}>
                  Annuler
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display font-semibold text-arbey-900">
                  {myTribu.label ?? 'Tribu sans nom'}
                </h2>
                {myTribu.can_manage && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setLabelDraft(myTribu.label ?? '');
                      setEditingLabel(true);
                    }}
                  >
                    Modifier
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              {myTribu.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-arbey-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={m} size="md" />
                    <div>
                      <p className="font-medium text-arbey-900">
                        {m.first_name} {m.last_name}
                      </p>
                      {m.is_chef && (
                        <span className="mt-0.5 inline-block rounded-full bg-arbey-100 px-2 py-0.5 text-xs font-medium text-arbey-700">
                          Chef de tribu
                        </span>
                      )}
                    </div>
                  </div>
                  {myTribu.can_manage && !m.is_chef && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleRemoveMember(m.id)}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              ))}
            </div>

            {myTribu.can_manage && (
              <form onSubmit={handleAddMember} className="flex flex-wrap gap-2 border-t border-arbey-100 pt-4">
                <select
                  value={addMemberId}
                  onChange={(e) => setAddMemberId(e.target.value)}
                  required
                  className="flex-1 min-w-[160px] rounded-xl border border-arbey-200 px-3 py-2 text-sm"
                >
                  <option value="">Ajouter un membre...</option>
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name}
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={saving} className="btn-primary">
                  Ajouter
                </button>
              </form>
            )}
          </section>

          {myTribu.can_manage && (
            <button type="button" className="btn-secondary" onClick={handleDelete}>
              Supprimer la tribu
            </button>
          )}
        </>
      )}
    </div>
  );
}
