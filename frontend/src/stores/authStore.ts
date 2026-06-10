import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase';
import { api, setAuthTokenGetter } from '../services/api';
import type { FamilyMember } from '../types';

interface AuthState {
  session: Session | null;
  member: FamilyMember | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  syncMember: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  setAuthTokenGetter(() => get().session?.access_token ?? null);

  return {
    session: null,
    member: null,
    loading: false,
    error: null,
    initialized: false,

    init: async () => {
      if (!isSupabaseConfigured) {
        set({ initialized: true });
        return;
      }

      const sb = requireSupabase();
      const { data } = await sb.auth.getSession();
      set({ session: data.session, initialized: true });

      if (data.session) {
        try {
          const member = await api.get<FamilyMember | null>('/auth/me');
          set({ member });
        } catch {
          // Pas encore lié — sync tentera après login
        }
      }

      sb.auth.onAuthStateChange(async (event, session) => {
        set({ session });
        setAuthTokenGetter(() => session?.access_token ?? null);

        if (!session) {
          set({ member: null });
          return;
        }

        // init() charge déjà /auth/me — pas de double sync au refresh
        if (event === 'INITIAL_SESSION') return;

        try {
          const member = await api.post<FamilyMember>('/auth/sync');
          set({ member });
        } catch {
          // Erreur réseau ou serveur : ne pas déconnecter visuellement
        }
      });
    },

    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
        if (error) throw error;

        set({ session: data.session });
        const member = await api.post<FamilyMember>('/auth/sync');
        set({ member, loading: false });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
        throw err;
      }
    },

    logout: async () => {
      if (isSupabaseConfigured) await requireSupabase().auth.signOut();
      set({ session: null, member: null });
    },

    syncMember: async () => {
      const member = await api.post<FamilyMember>('/auth/sync');
      set({ member });
    },
  };
});
