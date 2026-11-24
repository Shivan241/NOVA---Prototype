/*
 * Microphone toggle button with subtle amplitude ring while listening.
 */

import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface VoiceButtonProps {
  isListening: boolean;
  micAmplitude: number;
  disabled?: boolean;
  onToggle: () => void;
}

export function VoiceButton({
  isListening,
  micAmplitude,
  disabled,
  onToggle,
}: VoiceButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      whileTap={{ scale: 0.94 }}
      className={`relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-colors cursor-pointer nova-accent-ring disabled:opacity-40 ${
        isListening
          ? 'bg-rose-600 text-white'
          : 'text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-slate-500/10'
      }`}
    >
      {isListening && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-xl border border-rose-400 pointer-events-none"
          animate={{ scale: 1 + micAmplitude * 0.35, opacity: 0.7 }}
          transition={{ duration: 0.1 }}
        />
      )}
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </motion.button>
  );
}
