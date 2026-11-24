/*
 * Normalizes and deduplicates Google Search grounding source citations.
 */

import type { GroundingSource, ToolInvocationRecord } from '../../types';

export function mergeGroundingSources(
  directSources: GroundingSource[],
  toolRecords: ToolInvocationRecord[]
): GroundingSource[] {
  const map = new Map<string, GroundingSource>();

  for (const src of directSources) {
    if (src.uri) {
      map.set(src.uri, { title: src.title || src.uri, uri: src.uri });
    }
  }

  for (const record of toolRecords) {
    if (record.name === 'web_search' && Array.isArray(record.result.sources)) {
      for (const item of record.result.sources as GroundingSource[]) {
        if (item?.uri) {
          map.set(item.uri, { title: item.title || item.uri, uri: item.uri });
        }
      }
    }
  }

  return Array.from(map.values());
}
