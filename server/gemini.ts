/*
 * Server-side Gemini API integration using @google/genai.
 * Handles streaming generation with retry + model fallback, Google Search grounding,
 * function calling, memory extraction, title generation, connection testing, and daily briefings.
 */

import {
  GoogleGenAI,
  ThinkingLevel,
  Type,
  type Content,
  type FunctionDeclaration,
  type GenerateContentResponse,
  type Schema,
} from '@google/genai';

export interface IncomingToolParam {
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'ARRAY';
  description: string;
  enum?: string[];
  items?: { type: 'STRING' };
}

export interface IncomingToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, IncomingToolParam>;
    required: string[];
  };
}

export interface StreamChatPayload {
  model?: string;
  thinkingDepth?: 'LOW' | 'MEDIUM' | 'HIGH' | 'XHIGH';
  systemInstruction?: string;
  contents: Content[];
  functionDeclarations?: IncomingToolDeclaration[];
  enableSearch?: boolean;
}

export interface GroundingCitation {
  title: string;
  uri: string;
}

const VALID_MODELS = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;

export function hasConfiguredApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY: Gemini API key is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function resolveModel(requested?: string): string {
  if (requested === 'gemini-3.1-flash-lite') return 'gemini-3.1-flash-lite';
  return 'gemini-4-hydrogen';
}

function getModelFallbackChain(primary: string): string[] {
  const resolved = resolveModel(primary);
  const others = VALID_MODELS.filter((m) => m !== resolved);
  return [resolved, ...others];
}

function resolveThinkingLevel(
  depth: string | undefined,
  model: string
): ThinkingLevel {
  switch (depth) {
    case 'LOW':
      return ThinkingLevel.LOW;
    case 'HIGH':
      return ThinkingLevel.HIGH;
    case 'XHIGH':
      return model === 'gemini-4-hydrogen'
        ? ('XHIGH' as ThinkingLevel)
        : ThinkingLevel.HIGH;
    case 'MEDIUM':
    default:
      return ThinkingLevel.MEDIUM;
  }
}

function isRetryableStatusError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Service Unavailable')
  );
}

export function extractFriendlyGeminiError(err: unknown): {
  status: number;
  message: string;
  code: string;
} {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes('MISSING_API_KEY') || raw.includes('GEMINI_API_KEY')) {
    return {
      status: 401,
      code: 'MISSING_API_KEY',
      message: 'API key missing. Configure GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('403') || raw.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      code: 'INVALID_API_KEY',
      message: 'Gemini API key is invalid or lacks permission. Check Settings > Secrets.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      code: 'RATE_LIMIT',
      message: 'Rate limit reached. Please wait a few seconds and retry.',
    };
  }
  if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
    return {
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Gemini models are experiencing temporary high demand. Please retry in a moment.',
    };
  }
  return {
    status: 500,
    code: 'GEMINI_ERROR',
    message: raw.length > 220 ? 'Gemini request failed. Please retry.' : raw,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapSchemaType(t: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'ARRAY'): Type {
  switch (t) {
    case 'NUMBER':
      return Type.NUMBER;
    case 'BOOLEAN':
      return Type.BOOLEAN;
    case 'ARRAY':
      return Type.ARRAY;
    case 'STRING':
    default:
      return Type.STRING;
  }
}

function toFunctionDeclarations(
  decls: IncomingToolDeclaration[] | undefined
): FunctionDeclaration[] {
  if (!decls || decls.length === 0) return [];
  return decls.map((d) => {
    const properties: Record<string, Schema> = {};
    for (const [key, prop] of Object.entries(d.parameters.properties)) {
      properties[key] = {
        type: mapSchemaType(prop.type),
        description: prop.description,
        ...(prop.enum ? { enum: prop.enum } : {}),
        ...(prop.items ? { items: { type: mapSchemaType(prop.items.type) } } : {}),
      };
    }
    return {
      name: d.name,
      description: d.description,
      parameters: {
        type: Type.OBJECT,
        properties,
        required: d.parameters.required,
      },
    };
  });
}

function extractGroundingSources(
  response: GenerateContentResponse
): GroundingCitation[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const sources: GroundingCitation[] = [];
  for (const chunk of chunks) {
    const web = chunk.web;
    if (web && typeof web.uri === 'string' && !seen.has(web.uri)) {
      seen.add(web.uri);
      sources.push({
        title: typeof web.title === 'string' && web.title ? web.title : web.uri,
        uri: web.uri,
      });
    }
  }
  return sources;
}

export async function streamGeminiChat(
  payload: StreamChatPayload,
  sendEvent: (event: string, data: unknown) => void
): Promise<void> {
  const ai = getGenAIClient();
  const candidates = getModelFallbackChain(payload.model ?? 'gemini-4-hydrogen');
  const functionDeclarations = toFunctionDeclarations(payload.functionDeclarations);

  const tools: Array<Record<string, unknown>> = [];
  if (payload.enableSearch) {
    tools.push({ googleSearch: {} });
  }
  if (functionDeclarations.length > 0) {
    tools.push({ functionDeclarations });
  }
  const useHybridConfig =
    Boolean(payload.enableSearch) && functionDeclarations.length > 0;

  let lastError: unknown = null;

  for (let mIdx = 0; mIdx < candidates.length; mIdx += 1) {
    const model = candidates[mIdx];
    const thinkingLevel = resolveThinkingLevel(payload.thinkingDepth, model);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let emittedAnyChunk = false;
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: payload.contents,
          config: {
            ...(payload.systemInstruction
              ? { systemInstruction: payload.systemInstruction }
              : {}),
            thinkingConfig: { thinkingLevel },
            ...(tools.length > 0 ? { tools } : {}),
            ...(useHybridConfig
              ? { toolConfig: { includeServerSideToolInvocations: true } }
              : {}),
          },
        });

        const aggregatedParts: NonNullable<Content['parts']> = [];
        const collectedCalls: Array<{
          id?: string;
          name?: string;
          args?: Record<string, unknown>;
        }> = [];
        const collectedSources = new Map<string, GroundingCitation>();

        for await (const rawChunk of stream) {
          const chunk = rawChunk as GenerateContentResponse;
          if (chunk.text) {
            emittedAnyChunk = true;
            sendEvent('chunk', { text: chunk.text });
          }

          const candidateContent = chunk.candidates?.[0]?.content;
          if (candidateContent?.parts) {
            for (const part of candidateContent.parts) {
              aggregatedParts.push(part);
            }
          }

          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            for (const fc of chunk.functionCalls) {
              collectedCalls.push({
                id: fc.id,
                name: fc.name,
                args: (fc.args ?? {}) as Record<string, unknown>,
              });
            }
          }

          for (const src of extractGroundingSources(chunk)) {
            collectedSources.set(src.uri, src);
          }
        }

        if (collectedSources.size > 0) {
          sendEvent('grounding', {
            sources: Array.from(collectedSources.values()),
          });
        }

        if (collectedCalls.length > 0) {
          sendEvent('functionCalls', {
            functionCalls: collectedCalls,
            modelContent: {
              role: 'model',
              parts: aggregatedParts,
            },
          });
        }

        sendEvent('done', { model });
        return;
      } catch (err) {
        lastError = err;
        console.error(
          `[NOVA:server] Stream attempt ${attempt + 1} on ${model} failed:`,
          err instanceof Error ? err.message : err
        );
        if (emittedAnyChunk || !isRetryableStatusError(err)) {
          throw err;
        }
        await sleep(500 * (attempt + 1));
      }
    }
  }

  throw lastError ?? new Error('All Gemini model attempts failed.');
}

export async function testGeminiConnection(
  preferredModel?: string
): Promise<{ ok: boolean; model: string; reply: string; latencyMs: number }> {
  const ai = getGenAIClient();
  const candidates = getModelFallbackChain(preferredModel ?? 'gemini-4-hydrogen');
  const start = Date.now();
  let lastError: unknown = null;

  for (const model of candidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: 'Reply with exactly: NOVA online.',
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      return {
        ok: true,
        model,
        reply: (response.text ?? 'NOVA online.').trim(),
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      lastError = err;
      if (!isRetryableStatusError(err)) break;
    }
  }

  throw lastError ?? new Error('Connection test failed.');
}

export async function generateConversationTitle(
  firstMessage: string
): Promise<string> {
  const fallback = firstMessage.trim().slice(0, 30) || 'New Conversation';
  try {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Generate a concise 3 to 5 word conversation title (no quotes, no punctuation) for this message:\n${firstMessage.slice(0, 240)}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    const clean = (response.text ?? '')
      .replace(/["'`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 48);
    return clean || fallback;
  } catch {
    return fallback;
  }
}

export async function runGroundedWebSearch(
  query: string,
  modelName?: string
): Promise<{ summary: string; sources: GroundingCitation[] }> {
  const ai = getGenAIClient();
  const candidates = getModelFallbackChain(modelName ?? 'gemini-4-hydrogen');
  let lastError: unknown = null;

  for (const model of candidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: query,
        config: {
          systemInstruction:
            'Provide a concise, factual summary of the latest search results with clear key points.',
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      return {
        summary: response.text ?? 'No search summary returned.',
        sources: extractGroundingSources(response),
      };
    } catch (err) {
      lastError = err;
      if (!isRetryableStatusError(err)) break;
    }
  }

  throw lastError ?? new Error('Grounded web search failed.');
}

export interface ExtractedMemoryFact {
  content: string;
  category: 'identity' | 'goal' | 'preference' | 'deadline' | 'context';
  tags: string[];
  confidence: number;
}

export async function extractMemoriesFromTurn(
  userMessage: string,
  assistantReply: string,
  existingMemories: string[]
): Promise<ExtractedMemoryFact[]> {
  const ai = getGenAIClient();
  const prompt = [
    'Extract durable, useful personal facts about the user (name, role, goals, preferences, deadlines, projects) from the conversation turn below.',
    'Do NOT extract transient greetings or duplicate facts already listed.',
    `Existing memories:\n${existingMemories.length ? existingMemories.map((m) => `- ${m}`).join('\n') : '(none)'}`,
    `User message: ${userMessage}`,
    `Assistant reply: ${assistantReply}`,
  ].join('\n\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            content: {
              type: Type.STRING,
              description: 'Concise single-sentence fact about the user.',
            },
            category: {
              type: Type.STRING,
              enum: ['identity', 'goal', 'preference', 'deadline', 'context'],
              description: 'Category of the memory fact.',
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '1 to 3 short topic tags.',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.5 and 1.0.',
            },
          },
          required: ['content', 'category', 'tags', 'confidence'],
        },
      },
    },
  });

  const raw = (response.text ?? '[]').trim();
  const parsed = JSON.parse(raw) as ExtractedMemoryFact[];
  return Array.isArray(parsed) ? parsed.slice(0, 4) : [];
}

export interface BriefingOutput {
  greeting: string;
  motivationalLine: string;
  learningSuggestion: string;
  focusSummary: string;
}

export async function generateDailyBriefingContent(input: {
  userName: string;
  memories: string[];
  pendingTasks: string[];
  timeOfDay: string;
}): Promise<BriefingOutput> {
  const ai = getGenAIClient();
  const prompt = [
    `Create a personalized ${input.timeOfDay} briefing for ${input.userName}.`,
    `User memories:\n${input.memories.length ? input.memories.join('\n') : 'No stored memories yet.'}`,
    `Pending tasks:\n${input.pendingTasks.length ? input.pendingTasks.join('\n') : 'No pending tasks yet.'}`,
    'Keep each field crisp, practical, warm, and free of clichés.',
  ].join('\n\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          greeting: { type: Type.STRING },
          motivationalLine: { type: Type.STRING },
          learningSuggestion: { type: Type.STRING },
          focusSummary: { type: Type.STRING },
        },
        required: [
          'greeting',
          'motivationalLine',
          'learningSuggestion',
          'focusSummary',
        ],
      },
    },
  });

  const raw = (response.text ?? '{}').trim();
  return JSON.parse(raw) as BriefingOutput;
}
