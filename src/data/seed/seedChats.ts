/*
 * Demo seed conversations (2 realistic chats using Study Mentor and Coder personas).
 */

import type { ChatConversation } from '../../types';

const now = Date.now();
const hour = 3_600_000;

export const SEED_CHATS: ChatConversation[] = [
  {
    id: 'demo_chat_study_mentor',
    title: 'B+ Trees & Viva Prep Strategy',
    personaId: 'study-mentor',
    pinned: true,
    createdAt: now - 14 * hour,
    updatedAt: now - 3 * hour,
    detectedMood: 'focused',
    isDemo: true,
    messages: [
      {
        id: 'demo_msg_1',
        role: 'user',
        content:
          'Explain why databases prefer B+ Trees over standard Binary Search Trees for disk indexing — Hinglish mein short aur crisp samjhao.',
        createdAt: now - 14 * hour,
        mood: 'focused',
        status: 'done',
        isDemo: true,
      },
      {
        id: 'demo_msg_2',
        role: 'assistant',
        content:
          'Bilkul Aarav! Disk I/O sabse expensive operation hota hai, isliye database engines **fan-out** maximize karte hain.\n\n### 3 Core Reasons\n- **High Fan-out, Shallow Height:** Ek 4KB disk page mein ek B+ Tree node hundreds of keys hold kar sakta hai. Billions of rows bhi sirf 3–4 levels mein mil jaati hain.\n- **Data Only in Leaf Nodes:** Internal nodes sirf routing keys rakhte hain, toh zyada keys ek page mein fit hoti hain.\n- **Linked Leaf Nodes for Range Queries:** Leaves ek doubly-linked list banati hain, isliye `WHERE age BETWEEN 20 AND 30` sequential scan jaisa fast chalta hai.\n\n**Quick Viva Check:** Agar internal node mein record pointers bhi rakh dein (jaise B-Tree mein), toh tree height par kya impact padega?',
        createdAt: now - 14 * hour + 12_000,
        mood: 'focused',
        status: 'done',
        isDemo: true,
      },
    ],
  },
  {
    id: 'demo_chat_coder',
    title: 'Redis Rate Limiter Lua Script',
    personaId: 'coder',
    pinned: false,
    createdAt: now - 26 * hour,
    updatedAt: now - 8 * hour,
    detectedMood: 'focused',
    isDemo: true,
    messages: [
      {
        id: 'demo_msg_3',
        role: 'user',
        content:
          'Write a clean TypeScript helper calling an atomic Redis sliding-window rate limiter for my capstone API gateway.',
        createdAt: now - 26 * hour,
        mood: 'focused',
        status: 'done',
        isDemo: true,
      },
      {
        id: 'demo_msg_4',
        role: 'assistant',
        content:
          'Here is an atomic sliding-window counter pattern using a single Redis Lua evaluation so concurrent API instances never race:\n\n```ts\nconst SLIDING_WINDOW_LUA = `\nlocal key = KEYS[1]\nlocal now = tonumber(ARGV[1])\nlocal window = tonumber(ARGV[2])\nlocal limit = tonumber(ARGV[3])\nredis.call("ZREMRANGEBYSCORE", key, 0, now - window)\nlocal count = redis.call("ZCARD", key)\nif count < limit then\n  redis.call("ZADD", key, now, tostring(now) .. "-" .. math.random())\n  redis.call("PEXPIRE", key, window)\n  return 1\nend\nreturn 0\n`;\n\nexport async function allowRequest(\n  redis: { eval: (script: string, numKeys: number, ...args: string[]) => Promise<number> },\n  userId: string,\n  limit = 60,\n  windowMs = 60_000\n): Promise<boolean> {\n  const allowed = await redis.eval(\n    SLIDING_WINDOW_LUA,\n    1,\n    `rl:${userId}`,\n    String(Date.now()),\n    String(windowMs),\n    String(limit)\n  );\n  return allowed === 1;\n}\n```\n\n**Trade-off:** Using a sorted set (`ZSET`) gives exact window precision at the cost of `O(log N)` per request; for ultra-high throughput (>100k RPS), a dual-bucket fixed-window approximation uses `O(1)` memory.',
        createdAt: now - 26 * hour + 18_000,
        mood: 'focused',
        status: 'done',
        isDemo: true,
      },
    ],
  },
];
