import { create } from 'zustand';
import { api } from '../services/api';
import type { FamilyMember, TreeNode } from '../types';

interface FamilyState {
  members: FamilyMember[];
  tree: TreeNode[];
  loading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  fetchTree: () => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  members: [],
  tree: [],
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

  fetchTree: async () => {
    set({ loading: true, error: null });
    try {
      const tree = await api.get<TreeNode[]>('/relationships/tree');
      set({ tree, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
