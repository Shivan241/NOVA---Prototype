/*
 * Global keyboard shortcuts hook (Cmd/Ctrl+K Command Palette, Cmd/Ctrl+N New Chat, Esc close).
 */

import { useEffect } from 'react';
import { DEFAULT_HOTKEYS } from '../config/constants';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';

export function useHotkeys() {
  const commandPaletteOpen = useUiStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const setPage = useUiStore((s) => s.setPage);
  const createChat = useChatStore((s) => s.createChat);
  const activePersonaId = useSettingsStore((s) => s.activePersonaId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === DEFAULT_HOTKEYS.COMMAND_PALETTE) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      if (mod && e.key.toLowerCase() === DEFAULT_HOTKEYS.NEW_CHAT) {
        e.preventDefault();
        void createChat(activePersonaId).then(() => setPage('chat'));
        return;
      }

      if (mod && e.key.toLowerCase() === DEFAULT_HOTKEYS.VOICE_MODE) {
        e.preventDefault();
        setPage('voice');
        return;
      }

      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    commandPaletteOpen,
    setCommandPaletteOpen,
    setPage,
    createChat,
    activePersonaId,
  ]);
}
