/*
 * Demo seed analytics covering the last 14 days of messages, tool usage, and mood trends.
 */

import type { AnalyticsEvent, Mood } from '../../types';
import { toDateKey } from '../../utils/formatters';

const TOOL_NAMES = [
  'create_note',
  'create_task',
  'add_planner_block',
  'get_weather',
  'web_search',
  'evaluate_expression',
];

const MOOD_CYCLE: Mood[] = ['focused', 'calm', 'excited', 'focused', 'calm', 'neutral'];

export function buildSeedAnalytics(): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  const now = Date.now();

  for (let daysAgo = 13; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(now - daysAgo * 86_400_000);
    const dateKey = toDateKey(date);
    const msgCount = 3 + ((13 - daysAgo) % 5);
    const toolCount = 1 + ((daysAgo * 2) % 4);

    for (let m = 0; m < msgCount; m += 1) {
      events.push({
        id: `demo_evt_msg_${daysAgo}_${m}`,
        type: 'message',
        dateKey,
        mood: MOOD_CYCLE[(daysAgo + m) % MOOD_CYCLE.length],
        timestamp: date.getTime() + m * 600_000,
        isDemo: true,
      });
    }

    for (let t = 0; t < toolCount; t += 1) {
      events.push({
        id: `demo_evt_tool_${daysAgo}_${t}`,
        type: 'tool',
        dateKey,
        toolName: TOOL_NAMES[(daysAgo + t) % TOOL_NAMES.length],
        timestamp: date.getTime() + t * 900_000,
        isDemo: true,
      });
    }
  }

  return events;
}
