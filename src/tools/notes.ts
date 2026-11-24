/*
 * Plug-in tools for creating, searching, and pinning user notes.
 */

import type { NovaToolDefinition } from '../types';

export const createNoteTool: NovaToolDefinition = {
  name: 'create_note',
  description: 'Create and save a personal note for the user.',
  parameters: {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING', description: 'Short title for the note.' },
      content: { type: 'STRING', description: 'Markdown or plain text body of the note.' },
      tags: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Optional tags to categorize the note.',
      },
      pinned: { type: 'BOOLEAN', description: 'Whether to pin the note at the top.' },
    },
    required: ['title', 'content'],
  },
  async execute(args, ctx) {
    const title = String(args.title ?? 'Untitled Note').trim();
    const content = String(args.content ?? '').trim();
    const tags = Array.isArray(args.tags) ? args.tags.map(String) : [];
    const pinned = Boolean(args.pinned);
    const created = await ctx.addNote({ title, content, tags, pinned });
    return { status: 'created', note: created };
  },
};

export const searchNotesTool: NovaToolDefinition = {
  name: 'search_notes',
  description: 'Search existing user notes by keyword, title, or tag.',
  parameters: {
    type: 'OBJECT',
    properties: {
      query: { type: 'STRING', description: 'Keyword or phrase to match.' },
    },
    required: ['query'],
  },
  async execute(args, ctx) {
    const query = String(args.query ?? '').trim();
    const matches = await ctx.searchNotes(query);
    return { count: matches.length, notes: matches.slice(0, 8) };
  },
};

export const pinNoteTool: NovaToolDefinition = {
  name: 'pin_note',
  description: 'Pin or unpin a note by its ID or title.',
  parameters: {
    type: 'OBJECT',
    properties: {
      idOrTitle: { type: 'STRING', description: 'Note ID or exact/partial title.' },
      pinned: { type: 'BOOLEAN', description: 'True to pin, false to unpin.' },
    },
    required: ['idOrTitle', 'pinned'],
  },
  async execute(args, ctx) {
    const updated = await ctx.pinNote(
      String(args.idOrTitle ?? ''),
      Boolean(args.pinned)
    );
    return updated
      ? { status: 'updated', note: updated }
      : { status: 'not_found' };
  },
};
