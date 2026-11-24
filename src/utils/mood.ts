/*
 * Pure heuristic mood detector that classifies conversation tone
 * into calm, excited, focused, sad, or neutral for Orb color shifts.
 */

import type { Mood } from '../types';

const MOOD_KEYWORDS: Record<Exclude<Mood, 'neutral'>, string[]> = {
  excited: [
    'excited',
    'amazing',
    'awesome',
    'yay',
    'woohoo',
    'launched',
    'celebrate',
    'thrilled',
    'breakthrough',
    'fantastic',
    'love it',
    'badiya',
    'mast',
    'shabash',
    'congrats',
    'win',
  ],
  focused: [
    'code',
    'debug',
    'typescript',
    'algorithm',
    'architecture',
    'deadline',
    'plan',
    'schedule',
    'sprint',
    'build',
    'study',
    'exam',
    'implement',
    'function',
    'analyze',
    'optimize',
    'roadmap',
    'task',
  ],
  sad: [
    'sad',
    'tired',
    'exhausted',
    'overwhelmed',
    'stressed',
    'anxious',
    'worried',
    'lonely',
    'failed',
    'burnt out',
    'burnout',
    'upset',
    'frustrated',
    'udaas',
    'pareshan',
    'thak',
  ],
  calm: [
    'calm',
    'peace',
    'relax',
    'breathe',
    'grateful',
    'thank',
    'thanks',
    'gentle',
    'quiet',
    'evening',
    'morning',
    'reflect',
    'meditate',
    'shanti',
    'chill',
    'comfort',
  ],
};

export function detectMoodFromText(text: string): Mood {
  const lower = text.toLowerCase();
  if (!lower.trim()) return 'neutral';

  const scores: Record<Exclude<Mood, 'neutral'>, number> = {
    excited: 0,
    focused: 0,
    sad: 0,
    calm: 0,
  };

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS) as [
    Exclude<Mood, 'neutral'>,
    string[],
  ][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[mood] += 1;
      }
    }
  }

  if (text.includes('!') && scores.excited > 0) {
    scores.excited += 1;
  }

  let bestMood: Mood = 'neutral';
  let bestScore = 0;

  for (const [mood, score] of Object.entries(scores) as [
    Exclude<Mood, 'neutral'>,
    number,
  ][]) {
    if (score > bestScore) {
      bestScore = score;
      bestMood = mood;
    }
  }

  return bestMood;
}
