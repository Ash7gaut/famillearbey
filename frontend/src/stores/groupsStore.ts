import { create } from 'zustand';
import { api } from '../services/api';
import type { WhatsAppGroup } from '../types';

export interface GroupFields {
  name?: string;
  description?: string | null;
  invite_link?: string;
  restricted?: boolean;
  pinned?: boolean;
}

interface GroupsState {
  groups: WhatsAppGroup[];
  loading: boolean;
  error: string | null;

  fetchGroups: () => Promise<void>;
  createGroup: (fields: Required<Pick<GroupFields, 'name' | 'invite_link'>> & GroupFields, memberIds: string[]) => Promise<WhatsAppGroup>;
  updateGroup: (id: string, fields: GroupFields) => Promise<WhatsAppGroup>;
  addAccess: (id: string, memberIds: string[]) => Promise<WhatsAppGroup>;
  removeAccess: (id: string, memberId: string) => Promise<void>;
  uploadImage: (id: string, file: File) => Promise<WhatsAppGroup>;
  setJoined: (id: string, joined: boolean) => Promise<void>;
  reportLink: (id: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

/** Épinglés d'abord, puis par nom (même ordre que l'API). */
function sortGroups(groups: WhatsAppGroup[]): WhatsAppGroup[] {
  return [...groups].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || a.name.localeCompare(b.name, 'fr'),
  );
}

export const useGroupsStore = create<GroupsState>((set, get) => {
  const upsert = (group: WhatsAppGroup) => {
    const others = get().groups.filter((g) => g.id !== group.id);
    set({ groups: sortGroups([...others, group]) });
    return group;
  };

  return {
    groups: [],
    loading: false,
    error: null,

    fetchGroups: async () => {
      // Pas de spinner plein écran si la liste est déjà affichée (refetch silencieux).
      set({ loading: get().groups.length === 0, error: null });
      try {
        const groups = await api.get<WhatsAppGroup[]>('/whatsapp-groups');
        set({ groups, loading: false });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    createGroup: async (fields, memberIds) =>
      upsert(await api.post<WhatsAppGroup>('/whatsapp-groups', { ...fields, memberIds })),

    updateGroup: async (id, fields) => upsert(await api.patch<WhatsAppGroup>(`/whatsapp-groups/${id}`, fields)),

    addAccess: async (id, memberIds) => upsert(await api.post<WhatsAppGroup>(`/whatsapp-groups/${id}/access`, { memberIds })),

    removeAccess: async (id, memberId) => {
      await api.delete(`/whatsapp-groups/${id}/access/${memberId}`);
      await get().fetchGroups();
    },

    uploadImage: async (id, file) => upsert(await api.upload<WhatsAppGroup>(`/whatsapp-groups/${id}/image`, file)),

    setJoined: async (id, joined) => {
      upsert(await api.put<WhatsAppGroup>(`/whatsapp-groups/${id}/joined`, { joined }));
    },

    reportLink: async (id) => {
      upsert(await api.post<WhatsAppGroup>(`/whatsapp-groups/${id}/report-link`));
    },

    deleteGroup: async (id) => {
      await api.delete(`/whatsapp-groups/${id}`);
      set({ groups: get().groups.filter((g) => g.id !== id) });
    },
  };
});
