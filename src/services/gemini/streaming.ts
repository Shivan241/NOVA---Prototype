/*
 * Server-Sent Events (SSE) stream parser for /api/gemini/stream responses.
 */

import type { GroundingSource } from '../../types';
import { fetchWithBackoff, GeminiApiClientError } from './client';

export interface StreamedFunctionCall {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
}

export interface StreamTurnResult {
  text: string;
  sources: GroundingSource[];
  functionCalls: StreamedFunctionCall[];
  modelContent?: {
    role: 'model';
    parts: Array<Record<string, unknown>>;
  };
}

export async function streamGeminiTurn(
  payload: Record<string, unknown>,
  onTextChunk: (delta: string) => void,
  signal?: AbortSignal
): Promise<StreamTurnResult> {
  const response = await fetchWithBackoff('/api/gemini/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new GeminiApiClientError(
      `Failed to connect to Gemini stream (${response.status}).`,
      response.status
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let sources: GroundingSource[] = [];
  let functionCalls: StreamedFunctionCall[] = [];
  let modelContent: StreamTurnResult['modelContent'];

  const processBlock = (block: string) => {
    const lines = block.split('\n');
    let eventName = 'message';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (dataLines.length === 0) return;
    const rawData = dataLines.join('\n');
    const parsed = JSON.parse(rawData) as Record<string, unknown>;

    if (eventName === 'chunk' && typeof parsed.text === 'string') {
      fullText += parsed.text;
      onTextChunk(parsed.text);
    } else if (eventName === 'grounding' && Array.isArray(parsed.sources)) {
      sources = parsed.sources as GroundingSource[];
    } else if (eventName === 'functionCalls') {
      if (Array.isArray(parsed.functionCalls)) {
        functionCalls = parsed.functionCalls as StreamedFunctionCall[];
      }
      if (parsed.modelContent && typeof parsed.modelContent === 'object') {
        modelContent = parsed.modelContent as StreamTurnResult['modelContent'];
      }
    } else if (eventName === 'error') {
      const status = typeof parsed.status === 'number' ? parsed.status : 500;
      const code = typeof parsed.code === 'string' ? parsed.code : 'GEMINI_ERROR';
      const message =
        typeof parsed.message === 'string' ? parsed.message : 'Stream error occurred.';
      const err = new GeminiApiClientError(message, status);
      (err as GeminiApiClientError & { code?: string }).code = code;
      throw err;
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex = buffer.indexOf('\n\n');
    while (sepIndex !== -1) {
      const block = buffer.slice(0, sepIndex).trim();
      buffer = buffer.slice(sepIndex + 2);
      if (block) {
        processBlock(block);
      }
      sepIndex = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) {
    processBlock(buffer.trim());
  }

  return { text: fullText, sources, functionCalls, modelContent };
}
