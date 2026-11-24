/*
 * Memory management hook providing CRUD actions and automatic background
 * fact extraction from conversation turns.
 */

import { useCallback } from 'react';
import { extractNewMemories } from '../services/gemini/chat';
import { useMemoryStore } from '../store/memoryStore';
import { useUiStore } from '../store/uiStore';
import type { MemoryCategory, MemoryItem } from '../types';

export function useMemory() {
  const memories = useMemoryStore((s) => s.memories);
  const addMemory = useMemoryStore((s) => s.addMemory);
  const updateMemory = useMemoryStore((s) => s.updateMemory);
  const deleteMemory = useMemoryStore((s) => s.deleteMemory);
  const logAnalytics = useMemoryStore((s) => s.logAnalytics);
  const addToast = useUiStore((s) => s.addToast);

  const extractAndSave = useCallback(
    async (userMessage: string, assistantReply: string) => {
      if (userMessage.trim().length < 12) return;
      const facts = await extractNewMemories({
        userMessage,
        assistantReply,
        existingMemories: memories,
      });

      if (facts.length > 0) {
        for (const fact of facts) {
          await addMemory({
            content: fact.content,
            category: fact.category,
            tags: fact.tags,
            confidence: fact.confidence,
          });
          await logAnalytics({ type: 'memory' });
        }
        addToast({
          title: `Remembered ${facts.length} new detail${facts.length > 1 ? 's' : ''}`,
          description: facts[0].content,
          variant: 'info',
        });
      }
    },
    [memories, addMemory, logAnalytics, addToast]
  );

  const createManualMemory = useCallback(
    async (
      content: string,
      category: MemoryCategory,
      tags: string[] = []
    ): Promise<MemoryItem> => {
      const created = await addMemory({
        content,
        category,
        tags,
        confidence: 1,
      });
      await logAnalytics({ type: 'memory' });
      return created;
    },
    [addMemory, logAnalytics]
  );

  return {
    memories,
    extractAndSave,
    createManualMemory,
    updateMemory,
    deleteMemory,
  };
}
