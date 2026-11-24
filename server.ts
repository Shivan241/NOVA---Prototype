/*
 * Express full-stack entry point serving Gemini API routes and Vite middleware (dev)
 * or static build artifacts (production) on port 3000.
 */

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractFriendlyGeminiError,
  extractMemoriesFromTurn,
  generateConversationTitle,
  generateDailyBriefingContent,
  hasConfiguredApiKey,
  runGroundedWebSearch,
  streamGeminiChat,
  testGeminiConnection,
  type StreamChatPayload,
} from './server/gemini.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      geminiConfigured: hasConfiguredApiKey(),
    });
  });

  app.post('/api/gemini/test', async (req: Request, res: Response) => {
    try {
      const { model } = (req.body ?? {}) as { model?: string };
      const result = await testGeminiConnection(model);
      res.json(result);
    } catch (err) {
      const parsed = extractFriendlyGeminiError(err);
      res.status(parsed.status).json({
        ok: false,
        code: parsed.code,
        error: parsed.message,
      });
    }
  });

  app.post('/api/gemini/title', async (req: Request, res: Response) => {
    const { firstMessage } = (req.body ?? {}) as { firstMessage?: string };
    const title = await generateConversationTitle(firstMessage || '');
    res.json({ title });
  });

  app.post('/api/gemini/stream', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: string, data: unknown): void => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const payload = req.body as StreamChatPayload;
      if (!payload || !Array.isArray(payload.contents)) {
        sendEvent('error', {
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Invalid chat contents payload.',
        });
        res.end();
        return;
      }

      await streamGeminiChat(payload, sendEvent);
      res.end();
    } catch (err) {
      const parsed = extractFriendlyGeminiError(err);
      sendEvent('error', parsed);
      res.end();
    }
  });

  app.post('/api/gemini/search', async (req: Request, res: Response) => {
    try {
      const { query, model } = req.body as { query?: string; model?: string };
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Search query is required.' });
        return;
      }
      const result = await runGroundedWebSearch(query, model);
      res.json(result);
    } catch (err) {
      const parsed = extractFriendlyGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  app.post('/api/gemini/extract-memory', async (req: Request, res: Response) => {
    try {
      const { userMessage, assistantReply, existingMemories } = req.body as {
        userMessage?: string;
        assistantReply?: string;
        existingMemories?: string[];
      };
      if (!userMessage || !assistantReply) {
        res.json({ facts: [] });
        return;
      }
      const facts = await extractMemoriesFromTurn(
        userMessage,
        assistantReply,
        Array.isArray(existingMemories) ? existingMemories : []
      );
      res.json({ facts });
    } catch (err) {
      const parsed = extractFriendlyGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message, facts: [] });
    }
  });

  app.post('/api/gemini/briefing', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        userName?: string;
        memories?: string[];
        pendingTasks?: string[];
        timeOfDay?: string;
      };
      const briefing = await generateDailyBriefingContent({
        userName: body.userName || 'Explorer',
        memories: Array.isArray(body.memories) ? body.memories : [],
        pendingTasks: Array.isArray(body.pendingTasks) ? body.pendingTasks : [],
        timeOfDay: body.timeOfDay || 'morning',
      });
      res.json(briefing);
    } catch (err) {
      const parsed = extractFriendlyGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOVA server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NOVA server:', err);
  process.exit(1);
});
