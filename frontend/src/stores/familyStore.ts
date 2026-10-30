import { create } from 'zustand';
import { api } from '../services/api';
import type { FamilyMember, Relationship } from '../types';

interface FamilyState {
  members: FamilyMember[];
  relationships: Relationship[];
  loading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  fetchTreeData: () => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  members: [],
  relationships: [],
  loading: false,
  error: null,

  fetchMembers: async () => {
    set({ loading: true, error: null });
    try {
      const members = await api.get<FamilyMember[]>('/members');
      set({ members, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchTreeData: async () => {
    set({ loading: true, error: null });
    try {
      const [members, relationships] = await Promise.all([
        api.get<FamilyMember[]>('/members'),
        api.get<Relationship[]>('/relationships'),
      ]);
      set({ members, relationships, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
