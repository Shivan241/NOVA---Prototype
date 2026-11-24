/*
 * Client-side HTTP transport to NOVA's server-side Gemini proxy routes (/api/gemini/*)
 * with exponential backoff retry on rate limits (429) or transient failures (503).
 */

export class GeminiApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GeminiApiClientError';
    this.status = status;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithBackoff(
  url: string,
  init: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, init);
      if (response.status === 429 || response.status === 503) {
        if (attempt === maxRetries) {
          throw new GeminiApiClientError(
            'Gemini API rate limit reached. Please wait a moment and try again.',
            response.status
          );
        }
        const delayMs = Math.min(8000, 700 * Math.pow(2, attempt)) + Math.random() * 250;
        await sleep(delayMs);
        attempt += 1;
        continue;
      }
      return response;
    } catch (err) {
      if (err instanceof GeminiApiClientError) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error('Network request failed');
      if (attempt === maxRetries) {
        throw lastError;
      }
      const delayMs = 600 * Math.pow(2, attempt);
      await sleep(delayMs);
      attempt += 1;
    }
  }

  throw lastError ?? new Error('Request failed after retries.');
}
