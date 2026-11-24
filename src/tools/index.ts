/*
 * Central tool plug-in registry. To add a new tool, create a module in src/tools/
 * and register it in NOVA_TOOLS below.
 */

import type { NovaToolDefinition, ToolExecutionContext } from '../types';
import { calculatorTool, unitConverterTool } from './calculator';
import { createNoteTool, pinNoteTool, searchNotesTool } from './notes';
import { addPlannerBlockTool, getDayPlanTool } from './planner';
import { webSearchTool } from './search';
import { completeTaskTool, createTaskTool, listTasksTool } from './tasks';
import { weatherTool } from './weather';

export const NOVA_TOOLS: NovaToolDefinition[] = [
  createNoteTool,
  searchNotesTool,
  pinNoteTool,
  createTaskTool,
  listTasksTool,
  completeTaskTool,
  addPlannerBlockTool,
  getDayPlanTool,
  calculatorTool,
  unitConverterTool,
  webSearchTool,
  weatherTool,
];

const TOOL_MAP = new Map<string, NovaToolDefinition>(
  NOVA_TOOLS.map((tool) => [tool.name, tool])
);

export function getToolDeclarationsForGemini() {
  return NOVA_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

export async function executeRegisteredTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<Record<string, unknown>> {
  const tool = TOOL_MAP.get(name);
  if (!tool) {
    return { error: `Unknown tool "${name}".` };
  }
  try {
    return await tool.execute(args, ctx);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Tool execution failed.',
    };
  }
}
