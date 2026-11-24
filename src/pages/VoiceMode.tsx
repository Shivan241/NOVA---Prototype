/*
 * Fullscreen hands-free Voice Mode featuring the large reactive AI Orb,
 * Hindi/English/Hinglish recognition selector, live transcript, and continuous loop.
 */

import { Mic, MicOff, VolumeX, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/common/Button';
import { ControlBar } from '../components/layout/ControlBar';
import { AIOrb } from '../components/orb/AIOrb';
import { Z_INDEX } from '../config/constants';
import { MOOD_PALETTES } from '../config/theme';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';

export function VoiceModePage() {
  const setPage = useUiStore((s) => s.setPage);
  const orbState = useChatStore((s) => s.orbState);
  const currentMood = useChatStore((s) => s.currentMood);
  const micAmplitude = useChatStore((s) => s.micAmplitude);

  const activePersonaId = useSettingsStore((s) => s.activePersonaId);
  const getPersonaById = useSettingsStore((s) => s.getPersonaById);

  const { sendMessage, isStreaming, streamingText } = useChat();
  const {
    sttSupported,
    isListening,
    isSpeaking,
    interimTranscript,
    startListening,
    stopListening,
    cancelSpeech,
  } = useVoice();

  const [lastHeard, setLastHeard] = useState('');
  const [lastReply, setLastReply] = useState('');

  const persona = getPersonaById(activePersonaId);

  useEffect(() => {
    return () => {
      stopListening();
      cancelSpeech();
    };
  }, [stopListening, cancelSpeech]);

  const handleVoiceTurn = async (transcript: string) => {
    setLastHeard(transcript);
    const reply = await sendMessage(transcript, {
      forceSpeak: true,
    });
    if (reply) {
      setLastReply(reply);
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      stopListening();
    } else {
      void startListening((finalText) => {
        void handleVoiceTurn(finalText);
      });
    }
  };

  return (
    <div
      style={{ zIndex: Z_INDEX.VOICE_OVERLAY }}
      className="fixed inset-0 flex flex-col justify-between p-5 md:p-8 bg-[var(--nova-bg)] nova-ambient-bg"
    >
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4">
        <ControlBar hideVoiceShortcut />

        <button
          type="button"
          onClick={() => setPage('chat')}
          aria-label="Exit voice mode"
          className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl nova-surface text-[var(--nova-text)] hover:bg-slate-500/15 nova-accent-ring cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Centerpiece Living Orb */}
      <div className="flex flex-col items-center justify-center text-center gap-6 my-auto">
        <AIOrb
          state={orbState}
          mood={currentMood}
          orbStyle={persona.orbStyle}
          personaPrimary={persona.accentColor}
          personaSecondary={persona.secondaryColor}
          micAmplitude={micAmplitude}
          size={260}
          onClick={toggleMicrophone}
          ariaLabel={isListening ? 'Stop listening' : 'Tap orb to speak'}
        />

        <div className="max-w-xl space-y-2 px-4">
          <p className="text-xs font-medium text-[var(--nova-text-muted)]">
            {persona.name} · {MOOD_PALETTES[currentMood].label} ·{' '}
            {isListening
              ? 'Listening…'
              : isStreaming
                ? 'Thinking…'
                : isSpeaking
                  ? 'Speaking…'
                  : 'Tap the orb or microphone to speak'}
          </p>

          {(interimTranscript || lastHeard) && (
            <p className="text-base font-medium text-[var(--nova-text)]">
              &ldquo;{interimTranscript || lastHeard}&rdquo;
            </p>
          )}

          {(streamingText || lastReply) && (
            <p className="text-sm text-[var(--nova-text-muted)] line-clamp-4 leading-relaxed">
              {streamingText || lastReply}
            </p>
          )}

          {!sttSupported && (
            <p className="text-xs text-amber-500">
              Web Speech recognition is unavailable in this browser. Try Chrome or Edge.
            </p>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant={isListening ? 'danger' : 'primary'}
          size="lg"
          onClick={toggleMicrophone}
          disabled={!sttSupported}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Speak to NOVA</span>
            </>
          )}
        </Button>

        {isSpeaking && (
          <Button variant="secondary" size="lg" onClick={cancelSpeech}>
            <VolumeX className="w-4 h-4" />
            <span>Mute Speech</span>
          </Button>
        )}
      </div>
    </div>
  );
}
