/*
 * Zustand workspace store managing long-term memories, notes, tasks,
 * day planner blocks, analytics events, and the daily briefing.
 */

import { create } from 'zustand';
import {
  getAllMemories,
  loadCachedBriefing,
  removeMemory,
  saveCachedBriefing,
  saveMemory,
} from '../services/storage/memoryStore';
import {
  getAllAnalyticsEvents,
  getAllNotes,
  getAllPlannerBlocks,
  getAllTasks,
  removeNote,
  removePlannerBlock,
  removeTask,
  saveAnalyticsEvent,
  saveNote,
  savePlannerBlock,
  saveTask,
} from '../services/storage/workspaceStore';
import type {
  AnalyticsEvent,
  DailyBriefing,
  MemoryCategory,
  MemoryItem,
  Mood,
  NoteItem,
  PlannerBlock,
  TaskItem,
  ToolExecutionContext,
} from '../types';
import { generateId, toDateKey } from '../utils/formatters';

interface MemoryStoreState {
  memories: MemoryItem[];
  notes: NoteItem[];
  tasks: TaskItem[];
  plannerBlocks: PlannerBlock[];
  analytics: AnalyticsEvent[];
  briefing: DailyBriefing | null;
  hydrated: boolean;

  hydrateWorkspace: () => Promise<void>;
  addMemory: (input: {
    content: string;
    category: MemoryCategory;
    tags?: string[];
    confidence?: number;
  }) => Promise<MemoryItem>;
  updateMemory: (id: string, patch: Partial<MemoryItem>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;

  addNote: (input: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<NoteItem>;
  updateNote: (id: string, patch: Partial<NoteItem>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  addTask: (input: Omit<TaskItem, 'id' | 'createdAt' | 'completed'>) => Promise<TaskItem>;
  toggleTask: (id: string) => Promise<void>;
  markTaskNotified: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  addPlannerBlock: (input: Omit<PlannerBlock, 'id' | 'completed'>) => Promise<PlannerBlock>;
  togglePlannerBlock: (id: string) => Promise<void>;
  deletePlannerBlock: (id: string) => Promise<void>;

  logAnalytics: (input: {
    type: AnalyticsEvent['type'];
    toolName?: string;
    mood?: Mood;
  }) => Promise<void>;

  setBriefing: (briefing: DailyBriefing) => void;
  getToolContext: () => ToolExecutionContext;
  clearWorkspaceMemoryState: () => void;
}

export const useMemoryStore = create<MemoryStoreState>((set, get) => ({
  memories: [],
  notes: [],
  tasks: [],
  plannerBlocks: [],
  analytics: [],
  briefing: loadCachedBriefing(toDateKey()),
  hydrated: false,

  hydrateWorkspace: async () => {
    const [memories, notes, tasks, plannerBlocks, analytics] = await Promise.all([
      getAllMemories(),
      getAllNotes(),
      getAllTasks(),
      getAllPlannerBlocks(),
      getAllAnalyticsEvents(),
    ]);
    set({
      memories,
      notes,
      tasks,
      plannerBlocks,
      analytics,
      briefing: loadCachedBriefing(toDateKey()),
      hydrated: true,
    });
  },

  addMemory: async (input) => {
    const now = Date.now();
    const existing = get().memories.find(
      (m) => m.content.toLowerCase() === input.content.trim().toLowerCase()
    );
    if (existing) return existing;

    const item: MemoryItem = {
      id: generateId('mem'),
      content: input.content.trim(),
      category: input.category,
      tags: input.tags ?? [],
      confidence: input.confidence ?? 0.85,
      createdAt: now,
      updatedAt: now,
    };
    await saveMemory(item);
    set((state) => ({ memories: [item, ...state.memories] }));
    return item;
  },

  updateMemory: async (id, patch) => {
    const target = get().memories.find((m) => m.id === id);
    if (!target) return;
    const updated: MemoryItem = { ...target, ...patch, updatedAt: Date.now() };
    await saveMemory(updated);
    set((state) => ({
      memories: state.memories.map((m) => (m.id === id ? updated : m)),
    }));
  },

  deleteMemory: async (id) => {
    await removeMemory(id);
    set((state) => ({
      memories: state.memories.filter((m) => m.id !== id),
    }));
  },

  addNote: async (input) => {
    const now = Date.now();
    const note: NoteItem = {
      id: generateId('note'),
      title: input.title,
      content: input.content,
      tags: input.tags,
      pinned: input.pinned,
      createdAt: now,
      updatedAt: now,
    };
    await saveNote(note);
    set((state) => ({
      notes: [note, ...state.notes].sort((a, b) =>
        a.pinned === b.pinned ? b.updatedAt - a.updatedAt : a.pinned ? -1 : 1
      ),
    }));
    return note;
  },

  updateNote: async (id, patch) => {
    const target = get().notes.find((n) => n.id === id);
    if (!target) return;
    const updated: NoteItem = { ...target, ...patch, updatedAt: Date.now() };
    await saveNote(updated);
    set((state) => ({
      notes: state.notes
        .map((n) => (n.id === id ? updated : n))
        .sort((a, b) =>
          a.pinned === b.pinned ? b.updatedAt - a.updatedAt : a.pinned ? -1 : 1
        ),
    }));
  },

  deleteNote: async (id) => {
    await removeNote(id);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }));
  },

  addTask: async (input) => {
    const task: TaskItem = {
      id: generateId('task'),
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      reminderAt: input.reminderAt,
      notified: false,
      priority: input.priority,
      completed: false,
      createdAt: Date.now(),
    };
    await saveTask(task);
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  toggleTask: async (id) => {
    const target = get().tasks.find((t) => t.id === id);
    if (!target) return;
    const updated: TaskItem = { ...target, completed: !target.completed };
    await saveTask(updated);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  markTaskNotified: async (id) => {
    const target = get().tasks.find((t) => t.id === id);
    if (!target || target.notified) return;
    const updated: TaskItem = { ...target, notified: true };
    await saveTask(updated);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (id) => {
    await removeTask(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  addPlannerBlock: async (input) => {
    const block: PlannerBlock = {
      id: generateId('plan'),
      ...input,
      completed: false,
    };
    await savePlannerBlock(block);
    set((state) => ({
      plannerBlocks: [...state.plannerBlocks, block].sort(
        (a, b) => a.startHour - b.startHour
      ),
    }));
    return block;
  },

  togglePlannerBlock: async (id) => {
    const target = get().plannerBlocks.find((b) => b.id === id);
    if (!target) return;
    const updated: PlannerBlock = { ...target, completed: !target.completed };
    await savePlannerBlock(updated);
    set((state) => ({
      plannerBlocks: state.plannerBlocks.map((b) => (b.id === id ? updated : b)),
    }));
  },

  deletePlannerBlock: async (id) => {
    await removePlannerBlock(id);
    set((state) => ({
      plannerBlocks: state.plannerBlocks.filter((b) => b.id !== id),
    }));
  },

  logAnalytics: async (input) => {
    const event: AnalyticsEvent = {
      id: generateId('evt'),
      type: input.type,
      toolName: input.toolName,
      mood: input.mood,
      dateKey: toDateKey(),
      timestamp: Date.now(),
    };
    await saveAnalyticsEvent(event);
    set((state) => ({ analytics: [...state.analytics, event] }));
  },

  setBriefing: (briefing) => {
    saveCachedBriefing(briefing);
    set({ briefing });
  },

  getToolContext: (): ToolExecutionContext => ({
    addNote: (n) => get().addNote(n),
    searchNotes: async (query) => {
      const q = query.toLowerCase();
      return get().notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    },
    pinNote: async (idOrTitle, pinned) => {
      const lower = idOrTitle.toLowerCase();
      const target = get().notes.find(
        (n) => n.id === idOrTitle || n.title.toLowerCase().includes(lower)
      );
      if (!target) return null;
      await get().updateNote(target.id, { pinned });
      return { ...target, pinned };
    },
    addTask: (t) => get().addTask(t),
    listTasks: async (includeCompleted = false) =>
      get().tasks.filter((t) => (includeCompleted ? true : !t.completed)),
    completeTask: async (idOrTitle) => {
      const lower = idOrTitle.toLowerCase();
      const target = get().tasks.find(
        (t) => t.id === idOrTitle || t.title.toLowerCase().includes(lower)
      );
      if (!target) return null;
      if (!target.completed) {
        await get().toggleTask(target.id);
      }
      return { ...target, completed: true };
    },
    addPlannerBlock: (b) => get().addPlannerBlock(b),
    getDayPlan: async (date) =>
      get().plannerBlocks.filter((b) => b.date === date),
  }),

  clearWorkspaceMemoryState: () =>
    set({
      memories: [],
      notes: [],
      tasks: [],
      plannerBlocks: [],
      analytics: [],
      briefing: null,
    }),
}));
