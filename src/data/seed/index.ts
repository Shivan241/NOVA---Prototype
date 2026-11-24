/*
 * Coordinates first-launch demo data seeding (gated by an IndexedDB meta flag)
 * and provides explicit Load Demo Data / Clear Demo Data operations.
 */

import { getMetaFlag, getNovaDB, setMetaFlag } from '../../services/storage/db';
import { SEED_CHATS } from './seedChats';
import { SEED_MEMORIES } from './seedMemories';
import { SEED_NOTES } from './seedNotes';
import { buildSeedAnalytics } from './seedAnalytics';
import { buildSeedPlannerBlocks, buildSeedTasks } from './seedTasks';

const SEED_FLAG_KEY = 'demo_seeded_v1';

export async function loadDemoData(): Promise<void> {
  const db = await getNovaDB();

  for (const mem of SEED_MEMORIES) {
    await db.put('memories', mem);
  }
  for (const note of SEED_NOTES) {
    await db.put('notes', note);
  }
  for (const task of buildSeedTasks()) {
    await db.put('tasks', task);
  }
  for (const block of buildSeedPlannerBlocks()) {
    await db.put('planner', block);
  }
  for (const chat of SEED_CHATS) {
    await db.put('chats', chat);
  }
  for (const evt of buildSeedAnalytics()) {
    await db.put('analytics', evt);
  }

  await setMetaFlag(SEED_FLAG_KEY, true);
}

export async function ensureInitialSeedData(): Promise<boolean> {
  const alreadySeeded = await getMetaFlag(SEED_FLAG_KEY);
  if (alreadySeeded) return false;

  const db = await getNovaDB();
  const [chatsCount, memoriesCount, notesCount, tasksCount] = await Promise.all([
    db.count('chats'),
    db.count('memories'),
    db.count('notes'),
    db.count('tasks'),
  ]);

  if (chatsCount === 0 && memoriesCount === 0 && notesCount === 0 && tasksCount === 0) {
    await loadDemoData();
    return true;
  }

  await setMetaFlag(SEED_FLAG_KEY, true);
  return false;
}

export async function clearDemoData(): Promise<void> {
  const db = await getNovaDB();

  const [chats, memories, notes, tasks, planner, analytics] = await Promise.all([
    db.getAll('chats'),
    db.getAll('memories'),
    db.getAll('notes'),
    db.getAll('tasks'),
    db.getAll('planner'),
    db.getAll('analytics'),
  ]);

  for (const item of chats) {
    if (item.isDemo) await db.delete('chats', item.id);
  }
  for (const item of memories) {
    if (item.isDemo) await db.delete('memories', item.id);
  }
  for (const item of notes) {
    if (item.isDemo) await db.delete('notes', item.id);
  }
  for (const item of tasks) {
    if (item.isDemo) await db.delete('tasks', item.id);
  }
  for (const item of planner) {
    if (item.isDemo) await db.delete('planner', item.id);
  }
  for (const item of analytics) {
    if (item.isDemo) await db.delete('analytics', item.id);
  }

  await setMetaFlag(SEED_FLAG_KEY, true);
}
