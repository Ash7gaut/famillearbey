import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase';
import { api } from '../services/api';
import type { Conversation, ConversationSummary, Message } from '../types';

const PAGE_SIZE = 50;

interface MessagingState {
  conversations: ConversationSummary[];
  messages: Message[];
  hasMoreMessages: boolean;
  activeConversationId: string | null;
  loading: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  createConversation: (title: string | null, memberIds: string[]) => Promise<Conversation>;
  addMember: (conversationId: string, memberId: string) => Promise<void>;
  removeMember: (conversationId: string, memberId: string) => Promise<void>;
  setMuted: (conversationId: string, muted: boolean) => Promise<void>;

  openConversation: (conversationId: string) => Promise<void>;
  closeConversation: () => void;
  loadOlderMessages: () => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;

  /** Écoute les nouveaux messages de TOUTES mes conversations (la RLS filtre côté serveur). */
  startRealtime: (selfMemberId: string) => void;
  stopRealtime: () => void;
}

let realtimeChannel: RealtimeChannel | null = null;

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  messages: [],
  hasMoreMessages: false,
  activeConversationId: null,
  loading: false,
  error: null,

  fetchConversations: async () => {
    // Pas de spinner plein écran si la liste est déjà affichée (refetch silencieux).
    set({ loading: get().conversations.length === 0, error: null });
    try {
      const conversations = await api.get<ConversationSummary[]>('/conversations');
      set({ conversations, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createConversation: async (title, memberIds) => {
    const conversation = await api.post<Conversation>('/conversations', { title, memberIds });
    await get().fetchConversations();
    return conversation;
  },

  addMember: async (conversationId, memberId) => {
    await api.put(`/conversations/${conversationId}/members/${memberId}`);
    await get().fetchConversations();
  },

  removeMember: async (conversationId, memberId) => {
    await api.delete(`/conversations/${conversationId}/members/${memberId}`);
    await get().fetchConversations();
  },

  setMuted: async (conversationId, muted) => {
    await api.patch(`/conversations/${conversationId}/muted`, { muted });
    set({
      conversations: get().conversations.map((c) =>
        c.id === conversationId ? { ...c, muted } : c,
      ),
    });
  },

  openConversation: async (conversationId) => {
    set({ activeConversationId: conversationId, messages: [], hasMoreMessages: false, error: null });

    try {
      const messages = await api.get<Message[]>(
        `/conversations/${conversationId}/messages?limit=${PAGE_SIZE}`,
      );
      if (get().activeConversationId !== conversationId) return;
      set({ messages, hasMoreMessages: messages.length >= PAGE_SIZE });
      await api.post(`/conversations/${conversationId}/read`);
      set({
        conversations: get().conversations.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c,
        ),
      });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  closeConversation: () => {
    set({ activeConversationId: null, messages: [], hasMoreMessages: false });
  },

  loadOlderMessages: async () => {
    const { activeConversationId, messages } = get();
    if (!activeConversationId || !messages.length) return;

    const older = await api.get<Message[]>(
      `/conversations/${activeConversationId}/messages?limit=${PAGE_SIZE}&before=${encodeURIComponent(messages[0].created_at)}`,
    );
    if (get().activeConversationId !== activeConversationId) return;
    set({ messages: [...older, ...get().messages], hasMoreMessages: older.length >= PAGE_SIZE });
  },

  sendMessage: async (conversationId, content) => {
    const message = await api.post<Message>(`/conversations/${conversationId}/messages`, { content });
    // Le canal Realtime recevra aussi cet INSERT, mais on l'ajoute déjà pour
    // un retour instantané côté auteur sans attendre l'aller-retour websocket.
    if (get().activeConversationId === conversationId && !get().messages.some((m) => m.id === message.id)) {
      set({ messages: [...get().messages, message] });
    }
  },

  startRealtime: (selfMemberId) => {
    if (realtimeChannel || !isSupabaseConfigured) return;

    let everSubscribed = false;

    realtimeChannel = requireSupabase()
      .channel('messagerie')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const message = payload.new as Message;
        const { activeConversationId, conversations, messages } = get();
        const isActive = activeConversationId === message.conversation_id;

        if (isActive && !messages.some((m) => m.id === message.id)) {
          set({ messages: [...messages, message] });
          // Message vu en direct : on garde le marqueur de lecture à jour.
          if (message.author_id !== selfMemberId) {
            api.post(`/conversations/${message.conversation_id}/read`).catch(() => {});
          }
        }

        const known = conversations.some((c) => c.id === message.conversation_id);
        if (!known) {
          // Nouvelle conversation (ajout à un groupe) : on recharge la liste.
          get().fetchConversations();
          return;
        }

        const updated = conversations.map((c) =>
          c.id === message.conversation_id
            ? {
                ...c,
                last_message: message,
                updated_at: message.created_at,
                unread_count:
                  isActive || message.author_id === selfMemberId ? c.unread_count : c.unread_count + 1,
              }
            : c,
        );
        updated.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        set({ conversations: updated });
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        // Après une coupure, on rattrape ce qui a été manqué.
        if (everSubscribed) {
          get().fetchConversations();
          const { activeConversationId } = get();
          if (activeConversationId) {
            try {
              const messages = await api.get<Message[]>(
                `/conversations/${activeConversationId}/messages?limit=${PAGE_SIZE}`,
              );
              if (get().activeConversationId === activeConversationId) set({ messages });
            } catch {
              // La prochaine reconnexion réessaiera.
            }
          }
        }
        everSubscribed = true;
      });
  },

  stopRealtime: () => {
    if (realtimeChannel) {
      requireSupabase().removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },
}));
