/*
 * Web Speech API Speech-to-Text (STT) and Web Audio API microphone volume meter.
 * Supports English, Hindi (hi-IN), and Hinglish (en-IN) recognition.
 */

import type { SpeechLanguage } from '../../types';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export function isSttSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function resolveRecognitionLang(language: SpeechLanguage): string {
  switch (language) {
    case 'hi-IN':
      return 'hi-IN';
    case 'hinglish':
    case 'en-IN':
      return 'en-IN';
    case 'en-US':
    default:
      return 'en-US';
  }
}

export interface SttCallbacks {
  onInterim: (transcript: string) => void;
  onFinal: (transcript: string) => void;
  onVolume: (normalizedVolume: number) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}

export class SpeechInputController {
  private recognition: SpeechRecognitionLike | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private rafId: number | null = null;
  private active = false;

  async start(language: SpeechLanguage, callbacks: SttCallbacks): Promise<void> {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      callbacks.onError('Speech recognition is not supported in this browser.');
      return;
    }

    this.stop();
    this.active = true;

    const recognition = new Ctor();
    recognition.lang = resolveRecognitionLang(language);
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim.trim()) callbacks.onInterim(interim.trim());
      if (finalText.trim()) callbacks.onFinal(finalText.trim());
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        callbacks.onError(`Microphone error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      this.cleanupAudioMeter();
      this.active = false;
      callbacks.onEnd();
    };

    this.recognition = recognition;
    recognition.start();
    void this.startAudioMeter(callbacks.onVolume);
  }

  private async startAudioMeter(onVolume: (v: number) => void): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!this.active) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.mediaStream = stream;
      const ctx = new AudioContext();
      this.audioContext = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!this.active) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          sum += data[i];
        }
        const avg = sum / data.length;
        onVolume(Math.min(1, avg / 90));
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    } catch {
      // Mic level meter is optional if user denied separate audio stream
    }
  }

  private cleanupAudioMeter(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      void this.audioContext.close().catch(() => undefined);
      this.audioContext = null;
    }
  }

  stop(): void {
    this.active = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore already stopped
      }
      this.recognition = null;
    }
    this.cleanupAudioMeter();
  }
}
