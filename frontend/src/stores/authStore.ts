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
  sendMagicLink: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  syncMember: () => Promise<void>;
  setMember: (member: FamilyMember | null) => void;
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
      set({ session: data.session });

      // `initialized` n'est posé qu'une fois le membre chargé : sinon RequireAuth
      // voit session && !member et redirige (rechargement de /messagerie → /accueil).
      if (data.session) {
        try {
          const member = await api.get<FamilyMember | null>('/auth/me');
          set({ member });
        } catch {
          // Pas encore lié — sync tentera après login
        }
      }
      set({ initialized: true });

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

    sendMagicLink: async (email: string) => {
      set({ loading: true, error: null });
      try {
        const { error } = await requireSupabase().auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        set({ loading: false });
      } catch (err) {
        const raw = (err as Error).message;
        const friendly =
          /email not confirmed|not confirmed/i.test(raw)
            ? 'Ton compte n\'est pas encore validé par un administrateur.'
            : raw;
        set({ error: friendly, loading: false });
        throw err;
      }
    },

    verifyOtp: async (email: string, token: string) => {
      set({ loading: true, error: null });
      try {
        const { data, error } = await requireSupabase().auth.verifyOtp({
          email,
          token,
          type: 'email',
        });
        if (error) throw error;

        set({ session: data.session });
        const member = await api.post<FamilyMember>('/auth/sync');
        set({ member, loading: false });
      } catch (err) {
        const raw = (err as Error).message;
        const friendly = /expired|invalid/i.test(raw)
          ? 'Ce code est invalide ou expiré. Redemande un lien de connexion.'
          : raw;
        set({ error: friendly, loading: false });
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

    setMember: (member) => set({ member }),
  };
});
