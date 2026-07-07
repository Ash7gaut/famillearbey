import { create } from 'zustand';
import { api } from '../services/api';
import type { TribuWithMembers } from '../types/tribu';

interface TribuState {
  myTribu: TribuWithMembers | null;
  allTribus: TribuWithMembers[];
  loading: boolean;
  error: string | null;
  fetchMine: () => Promise<void>;
  fetchAll: () => Promise<void>;
  createTribu: (label?: string) => Promise<TribuWithMembers>;
  updateTribu: (id: string, label: string | null) => Promise<TribuWithMembers>;
  deleteTribu: (id: string) => Promise<void>;
  addMember: (tribuId: string, memberId: string) => Promise<TribuWithMembers>;
  removeMember: (tribuId: string, memberId: string) => Promise<TribuWithMembers>;
}

function replaceTribu(list: TribuWithMembers[], updated: TribuWithMembers): TribuWithMembers[] {
  return list.map((t) => (t.id === updated.id ? updated : t));
}

export const useTribuStore = create<TribuState>((set, get) => ({
  myTribu: null,
  allTribus: [],
  loading: false,
  error: null,

  fetchMine: async () => {
    set({ loading: true, error: null });
    try {
      const myTribu = await api.get<TribuWithMembers | null>('/tribus/mine');
      set({ myTribu, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const allTribus = await api.get<TribuWithMembers[]>('/admin/tribus');
      set({ allTribus, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createTribu: async (label) => {
    const tribu = await api.post<TribuWithMembers>('/tribus', { label });
    set({ myTribu: tribu });
    return tribu;
  },

  updateTribu: async (id, label) => {
    const tribu = await api.patch<TribuWithMembers>(`/tribus/${id}`, { label });
    set({
      myTribu: get().myTribu?.id === id ? tribu : get().myTribu,
      allTribus: replaceTribu(get().allTribus, tribu),
    });
    return tribu;
  },

  deleteTribu: async (id) => {
    await api.delete(`/tribus/${id}`);
    set({
      myTribu: get().myTribu?.id === id ? null : get().myTribu,
      allTribus: get().allTribus.filter((t) => t.id !== id),
    });
  },

  addMember: async (tribuId, memberId) => {
    const tribu = await api.post<TribuWithMembers>(`/tribus/${tribuId}/members`, { memberId });
    set({
      myTribu: get().myTribu?.id === tribuId ? tribu : get().myTribu,
      allTribus: replaceTribu(get().allTribus, tribu),
    });
    return tribu;
  },

  removeMember: async (tribuId, memberId) => {
    const tribu = await api.delete<TribuWithMembers>(`/tribus/${tribuId}/members/${memberId}`);
    set({
      myTribu: get().myTribu?.id === tribuId ? tribu : get().myTribu,
      allTribus: replaceTribu(get().allTribus, tribu),
    });
    return tribu;
  },
}));
