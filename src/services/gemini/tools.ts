/*
 * Bridges registered NOVA tool plug-ins with Gemini function calling loops.
 */

import { executeRegisteredTool, getToolDeclarationsForGemini } from '../../tools';
import type { ToolExecutionContext, ToolInvocationRecord } from '../../types';
import { generateId } from '../../utils/formatters';
import type { StreamedFunctionCall } from './streaming';

export function getGeminiFunctionDeclarations() {
  return getToolDeclarationsForGemini();
}

export async function runFunctionCalls(
  calls: StreamedFunctionCall[],
  ctx: ToolExecutionContext
): Promise<{
  records: ToolInvocationRecord[];
  responseParts: Array<{
    functionResponse: {
      id?: string;
      name: string;
      response: Record<string, unknown>;
    };
  }>;
}> {
  const records: ToolInvocationRecord[] = [];
  const responseParts: Array<{
    functionResponse: {
      id?: string;
      name: string;
      response: Record<string, unknown>;
    };
  }> = [];

  for (const call of calls) {
    const name = call.name ?? 'unknown_tool';
    const args = call.args ?? {};
    const result = await executeRegisteredTool(name, args, ctx);

    records.push({
      id: call.id ?? generateId('tool'),
      name,
      args,
      result,
      timestamp: Date.now(),
    });

    responseParts.push({
      functionResponse: {
        ...(call.id ? { id: call.id } : {}),
        name,
        response: result,
      },
    });
  }

  return { records, responseParts };
}
