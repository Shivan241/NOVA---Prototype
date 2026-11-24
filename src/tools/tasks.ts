/*
 * Plug-in tools for managing user tasks and reminders.
 */

import type { NovaToolDefinition, TaskPriority } from '../types';

export const createTaskTool: NovaToolDefinition = {
  name: 'create_task',
  description: 'Create a task or reminder for the user with optional due date and priority.',
  parameters: {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING', description: 'Task title.' },
      description: { type: 'STRING', description: 'Optional extra details.' },
      dueDate: { type: 'STRING', description: 'Optional YYYY-MM-DD due date.' },
      reminderMinutesFromNow: {
        type: 'NUMBER',
        description: 'Optional minutes from now to schedule a browser reminder.',
      },
      priority: {
        type: 'STRING',
        enum: ['low', 'medium', 'high'],
        description: 'Task priority level.',
      },
    },
    required: ['title'],
  },
  async execute(args, ctx) {
    const title = String(args.title ?? '').trim();
    const description = args.description ? String(args.description) : undefined;
    const dueDate = args.dueDate ? String(args.dueDate) : undefined;
    const priorityRaw = String(args.priority ?? 'medium');
    const priority: TaskPriority =
      priorityRaw === 'low' || priorityRaw === 'high' ? priorityRaw : 'medium';
    const reminderMinutes =
      typeof args.reminderMinutesFromNow === 'number' &&
      args.reminderMinutesFromNow > 0
        ? args.reminderMinutesFromNow
        : undefined;
    const reminderAt = reminderMinutes
      ? Date.now() + reminderMinutes * 60_000
      : undefined;

    const created = await ctx.addTask({
      title,
      description,
      dueDate,
      reminderAt,
      priority,
    });
    return { status: 'created', task: created };
  },
};

export const listTasksTool: NovaToolDefinition = {
  name: 'list_tasks',
  description: 'List the user tasks and reminders.',
  parameters: {
    type: 'OBJECT',
    properties: {
      includeCompleted: {
        type: 'BOOLEAN',
        description: 'Include completed tasks when true.',
      },
    },
    required: [],
  },
  async execute(args, ctx) {
    const tasks = await ctx.listTasks(Boolean(args.includeCompleted));
    return { count: tasks.length, tasks: tasks.slice(0, 15) };
  },
};

export const completeTaskTool: NovaToolDefinition = {
  name: 'complete_task',
  description: 'Mark a task as completed by ID or title.',
  parameters: {
    type: 'OBJECT',
    properties: {
      idOrTitle: { type: 'STRING', description: 'Task ID or title.' },
    },
    required: ['idOrTitle'],
  },
  async execute(args, ctx) {
    const updated = await ctx.completeTask(String(args.idOrTitle ?? ''));
    return updated
      ? { status: 'completed', task: updated }
      : { status: 'not_found' };
  },
};
