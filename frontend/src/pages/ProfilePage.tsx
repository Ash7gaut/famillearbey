import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Camera,
  Heart,
  Pencil,
  TreePine,
  Users,
  X,
} from 'lucide-react';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuthReady } from '../hooks/useAuthReady';
import { useAuthStore } from '../stores/authStore';
import { RelationGroup } from '../components/profile/RelationGroup';
import { getInitials, sanitizeMemberBio } from '../components/profile/memberUtils';
import { api } from '../services/api';
import type { FamilyMember, MemberProfile } from '../types';

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getAge(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function ProfilePage() {
  const { id } = useParams();
  const { isAuthenticated, member: currentMember, initialized } = useAuthReady();
  const setMember = useAuthStore((s) => s.setMember);

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [bio, setBio] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !id || (currentMember && id === currentMember.id);
  const profileId = id ?? currentMember?.id;

  const loadProfile = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<MemberProfile>(`/members/${profileId}/profile`);
      setProfile(data);
      setBio(sanitizeMemberBio(data.member.bio) ?? '');
      setBirthDate(data.member.birth_date ?? '');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (!initialized) return;
    if (!profileId) {
      setLoading(false);
      return;
    }
    void loadProfile();
  }, [initialized, profileId, loadProfile]);

  if (!initialized) return <LoadingSpinner />;

  if (!id && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!profileId) {
    return <ErrorMessage message="Profil introuvable." />;
  }

  async function handleSave() {
    if (!isOwnProfile) return;
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await api.patch<FamilyMember>('/members/me', {
        bio: bio.trim() || null,
        birth_date: birthDate || null,
      });
      setMember(updated);
      setProfile((prev) => (prev ? { ...prev, member: updated } : prev));
      setEditing(false);
      setFeedback('Profil mis à jour.');
    } catch (err) {
      setFeedback((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(file: File) {
    if (!isOwnProfile) return;
    setUploadingPhoto(true);
    setFeedback(null);
    try {
      const updated = await api.upload<FamilyMember>('/members/me/photo', file);
      setMember(updated);
      setProfile((prev) => (prev ? { ...prev, member: updated } : prev));
      setFeedback('Photo mise à jour.');
    } catch (err) {
      setFeedback((err as Error).message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function cancelEdit() {
    if (!profile) return;
    setBio(sanitizeMemberBio(profile.member.bio) ?? '');
    setBirthDate(profile.member.birth_date ?? '');
    setEditing(false);
  }

  if (loading) return <LoadingSpinner />;
  if (error || !profile) {
    return <ErrorMessage message={error ?? 'Profil introuvable.'} onRetry={loadProfile} />;
  }

  const { member } = profile;
  const displayBio = sanitizeMemberBio(member.bio);
  const age = getAge(member.birth_date);
  const hasRelations =
    profile.parents.length > 0 ||
    profile.spouses.length > 0 ||
    profile.children.length > 0 ||
    profile.siblings.length > 0;

  return (
    <div className="space-y-6">
      <BackLink to="/" label="Accueil" />

      <section className="relative overflow-hidden rounded-3xl border border-cream-300/60 bg-cream-50/90 p-6 shadow-warm sm:p-8">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-warm-200/25 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-cream-200 to-warm-100 font-display text-3xl font-semibold text-ink-600 shadow-warm sm:h-32 sm:w-32">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.first_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(member)
              )}
            </div>
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="focus-ring absolute -bottom-2 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-warm-600 text-white shadow-md transition hover:bg-warm-700 disabled:opacity-60"
                  title="Changer la photo"
                >
                  <Camera className="h-4 w-4" strokeWidth={2} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handlePhotoChange(file);
                    e.target.value = '';
                  }}
                />
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-warm-600">
                  {isOwnProfile ? 'Mon profil' : 'Profil famille'}
                </p>
                <h1 className="mt-1 font-display text-3xl font-semibold text-ink-800">
                  {member.first_name} {member.last_name}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-cream-200 px-2.5 py-1 text-xs font-medium text-ink-600">
                    Membre Arbey
                  </span>
                  {member.is_admin && (
                    <span className="rounded-full bg-warm-100 px-2.5 py-1 text-xs font-medium text-warm-700">
                      Administrateur
                    </span>
                  )}
                  {member.auth_user_id && (
                    <span className="rounded-full bg-arbey-100 px-2.5 py-1 text-xs font-medium text-arbey-700">
                      Compte connecté
                    </span>
                  )}
                </div>
              </div>

              {isOwnProfile && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn-secondary"
                >
                  <Pencil className="h-4 w-4" strokeWidth={2} />
                  Modifier
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-500">
              {member.birth_date && (
                <p>
                  Né(e) le <span className="font-medium text-ink-700">{formatDate(member.birth_date)}</span>
                  {age !== null && (
                    <span className="text-ink-400"> · {age} ans</span>
                  )}
                </p>
              )}
              {!member.is_alive && member.death_date && (
                <p>
                  Décédé(e) le{' '}
                  <span className="font-medium text-ink-700">{formatDate(member.death_date)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {feedback && (
        <div className="rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-800">
          {feedback}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-warm-600" strokeWidth={1.75} />
              <h2 className="font-display text-lg font-semibold text-ink-800">
                {isOwnProfile ? 'Qui je suis' : `À propos de ${member.first_name}`}
              </h2>
            </div>
            <p className="mt-1 text-sm text-ink-400">
              {isOwnProfile
                ? 'Une petite présentation pour que la famille te connaisse un peu mieux.'
                : 'Ce que cette personne partage avec la famille.'}
            </p>

            {editing ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="profile-bio" className="mb-1.5 block text-sm font-medium text-ink-700">
                    Bio
                  </label>
                  <textarea
                    id="profile-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                    placeholder="Raconte qui tu es, ce que tu aimes faire en famille, tes souvenirs préférés…"
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="profile-birth" className="mb-1.5 block text-sm font-medium text-ink-700">
                    Date de naissance
                  </label>
                  <input
                    id="profile-birth"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="input-field max-w-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                  <button type="button" onClick={cancelEdit} className="btn-secondary">
                    <X className="h-4 w-4" />
                    Annuler
                  </button>
                </div>
              </div>
            ) : displayBio ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
                {displayBio}
              </p>
            ) : (
              <p className="mt-4 text-sm italic text-ink-400">
                {isOwnProfile
                  ? 'Pas encore de bio — ajoute quelques mots pour te présenter à la famille.'
                  : `${member.first_name} n'a pas encore rédigé sa bio.`}
              </p>
            )}
          </div>

          {hasRelations && (
            <div className="card">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-warm-600" strokeWidth={1.75} />
                <h2 className="font-display text-lg font-semibold text-ink-800">Dans la famille</h2>
              </div>
              <p className="mt-1 text-sm text-ink-400">Liens de parenté connus dans l&apos;arbre.</p>
              <div className="mt-5 space-y-4">
                <RelationGroup label="Parents" members={profile.parents} />
                <RelationGroup label="Conjoint(e)s" members={profile.spouses} />
                <RelationGroup label="Enfants" members={profile.children} />
                <RelationGroup label="Frères et sœurs" members={profile.siblings} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-ink-800">Raccourcis</h2>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/tree"
                  className="focus-ring flex items-center gap-3 rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:border-warm-200 hover:bg-warm-50"
                >
                  <TreePine className="h-4 w-4 text-warm-600" strokeWidth={1.75} />
                  Voir l&apos;arbre généalogique
                </Link>
              </li>
              <li>
                <Link
                  to="/famille"
                  className="focus-ring flex items-center gap-3 rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:border-warm-200 hover:bg-warm-50"
                >
                  <Users className="h-4 w-4 text-warm-600" strokeWidth={1.75} />
                  Voir toute la famille
                </Link>
              </li>
              <li>
                <Link
                  to="/albums"
                  className="focus-ring flex items-center gap-3 rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:border-warm-200 hover:bg-warm-50"
                >
                  <Camera className="h-4 w-4 text-warm-600" strokeWidth={1.75} />
                  Parcourir les albums
                </Link>
              </li>
            </ul>
          </div>

          <div className="card border-dashed border-cream-400/80 bg-cream-50/50">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-ink-400" strokeWidth={1.75} />
              <h2 className="font-display text-lg font-semibold text-ink-700">Mémoire familiale</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Bientôt : anecdotes, recettes de grand-mère et petites histoires à partager ici.
            </p>
            <span className="mt-3 inline-block rounded-full bg-warm-100 px-2.5 py-1 text-xs font-medium text-warm-700">
              Bientôt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
