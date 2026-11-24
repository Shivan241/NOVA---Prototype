/*
 * Voice hook integrating Web Speech STT, microphone volume visualization,
 * and TTS playback synced with the NOVA AI Orb state.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isSttSupported,
  SpeechInputController,
} from '../services/speech/stt';
import {
  getAvailableVoices,
  isTtsSupported,
  speakText,
  stopSpeaking,
  type VoiceOption,
} from '../services/speech/tts';
import { useChatStore } from '../store/chatStore';
import { useMemoryStore } from '../store/memoryStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voices, setVoices] = useState<VoiceOption[]>([]);

  const controllerRef = useRef<SpeechInputController | null>(null);
  const language = useSettingsStore((s) => s.settings.language);
  const voiceURI = useSettingsStore((s) => s.settings.voiceURI);
  const ttsRate = useSettingsStore((s) => s.settings.ttsRate);
  const setOrbState = useChatStore((s) => s.setOrbState);
  const setMicAmplitude = useChatStore((s) => s.setMicAmplitude);
  const logAnalytics = useMemoryStore((s) => s.logAnalytics);
  const addToast = useUiStore((s) => s.addToast);

  useEffect(() => {
    const refreshVoices = () => setVoices(getAvailableVoices());
    refreshVoices();
    if (isTtsSupported()) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
    return () => {
      controllerRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  const startListening = useCallback(
    async (onFinalTranscript: (text: string) => void) => {
      if (!isSttSupported()) {
        addToast({
          title: 'Voice input unavailable',
          description: 'Your browser does not support Web Speech recognition.',
          variant: 'warning',
        });
        return;
      }

      stopSpeaking();
      setIsSpeaking(false);

      if (!controllerRef.current) {
        controllerRef.current = new SpeechInputController();
      }

      setInterimTranscript('');
      setIsListening(true);
      setOrbState('listening');
      void logAnalytics({ type: 'voice' });

      await controllerRef.current.start(language, {
        onInterim: (text) => setInterimTranscript(text),
        onFinal: (text) => {
          setInterimTranscript('');
          onFinalTranscript(text);
        },
        onVolume: (amp) => setMicAmplitude(amp),
        onError: (message) => {
          setOrbState('error');
          addToast({ title: 'Voice Error', description: message, variant: 'error' });
          setTimeout(() => setOrbState('idle'), 1200);
        },
        onEnd: () => {
          setIsListening(false);
          setMicAmplitude(0);
          setOrbState('idle');
        },
      });
    },
    [language, addToast, setOrbState, setMicAmplitude, logAnalytics]
  );

  const stopListening = useCallback(() => {
    controllerRef.current?.stop();
    setIsListening(false);
    setMicAmplitude(0);
    setInterimTranscript('');
    setOrbState('idle');
  }, [setMicAmplitude, setOrbState]);

  const speak = useCallback(
    (text: string, onComplete?: () => void) => {
      if (!isTtsSupported()) {
        onComplete?.();
        return;
      }
      speakText(text, {
        voiceURI,
        language,
        rate: ttsRate,
        onStart: () => {
          setIsSpeaking(true);
          setOrbState('speaking');
        },
        onEnd: () => {
          setIsSpeaking(false);
          setOrbState('idle');
          onComplete?.();
        },
      });
    },
    [voiceURI, language, ttsRate, setOrbState]
  );

  const cancelSpeech = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
    setOrbState('idle');
  }, [setOrbState]);

  return {
    sttSupported: isSttSupported(),
    ttsSupported: isTtsSupported(),
    isListening,
    isSpeaking,
    interimTranscript,
    voices,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  };
}
