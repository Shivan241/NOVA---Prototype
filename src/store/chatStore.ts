/*
 * Zustand chat store managing conversations, active chat selection,
 * placeholder streaming updates, error state, live AI Orb state, mood, and mic amplitude.
 */

import { create } from 'zustand';
import { getAllChats, removeChat, saveChat } from '../services/storage/chatStore';
import type {
  ChatConversation,
  ChatMessage,
  Mood,
  OrbState,
  PersonaId,
} from '../types';
import { generateId } from '../utils/formatters';

interface ChatStoreState {
  chats: ChatConversation[];
  activeChatId: string | null;
  orbState: OrbState;
  currentMood: Mood;
  micAmplitude: number;
  activeToolName: string | null;
  isStreaming: boolean;
  streamingText: string;
  hydrated: boolean;

  hydrateChats: () => Promise<void>;
  createChat: (personaId?: PersonaId, title?: string) => Promise<ChatConversation>;
  selectChat: (id: string) => void;
  renameChat: (id: string, title: string) => Promise<void>;
  togglePinChat: (id: string) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  importChat: (chat: ChatConversation) => Promise<void>;
  setChatPersona: (id: string, personaId: PersonaId) => Promise<void>;
  appendMessage: (chatId: string, message: ChatMessage, mood?: Mood) => Promise<void>;
  updateMessage: (
    chatId: string,
    messageId: string,
    patch: Partial<ChatMessage>,
    mood?: Mood,
    persist?: boolean
  ) => Promise<void>;
  updateMessageContent: (chatId: string, messageId: string, content: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  truncateMessagesAfter: (chatId: string, messageId: string) => Promise<void>;

  setOrbState: (orbState: OrbState) => void;
  setMood: (mood: Mood) => void;
  setMicAmplitude: (amp: number) => void;
  setActiveToolName: (name: string | null) => void;
  setStreaming: (streaming: boolean, text?: string) => void;
  clearChatsState: () => void;
}

function sortChats(list: ChatConversation[]): ChatConversation[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  chats: [],
  activeChatId: null,
  orbState: 'idle',
  currentMood: 'calm',
  micAmplitude: 0,
  activeToolName: null,
  isStreaming: false,
  streamingText: '',
  hydrated: false,

  hydrateChats: async () => {
    const chats = await getAllChats();
    set({
      chats,
      activeChatId: chats[0]?.id ?? null,
      currentMood: chats[0]?.detectedMood ?? 'calm',
      hydrated: true,
    });
  },

  createChat: async (personaId = 'friend', title = 'New Conversation') => {
    const now = Date.now();
    const chat: ChatConversation = {
      id: generateId('chat'),
      title,
      personaId,
      messages: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
      detectedMood: 'calm',
    };
    await saveChat(chat);
    set((state) => ({
      chats: sortChats([chat, ...state.chats]),
      activeChatId: chat.id,
      currentMood: 'calm',
    }));
    return chat;
  },

  selectChat: (id) => {
    const chat = get().chats.find((c) => c.id === id);
    set({
      activeChatId: id,
      currentMood: chat?.detectedMood ?? 'calm',
    });
  },

  renameChat: async (id, title) => {
    const target = get().chats.find((c) => c.id === id);
    if (!target) return;
    const updated: ChatConversation = {
      ...target,
      title: title.trim() || target.title,
      updatedAt: Date.now(),
    };
    await saveChat(updated);
    set((state) => ({
      chats: sortChats(state.chats.map((c) => (c.id === id ? updated : c))),
    }));
  },

  togglePinChat: async (id) => {
    const target = get().chats.find((c) => c.id === id);
    if (!target) return;
    const updated: ChatConversation = {
      ...target,
      pinned: !target.pinned,
      updatedAt: Date.now(),
    };
    await saveChat(updated);
    set((state) => ({
      chats: sortChats(state.chats.map((c) => (c.id === id ? updated : c))),
    }));
  },

  deleteChat: async (id) => {
    await removeChat(id);
    set((state) => {
      const remaining = state.chats.filter((c) => c.id !== id);
      const nextActive =
        state.activeChatId === id ? remaining[0]?.id ?? null : state.activeChatId;
      return { chats: remaining, activeChatId: nextActive };
    });
  },

  importChat: async (chat) => {
    await saveChat(chat);
    set((state) => ({
      chats: sortChats([chat, ...state.chats]),
      activeChatId: chat.id,
      currentMood: chat.detectedMood,
    }));
  },

  setChatPersona: async (id, personaId) => {
    const target = get().chats.find((c) => c.id === id);
    if (!target) return;
    const updated: ChatConversation = {
      ...target,
      personaId,
      updatedAt: Date.now(),
    };
    await saveChat(updated);
    set((state) => ({
      chats: state.chats.map((c) => (c.id === id ? updated : c)),
    }));
  },

  appendMessage: async (chatId, message, mood) => {
    const target = get().chats.find((c) => c.id === chatId);
    if (!target) return;
    const isFirstUser =
      target.messages.length === 0 &&
      message.role === 'user' &&
      target.title === 'New Conversation';
    const nextTitle = isFirstUser
      ? message.content.trim().slice(0, 30) || 'New Conversation'
      : target.title;
    const nextMood = mood ?? target.detectedMood;
    const updated: ChatConversation = {
      ...target,
      title: nextTitle,
      messages: [...target.messages, message],
      detectedMood: nextMood,
      updatedAt: Date.now(),
    };
    set((state) => ({
      chats: sortChats(state.chats.map((c) => (c.id === chatId ? updated : c))),
      currentMood: nextMood,
    }));
    await saveChat(updated);
  },

  updateMessage: async (chatId, messageId, patch, mood, persist = false) => {
    const target = get().chats.find((c) => c.id === chatId);
    if (!target) return;
    const nextMood = mood ?? target.detectedMood;
    const updated: ChatConversation = {
      ...target,
      messages: target.messages.map((m) =>
        m.id === messageId ? { ...m, ...patch } : m
      ),
      detectedMood: nextMood,
      updatedAt: Date.now(),
    };
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? updated : c)),
      currentMood: nextMood,
    }));
    if (persist) {
      await saveChat(updated);
    }
  },

  updateMessageContent: async (chatId, messageId, content) => {
    const target = get().chats.find((c) => c.id === chatId);
    if (!target) return;
    const updated: ChatConversation = {
      ...target,
      messages: target.messages.map((m) =>
        m.id === messageId ? { ...m, content, editedAt: Date.now() } : m
      ),
      updatedAt: Date.now(),
    };
    await saveChat(updated);
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? updated : c)),
    }));
  },

  deleteMessage: async (chatId, messageId) => {
    const target = get().chats.find((c) => c.id === chatId);
    if (!target) return;
    const updated: ChatConversation = {
      ...target,
      messages: target.messages.filter((m) => m.id !== messageId),
      updatedAt: Date.now(),
    };
    await saveChat(updated);
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? updated : c)),
    }));
  },

  truncateMessagesAfter: async (chatId, messageId) => {
    const target = get().chats.find((c) => c.id === chatId);
    if (!target) return;
    const index = target.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;
    const updated: ChatConversation = {
      ...target,
      messages: target.messages.slice(0, index + 1),
      updatedAt: Date.now(),
    };
    await saveChat(updated);
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? updated : c)),
    }));
  },

  setOrbState: (orbState) => set({ orbState }),
  setMood: (currentMood) => set({ currentMood }),
  setMicAmplitude: (micAmplitude) => set({ micAmplitude }),
  setActiveToolName: (activeToolName) => set({ activeToolName }),
  setStreaming: (isStreaming, streamingText = '') =>
    set({ isStreaming, streamingText }),
  clearChatsState: () =>
    set({
      chats: [],
      activeChatId: null,
      orbState: 'idle',
      currentMood: 'calm',
      isStreaming: false,
      streamingText: '',
    }),
}));
