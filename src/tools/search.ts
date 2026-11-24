/*
 * Web search plug-in tool backed by server-side Gemini Google Search grounding.
 */

import type { NovaToolDefinition } from '../types';

export const webSearchTool: NovaToolDefinition = {
  name: 'web_search',
  description:
    'Search the live web using Google Search grounding for current events, facts, and citations.',
  parameters: {
    type: 'OBJECT',
    properties: {
      query: { type: 'STRING', description: 'Search query.' },
    },
    required: ['query'],
  },
  async execute(args) {
    const query = String(args.query ?? '').trim();
    const response = await fetch('/api/gemini/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Grounded web search failed');
    }
    const data = (await response.json()) as {
      summary: string;
      sources: Array<{ title: string; uri: string }>;
    };
    return {
      query,
      summary: data.summary,
      sources: data.sources,
    };
  },
};
