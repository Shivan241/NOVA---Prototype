/*
 * Demo seed notes (6 entries) covering project ideas, viva questions, and study plans.
 */

import type { NoteItem } from '../../types';

const now = Date.now();
const day = 86_400_000;

export const SEED_NOTES: NoteItem[] = [
  {
    id: 'demo_note_1',
    title: 'BTech Capstone Viva Questions',
    content:
      '1. Why did you choose WebSockets over HTTP polling for telemetry ingestion?\n2. How do you handle backpressure when 10k events/sec arrive?\n3. Explain your Redis stream consumer group recovery strategy.\n4. What is the p99 latency budget on the aggregation pipeline?',
    tags: ['viva', 'capstone', 'btech'],
    pinned: true,
    createdAt: now - 5 * day,
    updatedAt: now - 1 * day,
    isDemo: true,
  },
  {
    id: 'demo_note_2',
    title: '30-Day Placement Sprint Plan',
    content:
      'Week 1: Graphs, Trees, Sliding Window + OS Virtual Memory.\nWeek 2: Dynamic Programming + DBMS B+ Trees & Isolation Levels.\nWeek 3: System Design (URL Shortener, Rate Limiter, Chat) + Mock Interviews.\nWeek 4: Company-specific archives & Capstone polish.',
    tags: ['placements', 'study-plan'],
    pinned: true,
    createdAt: now - 7 * day,
    updatedAt: now - 2 * day,
    isDemo: true,
  },
  {
    id: 'demo_note_3',
    title: 'Side Project Ideas (Weekend Builds)',
    content:
      '- Local-first Markdown Zettelkasten with semantic vector search in WebWorker.\n- Voice-driven Git PR reviewer that reads diffs aloud while commuting.\n- Smart mess menu + nutrition tracker for hostel students.',
    tags: ['ideas', 'projects'],
    pinned: false,
    createdAt: now - 6 * day,
    updatedAt: now - 3 * day,
    isDemo: true,
  },
  {
    id: 'demo_note_4',
    title: 'DBMS Transaction Isolation Cheat Sheet',
    content:
      'Read Uncommitted -> Dirty Reads possible.\nRead Committed -> Prevents dirty reads; non-repeatable reads possible.\nRepeatable Read -> Locks/MVCC snapshot prevents non-repeatable reads.\nSerializable -> Full isolation via 2PL or SSI.',
    tags: ['dbms', 'interview'],
    pinned: false,
    createdAt: now - 4 * day,
    updatedAt: now - 4 * day,
    isDemo: true,
  },
  {
    id: 'demo_note_5',
    title: 'Resume Bullet Quantification Checklist',
    content:
      'Start every bullet with an action verb + system metric:\n"Reduced telemetry query latency by 42% (380ms -> 220ms) by introducing Redis time-bucket caching and composite PostgreSQL indexes."',
    tags: ['career', 'resume'],
    pinned: false,
    createdAt: now - 3 * day,
    updatedAt: now - 2 * day,
    isDemo: true,
  },
  {
    id: 'demo_note_6',
    title: 'System Design: Distributed Rate Limiter',
    content:
      'Token Bucket vs Sliding Window Log.\nUse Redis Lua script for atomic check-and-decrement so race conditions never occur across API gateway replicas.',
    tags: ['system-design', 'redis'],
    pinned: false,
    createdAt: now - 2 * day,
    updatedAt: now - 1 * day,
    isDemo: true,
  },
];
