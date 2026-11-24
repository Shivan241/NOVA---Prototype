/*
 * Typed IndexedDB database initialization using the `idb` library.
 * Stores conversations, long-term memories, notes, tasks, planner blocks,
 * analytics, and metadata flags (such as first-launch seed status).
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION } from '../../config/constants';
import type {
  AnalyticsEvent,
  ChatConversation,
  MemoryItem,
  NoteItem,
  PlannerBlock,
  TaskItem,
} from '../../types';

interface NovaMetaEntry {
  key: string;
  value: boolean | string | number;
}

interface NovaDBSchema extends DBSchema {
  chats: {
    key: string;
    value: ChatConversation;
    indexes: { 'by-updated': number };
  };
  memories: {
    key: string;
    value: MemoryItem;
    indexes: { 'by-category': string; 'by-updated': number };
  };
  notes: {
    key: string;
    value: NoteItem;
    indexes: { 'by-updated': number };
  };
  tasks: {
    key: string;
    value: TaskItem;
    indexes: { 'by-created': number };
  };
  planner: {
    key: string;
    value: PlannerBlock;
    indexes: { 'by-date': string };
  };
  analytics: {
    key: string;
    value: AnalyticsEvent;
    indexes: { 'by-date': string };
  };
  meta: {
    key: string;
    value: NovaMetaEntry;
  };
}

let dbPromise: Promise<IDBPDatabase<NovaDBSchema>> | null = null;

export function getNovaDB(): Promise<IDBPDatabase<NovaDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<NovaDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('chats')) {
          const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
          chatStore.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('memories')) {
          const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
          memoryStore.createIndex('by-category', 'category');
          memoryStore.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-created', 'createdAt');
        }
        if (!db.objectStoreNames.contains('planner')) {
          const plannerStore = db.createObjectStore('planner', { keyPath: 'id' });
          plannerStore.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
          analyticsStore.createIndex('by-date', 'dateKey');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getMetaFlag(key: string): Promise<boolean> {
  const db = await getNovaDB();
  const entry = await db.get('meta', key);
  return Boolean(entry?.value);
}

export async function setMetaFlag(
  key: string,
  value: boolean | string | number
): Promise<void> {
  const db = await getNovaDB();
  await db.put('meta', { key, value });
}

export async function clearAllIndexedDBData(): Promise<void> {
  const db = await getNovaDB();
  const stores: (
    | 'chats'
    | 'memories'
    | 'notes'
    | 'tasks'
    | 'planner'
    | 'analytics'
    | 'meta'
  )[] = ['chats', 'memories', 'notes', 'tasks', 'planner', 'analytics', 'meta'];
  for (const storeName of stores) {
    await db.clear(storeName);
  }
}
