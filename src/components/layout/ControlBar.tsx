/*
 * Reusable fixed-height ControlBar containing the persisted Hands-Free toggle,
 * Speech/Reply Language selector (Hinglish / Hindi / English), and Voice Mode shortcut.
 */

import { Mic } from 'lucide-react';
import { CONTROL_BAR } from '../../config/constants';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import type { SpeechLanguage } from '../../types';

interface ControlBarProps {
  compact?: boolean;
  hideVoiceShortcut?: boolean;
}

export function ControlBar({
  compact = false,
  hideVoiceShortcut = false,
}: ControlBarProps) {
  const handsFree = useSettingsStore((s) => s.settings.handsFree);
  const language = useSettingsStore((s) => s.settings.language);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const setPage = useUiStore((s) => s.setPage);

  return (
    <div
      className={`flex items-center ${CONTROL_BAR.GAP_CLASS} shrink-0`}
      role="toolbar"
      aria-label="Voice and language controls"
    >
      {/* Hands-Free Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={handsFree}
        title={
          handsFree
            ? 'Hands-free voice replies ON — click to turn OFF'
            : 'Hands-free voice replies OFF — click to auto-speak replies'
        }
        onClick={() =>
          updateSettings({
            handsFree: !handsFree,
            ttsEnabled: !handsFree,
          })
        }
        style={
          handsFree
            ? {
                boxShadow: '0 0 14px var(--accent-glow)',
                borderColor: 'var(--accent)',
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent)',
              }
            : undefined
        }
        className={`${CONTROL_BAR.HEIGHT_CLASS} px-2.5 rounded-xl nova-surface text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors nova-accent-ring cursor-pointer ${
          handsFree
            ? ''
            : 'text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full shrink-0 ${
            handsFree
              ? 'bg-[var(--accent)] animate-pulse'
              : 'bg-slate-400/50'
          }`}
        />
        <span>{compact ? 'Hands-Free' : `Hands-Free: ${handsFree ? 'ON' : 'OFF'}`}</span>
      </button>

      {/* Language Selector */}
      <select
        value={language}
        onChange={(e) =>
          updateSettings({ language: e.target.value as SpeechLanguage })
        }
        title="Select speech recognition and NOVA reply language"
        aria-label="Reply and speech language"
        className={`${CONTROL_BAR.HEIGHT_CLASS} px-2.5 rounded-xl nova-surface text-xs font-medium text-[var(--nova-text)] whitespace-nowrap shrink-0 nova-accent-ring cursor-pointer`}
      >
        <option value="hinglish" className="bg-slate-900 text-white">
          Hinglish
        </option>
        <option value="hi-IN" className="bg-slate-900 text-white">
          हिन्दी (Hindi)
        </option>
        <option value="en-IN" className="bg-slate-900 text-white">
          English (IN)
        </option>
        <option value="en-US" className="bg-slate-900 text-white">
          English (US)
        </option>
      </select>

      {/* Voice Mode Shortcut */}
      {!hideVoiceShortcut && (
        <button
          type="button"
          title="Open fullscreen Voice Mode (Ctrl+M)"
          aria-label="Open fullscreen Voice Mode"
          onClick={() => setPage('voice')}
          className={`${CONTROL_BAR.HEIGHT_CLASS} px-2.5 rounded-xl nova-surface text-xs font-medium text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 nova-accent-ring cursor-pointer`}
        >
          <Mic className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="hidden sm:inline">Voice</span>
        </button>
      )}
    </div>
  );
}
