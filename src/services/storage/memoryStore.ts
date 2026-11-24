/*
 * IndexedDB persistence layer for NOVA's long-term user memories and daily briefing cache.
 */

import { STORAGE_KEYS } from '../../config/constants';
import type { DailyBriefing, MemoryItem } from '../../types';
import { getNovaDB } from './db';

export async function getAllMemories(): Promise<MemoryItem[]> {
  const db = await getNovaDB();
  const list = await db.getAll('memories');
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveMemory(item: MemoryItem): Promise<void> {
  const db = await getNovaDB();
  await db.put('memories', item);
}

export async function removeMemory(id: string): Promise<void> {
  const db = await getNovaDB();
  await db.delete('memories', id);
}

export function loadCachedBriefing(dateKey: string): DailyBriefing | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_BRIEFING);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyBriefing;
    if (parsed.dateKey !== dateKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedBriefing(briefing: DailyBriefing): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_BRIEFING, JSON.stringify(briefing));
  } catch {
    // Ignore storage quota errors
  }
}
