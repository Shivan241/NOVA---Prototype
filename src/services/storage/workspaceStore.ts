/*
 * IndexedDB persistence layer for Notes, Tasks, Day Planner blocks, and Analytics events.
 */

import type { AnalyticsEvent, NoteItem, PlannerBlock, TaskItem } from '../../types';
import { getNovaDB } from './db';

export async function getAllNotes(): Promise<NoteItem[]> {
  const db = await getNovaDB();
  const list = await db.getAll('notes');
  return list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export async function saveNote(note: NoteItem): Promise<void> {
  const db = await getNovaDB();
  await db.put('notes', note);
}

export async function removeNote(id: string): Promise<void> {
  const db = await getNovaDB();
  await db.delete('notes', id);
}

export async function getAllTasks(): Promise<TaskItem[]> {
  const db = await getNovaDB();
  const list = await db.getAll('tasks');
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveTask(task: TaskItem): Promise<void> {
  const db = await getNovaDB();
  await db.put('tasks', task);
}

export async function removeTask(id: string): Promise<void> {
  const db = await getNovaDB();
  await db.delete('tasks', id);
}

export async function getAllPlannerBlocks(): Promise<PlannerBlock[]> {
  const db = await getNovaDB();
  const list = await db.getAll('planner');
  return list.sort((a, b) => a.startHour - b.startHour);
}

export async function savePlannerBlock(block: PlannerBlock): Promise<void> {
  const db = await getNovaDB();
  await db.put('planner', block);
}

export async function removePlannerBlock(id: string): Promise<void> {
  const db = await getNovaDB();
  await db.delete('planner', id);
}

export async function getAllAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const db = await getNovaDB();
  return db.getAll('analytics');
}

export async function saveAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  const db = await getNovaDB();
  await db.put('analytics', event);
}
