/*
 * High-level Gemini chat orchestration: builds system prompts with persona,
 * language, and long-term memory context, streams multi-turn tool calls,
 * extracts new memories, and generates personalized daily briefings.
 */

import type {
  ChatMessage,
  DailyBriefing,
  MemoryCategory,
  MemoryItem,
  Persona,
  SpeechLanguage,
  ToolExecutionContext,
  ToolInvocationRecord,
  UserSettings,
} from '../../types';
import { getGreetingByHour, toDateKey } from '../../utils/formatters';
import { fetchWithBackoff } from './client';
import { mergeGroundingSources } from './grounding';
import { streamGeminiTurn } from './streaming';
import { getGeminiFunctionDeclarations, runFunctionCalls } from './tools';

function languageInstruction(language: SpeechLanguage): string {
  switch (language) {
    case 'hi-IN':
      return 'Respond naturally in Hindi (Devanagari script or conversational Hindi) unless the user requests another language.';
    case 'hinglish':
      return 'Respond in natural conversational Hinglish (friendly blend of Hindi and English in Latin script) unless the user asks for pure English or Hindi.';
    case 'en-IN':
      return 'Respond in crisp, natural Indian English.';
    case 'en-US':
    default:
      return 'Respond in crisp, natural English.';
  }
}

function creativityInstruction(creativity: number): string {
  if (creativity <= 0.3) return 'Keep tone direct, factual, and concise.';
  if (creativity >= 0.75) return 'Use expressive, imaginative phrasing where fitting.';
  return 'Balance clarity with warm conversational tone.';
}

export function buildSystemInstruction(
  persona: Persona,
  settings: UserSettings,
  memories: MemoryItem[]
): string {
  const memoryLines = memories
    .slice(0, 18)
    .map((m) => `- [${m.category}] ${m.content}`);

  return [
    persona.systemPrompt,
    `User name: ${settings.userName || 'Explorer'}.`,
    languageInstruction(settings.language),
    creativityInstruction(settings.creativity),
    `Today's date: ${toDateKey()}.`,
    memoryLines.length > 0
      ? `Long-term memory about the user:\n${memoryLines.join('\n')}`
      : 'No long-term memories stored yet.',
    'When the user asks to save notes, create tasks/reminders, plan their day, convert units, calculate math, check weather, or search the web, call the appropriate tool.',
  ].join('\n\n');
}

function messagesToGeminiContents(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-16)
    .map((m) => {
      const parts: Array<Record<string, unknown>> = [];
      if (m.attachments && m.attachments.length > 0) {
        for (const att of m.attachments) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.dataBase64,
            },
          });
        }
      }
      parts.push({ text: m.content || 'Please inspect the attached file.' });
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });
}

export async function sendChatWithTools(params: {
  messages: ChatMessage[];
  persona: Persona;
  settings: UserSettings;
  memories: MemoryItem[];
  enableSearch: boolean;
  toolContext: ToolExecutionContext;
  onToken: (fullTextSoFar: string) => void;
  onToolActivity?: (toolName: string) => void;
  signal?: AbortSignal;
}): Promise<{
  text: string;
  sources: Array<{ title: string; uri: string }>;
  toolCalls: ToolInvocationRecord[];
}> {
  const systemInstruction = buildSystemInstruction(
    params.persona,
    params.settings,
    params.memories
  );
  const functionDeclarations = getGeminiFunctionDeclarations();
  const contents: Array<Record<string, unknown>> = messagesToGeminiContents(
    params.messages
  );

  let accumulatedText = '';
  const allToolCalls: ToolInvocationRecord[] = [];
  const allDirectSources: Array<{ title: string; uri: string }> = [];

  const MAX_TOOL_ROUNDS = 4;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const turn = await streamGeminiTurn(
      {
        model: params.settings.model,
        thinkingDepth: params.settings.thinkingDepth,
        systemInstruction,
        contents,
        functionDeclarations,
        enableSearch: params.enableSearch,
      },
      (delta) => {
        accumulatedText += delta;
        params.onToken(accumulatedText);
      },
      params.signal
    );

    if (turn.sources.length > 0) {
      allDirectSources.push(...turn.sources);
    }

    if (turn.functionCalls.length === 0) {
      break;
    }

    for (const fc of turn.functionCalls) {
      if (fc.name) params.onToolActivity?.(fc.name);
    }

    const { records, responseParts } = await runFunctionCalls(
      turn.functionCalls,
      params.toolContext
    );
    allToolCalls.push(...records);

    if (turn.modelContent) {
      contents.push(turn.modelContent);
    }
    contents.push({
      role: 'user',
      parts: responseParts,
    });
  }

  return {
    text: accumulatedText.trim(),
    sources: mergeGroundingSources(allDirectSources, allToolCalls),
    toolCalls: allToolCalls,
  };
}

export async function extractNewMemories(params: {
  userMessage: string;
  assistantReply: string;
  existingMemories: MemoryItem[];
}): Promise<
  Array<{
    content: string;
    category: MemoryCategory;
    tags: string[];
    confidence: number;
  }>
> {
  try {
    const response = await fetchWithBackoff('/api/gemini/extract-memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage: params.userMessage,
        assistantReply: params.assistantReply,
        existingMemories: params.existingMemories.map((m) => m.content),
      }),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      facts?: Array<{
        content: string;
        category: MemoryCategory;
        tags: string[];
        confidence: number;
      }>;
    };
    return Array.isArray(data.facts) ? data.facts : [];
  } catch {
    return [];
  }
}

export async function fetchDailyBriefing(params: {
  userName: string;
  memories: MemoryItem[];
  pendingTasks: string[];
}): Promise<DailyBriefing> {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dateKey = toDateKey();

  try {
    const response = await fetchWithBackoff('/api/gemini/briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: params.userName,
        memories: params.memories.slice(0, 12).map((m) => m.content),
        pendingTasks: params.pendingTasks.slice(0, 8),
        timeOfDay,
      }),
    });
    if (!response.ok) throw new Error('Briefing request failed');
    const data = (await response.json()) as {
      greeting: string;
      motivationalLine: string;
      learningSuggestion: string;
      focusSummary: string;
    };
    return {
      dateKey,
      greeting: data.greeting || `${getGreetingByHour(hour)}, ${params.userName}.`,
      motivationalLine:
        data.motivationalLine ||
        'Small consistent execution compounds faster than bursts of intensity.',
      learningSuggestion:
        data.learningSuggestion ||
        'Spend 15 minutes reviewing one core concept from your current focus area.',
      focusSummary:
        data.focusSummary ||
        (params.pendingTasks.length
          ? `You have ${params.pendingTasks.length} pending task(s) queued today.`
          : 'Your task slate is open — pick one meaningful priority to start.'),
      generatedAt: Date.now(),
    };
  } catch {
    return {
      dateKey,
      greeting: `${getGreetingByHour(hour)}, ${params.userName}.`,
      motivationalLine:
        'Clarity begins with choosing the single most meaningful step in front of you.',
      learningSuggestion:
        'Explore a quick active-recall session with Study Mentor on a topic you want to master.',
      focusSummary: params.pendingTasks.length
        ? `${params.pendingTasks.length} task(s) ready in your workspace.`
        : 'Add a task or start a conversation with NOVA to shape your day.',
      generatedAt: Date.now(),
    };
  }
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  const fallback = firstMessage.trim().slice(0, 30) || 'New Conversation';
  try {
    const response = await fetch('/api/gemini/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstMessage }),
    });
    if (!response.ok) return fallback;
    const data = (await response.json()) as { title?: string };
    return data.title?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function testGeminiEndpoint(model?: string): Promise<{
  ok: boolean;
  model?: string;
  reply?: string;
  latencyMs?: number;
  error?: string;
}> {
  try {
    const response = await fetch('/api/gemini/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      model?: string;
      reply?: string;
      latencyMs?: number;
      error?: string;
    };
    if (!response.ok || !data.ok) {
      return { ok: false, error: data.error || 'Connection test failed.' };
    }
    return {
      ok: true,
      model: data.model,
      reply: data.reply,
      latencyMs: data.latencyMs,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error during connection test.',
    };
  }
}
