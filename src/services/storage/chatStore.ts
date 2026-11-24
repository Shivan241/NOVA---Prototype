/*
 * IndexedDB persistence layer for chat conversations and message histories.
 */

import type { ChatConversation } from '../../types';
import { getNovaDB } from './db';

export async function getAllChats(): Promise<ChatConversation[]> {
  const db = await getNovaDB();
  const list = await db.getAll('chats');
  return list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export async function saveChat(chat: ChatConversation): Promise<void> {
  const db = await getNovaDB();
  await db.put('chats', chat);
}

export async function removeChat(id: string): Promise<void> {
  const db = await getNovaDB();
  await db.delete('chats', id);
}
