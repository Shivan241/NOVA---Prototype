/*
 * Main conversational workspace containing the scrollable message timeline,
 * fixed desktop ControlBar beside Export, fixed mobile ControlBar above InputBar,
 * persona starter prompts, inline streaming/error messages, and input bar.
 */

import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CONTROL_BAR } from '../../config/constants';
import { useChat } from '../../hooks/useChat';
import { useVoice } from '../../hooks/useVoice';
import { useChatStore } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import type { Attachment } from '../../types';
import {
  exportChatAsJson,
  exportChatAsMarkdown,
  exportChatAsPdf,
} from '../../utils/exportChat';
import { ControlBar } from '../layout/ControlBar';
import { AIOrb } from '../orb/AIOrb';
import { InputBar } from './InputBar';
import { MessageBubble } from './MessageBubble';

export function ChatWindow() {
  const {
    activeChat,
    isStreaming,
    sendMessage,
    stopGeneration,
    regenerateFromMessage,
    editAndResendMessage,
    deleteMessage,
  } = useChat();

  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    speak,
  } = useVoice();

  const orbState = useChatStore((s) => s.orbState);
  const currentMood = useChatStore((s) => s.currentMood);
  const micAmplitude = useChatStore((s) => s.micAmplitude);
  const activeToolName = useChatStore((s) => s.activeToolName);

  const settings = useSettingsStore((s) => s.settings);
  const activePersonaId = useSettingsStore((s) => s.activePersonaId);
  const getPersonaById = useSettingsStore((s) => s.getPersonaById);
  const getAllPersonas = useSettingsStore((s) => s.getAllPersonas);
  const setActivePersonaId = useSettingsStore((s) => s.setActivePersonaId);
  const setChatPersona = useChatStore((s) => s.setChatPersona);
  const setPage = useUiStore((s) => s.setPage);

  const [searchEnabled, setSearchEnabled] = useState(
    settings.searchGroundingDefault
  );
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const activePersona = getPersonaById(
    activeChat?.personaId ?? activePersonaId
  );

  const lastMessageContent =
    activeChat?.messages[activeChat.messages.length - 1]?.content ?? '';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages.length, lastMessageContent]);

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      void startListening((finalText) => {
        void sendMessage(finalText, { enableSearch: searchEnabled });
      });
    }
  };

  const handleSend = (text: string, attachments: Attachment[]) => {
    void sendMessage(text, { attachments, enableSearch: searchEnabled });
  };

  const handlePersonaChange = (personaId: string) => {
    setActivePersonaId(personaId);
    if (activeChat) {
      void setChatPersona(activeChat.id, personaId);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full px-4 md:px-6 pb-4">
      {/* Compact Persona, Fixed ControlBar (Desktop) & Export Toolbar */}
      <div className="flex items-center justify-between gap-3 py-3 border-b border-[var(--nova-border)]">
        <div className="flex items-center gap-3 min-w-0">
          <AIOrb
            state={orbState}
            mood={currentMood}
            orbStyle={activePersona.orbStyle}
            personaPrimary={activePersona.accentColor}
            personaSecondary={activePersona.secondaryColor}
            micAmplitude={micAmplitude}
            size={44}
          />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate text-[var(--nova-text)]">
              {activeChat?.title ?? 'New Conversation'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[var(--nova-text-muted)]">
              <select
                value={activePersona.id}
                onChange={(e) => handlePersonaChange(e.target.value)}
                aria-label="Active persona mode"
                className="bg-transparent font-medium text-[var(--nova-text)] focus:outline-none cursor-pointer"
              >
                {getAllPersonas().map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
              <span aria-hidden="true">·</span>
              <span className="truncate">{activePersona.role}</span>
            </div>
          </div>
        </div>

        {/* Fixed-position Desktop ControlBar + Export Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex">
            <ControlBar />
          </div>

          {activeChat && activeChat.messages.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setExportMenuOpen((v) => !v)}
                className={`${CONTROL_BAR.HEIGHT_CLASS} px-3 flex items-center gap-1.5 rounded-xl nova-surface text-xs font-medium text-[var(--nova-text)] hover:bg-slate-500/10 whitespace-nowrap shrink-0 nova-accent-ring cursor-pointer`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-40 nova-surface-elevated rounded-xl shadow-xl py-1 z-20 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      exportChatAsMarkdown(activeChat);
                      setExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-500/10 cursor-pointer"
                  >
                    Markdown (.md)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportChatAsJson(activeChat);
                      setExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-500/10 cursor-pointer"
                  >
                    JSON (.json)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportChatAsPdf(activeChat);
                      setExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-500/10 cursor-pointer"
                  >
                    PDF Document (.pdf)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto py-5 space-y-5">
        {!activeChat || activeChat.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
            <AIOrb
              state={orbState}
              mood={currentMood}
              orbStyle={activePersona.orbStyle}
              personaPrimary={activePersona.accentColor}
              personaSecondary={activePersona.secondaryColor}
              micAmplitude={micAmplitude}
              size={148}
            />
            <h3 className="mt-5 text-xl font-semibold text-[var(--nova-text)]">
              {activePersona.name} Mode
            </h3>
            <p className="mt-1.5 max-w-md text-sm text-[var(--nova-text-muted)]">
              {activePersona.description}
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl w-full">
              {activePersona.starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() =>
                    void sendMessage(prompt, { enableSearch: searchEnabled })
                  }
                  className="nova-surface rounded-xl p-3.5 text-left text-xs text-[var(--nova-text)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          activeChat.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              activeToolName={activeToolName}
              onEdit={(id, val) => void editAndResendMessage(id, val)}
              onRegenerate={(id) => void regenerateFromMessage(id)}
              onDelete={(id) => void deleteMessage(id)}
              onSpeak={(val) => speak(val)}
              onOpenSettings={() => setPage('settings')}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Mobile Fixed ControlBar Row Directly Above InputBar */}
      <div className="md:hidden pb-2 flex items-center justify-between">
        <ControlBar compact />
      </div>

      {/* Input Bar */}
      <InputBar
        isStreaming={isStreaming}
        isListening={isListening}
        micAmplitude={micAmplitude}
        interimTranscript={interimTranscript}
        searchEnabled={searchEnabled}
        onToggleSearch={() => setSearchEnabled((v) => !v)}
        onToggleVoice={handleToggleVoice}
        onSend={handleSend}
        onStop={stopGeneration}
      />
    </div>
  );
}
