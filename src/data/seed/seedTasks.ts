/*
 * Demo seed tasks (8 tasks with mixed priorities & completion) and Day Planner blocks.
 */

import type { PlannerBlock, TaskItem } from '../../types';
import { toDateKey } from '../../utils/formatters';

export function buildSeedTasks(): TaskItem[] {
  const now = Date.now();
  const today = toDateKey(new Date(now));
  const tomorrow = toDateKey(new Date(now + 86_400_000));

  return [
    {
      id: 'demo_task_1',
      title: 'Finalize Capstone Architecture Diagrams for Viva',
      description: 'Export updated sequence and Redis consumer diagrams for slides.',
      dueDate: today,
      priority: 'high',
      completed: false,
      createdAt: now - 3_600_000 * 6,
      isDemo: true,
    },
    {
      id: 'demo_task_2',
      title: 'Solve 3 Graph BFS/Dijkstra problems on LeetCode',
      dueDate: today,
      priority: 'high',
      completed: true,
      createdAt: now - 3_600_000 * 5,
      isDemo: true,
    },
    {
      id: 'demo_task_3',
      title: 'Revise OS Deadlocks & Banker Algorithm',
      dueDate: today,
      priority: 'medium',
      completed: false,
      createdAt: now - 3_600_000 * 4,
      isDemo: true,
    },
    {
      id: 'demo_task_4',
      title: 'Proofread Chapter 4 of Final BTech Thesis',
      dueDate: today,
      priority: 'high',
      completed: false,
      createdAt: now - 3_600_000 * 3,
      isDemo: true,
    },
    {
      id: 'demo_task_5',
      title: 'Send updated resume PDF to placement coordinator',
      dueDate: today,
      priority: 'medium',
      completed: true,
      createdAt: now - 3_600_000 * 2,
      isDemo: true,
    },
    {
      id: 'demo_task_6',
      title: 'Prepare 2-minute capstone demo pitch in Hinglish/English',
      dueDate: tomorrow,
      priority: 'medium',
      completed: false,
      createdAt: now - 3_600_000,
      isDemo: true,
    },
    {
      id: 'demo_task_7',
      title: 'Review DBMS B+ Tree splitting edge cases',
      dueDate: tomorrow,
      priority: 'low',
      completed: false,
      createdAt: now - 1_800_000,
      isDemo: true,
    },
    {
      id: 'demo_task_8',
      title: 'Evening badminton warm-up & hydration',
      dueDate: today,
      priority: 'low',
      completed: true,
      createdAt: now - 900_000,
      isDemo: true,
    },
  ];
}

export function buildSeedPlannerBlocks(): PlannerBlock[] {
  const today = toDateKey();
  return [
    {
      id: 'demo_plan_1',
      date: today,
      startHour: 9,
      durationHours: 1.5,
      title: 'DSA Graph & DP Morning Sprint',
      category: 'learning',
      completed: true,
      isDemo: true,
    },
    {
      id: 'demo_plan_2',
      date: today,
      startHour: 11,
      durationHours: 2,
      title: 'Capstone Telemetry Pipeline & Viva Slides',
      category: 'deep-work',
      completed: false,
      isDemo: true,
    },
    {
      id: 'demo_plan_3',
      date: today,
      startHour: 15,
      durationHours: 1,
      title: 'Thesis Review Sync with Guide',
      category: 'meeting',
      completed: false,
      isDemo: true,
    },
    {
      id: 'demo_plan_4',
      date: today,
      startHour: 18,
      durationHours: 1,
      title: 'Badminton Court Session',
      category: 'personal',
      completed: false,
      isDemo: true,
    },
  ];
}
