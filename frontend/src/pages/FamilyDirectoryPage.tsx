import { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { FamilyRelationsCard } from '../components/profile/FamilyRelationsCard';
import { memberFullName } from '../components/profile/memberUtils';
import { api } from '../services/api';
import type { MemberProfile } from '../types';

export function FamilyDirectoryPage() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<MemberProfile[]>('/members/directory');
        setProfiles(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;

    return profiles.filter((profile) => {
      const fullName = memberFullName(profile.member).toLowerCase();
      const relatedNames = [
        ...profile.parents,
        ...profile.spouses,
        ...profile.children,
        ...profile.siblings,
      ]
        .map((person) => memberFullName(person).toLowerCase())
        .join(' ');

      return fullName.includes(query) || relatedNames.includes(query);
    });
  }, [profiles, search]);

  return (
    <div className="space-y-6">
      <BackLink to="/accueil" label="Accueil" />

      <div>
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-warm-600" strokeWidth={1.75} />
          <h1 className="page-title">La famille</h1>
        </div>
        <p className="page-subtitle">
          Tous les membres et leurs liens de parenté.
        </p>
      </div>

      {!loading && !error && (
        <div className="max-w-md">
          <label htmlFor="family-search" className="sr-only">
            Rechercher un membre
          </label>
          <input
            id="family-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un prénom, nom ou proche…"
            className="input-field"
          />
        </div>
      )}

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && filteredProfiles.length === 0 && (
        <p className="text-sm text-ink-500">Aucun membre ne correspond à ta recherche.</p>
      )}

      {!loading && !error && filteredProfiles.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredProfiles.map((profile) => (
            <FamilyRelationsCard key={profile.member.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
