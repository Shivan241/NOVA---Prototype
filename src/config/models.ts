/*
 * Supported Gemini model definitions, fallback chain, and default reasoning presets.
 */

import type { GeminiModelId, ModelConfig, ThinkingDepth } from '../types';

export const DEFAULT_MODEL: GeminiModelId = 'gemini-4-hydrogen';
export const FALLBACK_MODEL: GeminiModelId = 'gemini-3.1-flash-lite';

export const GEMINI_MODELS: ModelConfig[] = [
  {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen',
    description: 'Fast, balanced intelligence with multimodal and tool calling support.',
    supportsThinking: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash Lite',
    description: 'Ultra-low latency fallback model ideal for rapid voice and chat replies.',
    supportsThinking: true,
  },
];

export const THINKING_DEPTH_OPTIONS: {
  value: ThinkingDepth;
  label: string;
  summary: string;
}[] = [
  { value: 'LOW', label: 'Low', summary: 'Fastest responses with minimal reasoning overhead' },
  { value: 'MEDIUM', label: 'Medium', summary: 'Balanced depth and latency' },
  { value: 'HIGH', label: 'High', summary: 'Thorough multi-step reasoning' },
  { value: 'XHIGH', label: 'Deep', summary: 'Maximum reasoning depth (Hydrogen)' },
];
