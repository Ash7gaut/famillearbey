import { useAuthStore } from '../stores/authStore';

/** Attend que Supabase ait restauré la session avant les appels API protégés. */
export function useAuthReady() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const member = useAuthStore((s) => s.member);

  return {
    initialized,
    session,
    member,
    isAuthenticated: initialized && !!session && !!member,
  };
}
