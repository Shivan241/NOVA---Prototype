/*
 * Web Speech Synthesis (TTS) wrapper supporting voice selection,
 * Hindi/English/Hinglish voice matching, and speech lifecycle callbacks.
 */

import type { SpeechLanguage } from '../../types';

export interface VoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
}

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getAvailableVoices(): VoiceOption[] {
  if (!isTtsSupported()) return [];
  return window.speechSynthesis.getVoices().map((v) => ({
    voiceURI: v.voiceURI,
    name: v.name,
    lang: v.lang,
  }));
}

function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' Code block omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakText(
  text: string,
  options: {
    voiceURI?: string;
    language: SpeechLanguage;
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
  }
): void {
  if (!isTtsSupported()) return;
  const clean = stripMarkdownForSpeech(text);
  if (!clean) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  const voices = window.speechSynthesis.getVoices();

  if (options.voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === options.voiceURI);
    if (chosen) utterance.voice = chosen;
  } else {
    const targetPrefix =
      options.language === 'hi-IN'
        ? 'hi'
        : options.language === 'en-IN' || options.language === 'hinglish'
          ? 'en-IN'
          : 'en';
    const matched = voices.find((v) =>
      v.lang.toLowerCase().startsWith(targetPrefix.toLowerCase())
    );
    if (matched) utterance.voice = matched;
  }

  utterance.rate = options.rate ?? 1.0;
  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (!isTtsSupported()) return;
  window.speechSynthesis.cancel();
}
