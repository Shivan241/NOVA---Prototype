/*
 * Plug-in tools for scheduling and reading blocks in the Calendar Day Planner.
 */

import type { NovaToolDefinition, PlannerBlock } from '../types';
import { toDateKey } from '../utils/formatters';

export const addPlannerBlockTool: NovaToolDefinition = {
  name: 'add_planner_block',
  description: 'Schedule a time block in the user daily planner.',
  parameters: {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING', description: 'Activity or focus block title.' },
      date: { type: 'STRING', description: 'Date in YYYY-MM-DD format (defaults to today).' },
      startHour: {
        type: 'NUMBER',
        description: 'Start hour in 24-hour format (e.g. 9.5 for 9:30 AM, 14 for 2:00 PM).',
      },
      durationHours: {
        type: 'NUMBER',
        description: 'Duration in hours (e.g. 1.5).',
      },
      category: {
        type: 'STRING',
        enum: ['deep-work', 'meeting', 'learning', 'personal'],
        description: 'Block category.',
      },
    },
    required: ['title', 'startHour', 'durationHours'],
  },
  async execute(args, ctx) {
    const date = args.date ? String(args.date) : toDateKey();
    const startHour = Math.max(0, Math.min(23, Number(args.startHour ?? 9)));
    const durationHours = Math.max(0.5, Math.min(12, Number(args.durationHours ?? 1)));
    const catRaw = String(args.category ?? 'deep-work');
    const category: PlannerBlock['category'] =
      catRaw === 'meeting' || catRaw === 'learning' || catRaw === 'personal'
        ? catRaw
        : 'deep-work';

    const created = await ctx.addPlannerBlock({
      title: String(args.title ?? 'Focus Block'),
      date,
      startHour,
      durationHours,
      category,
    });
    return { status: 'scheduled', block: created };
  },
};

export const getDayPlanTool: NovaToolDefinition = {
  name: 'get_day_plan',
  description: 'Retrieve scheduled time blocks for a given date.',
  parameters: {
    type: 'OBJECT',
    properties: {
      date: { type: 'STRING', description: 'Date in YYYY-MM-DD format (defaults to today).' },
    },
    required: [],
  },
  async execute(args, ctx) {
    const date = args.date ? String(args.date) : toDateKey();
    const blocks = await ctx.getDayPlan(date);
    return { date, count: blocks.length, blocks };
  },
};
