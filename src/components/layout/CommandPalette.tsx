/*
 * Keyboard-accessible Command Palette (Ctrl/Cmd + K) for rapid navigation,
 * persona switching, theme toggling, and chat creation.
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  BrainCircuit,
  CalendarCheck,
  MessageSquare,
  Mic,
  NotebookPen,
  Palette,
  Plus,
  Search,
  Settings,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { THEME_OPTIONS } from '../../config/theme';
import { useChatStore } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';

interface PaletteAction {
  id: string;
  label: string;
  group: string;
  icon: typeof Search;
  run: () => void;
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const setPage = useUiStore((s) => s.setPage);
  const addToast = useUiStore((s) => s.addToast);

  const createChat = useChatStore((s) => s.createChat);
  const getAllPersonas = useSettingsStore((s) => s.getAllPersonas);
  const activePersonaId = useSettingsStore((s) => s.activePersonaId);
  const setActivePersonaId = useSettingsStore((s) => s.setActivePersonaId);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const actions: PaletteAction[] = [
    {
      id: 'new-chat',
      label: 'Start New Conversation',
      group: 'Actions',
      icon: Plus,
      run: () => {
        void createChat(activePersonaId).then(() => setPage('chat'));
      },
    },
    {
      id: 'nav-voice',
      label: 'Enter Hands-Free Voice Mode',
      group: 'Navigation',
      icon: Mic,
      run: () => setPage('voice'),
    },
    {
      id: 'nav-chat',
      label: 'Open Chat Workspace',
      group: 'Navigation',
      icon: MessageSquare,
      run: () => setPage('chat'),
    },
    {
      id: 'nav-memory',
      label: 'Open Memory Graph',
      group: 'Navigation',
      icon: BrainCircuit,
      run: () => setPage('memory'),
    },
    {
      id: 'nav-notes',
      label: 'Open Notes',
      group: 'Navigation',
      icon: NotebookPen,
      run: () => setPage('notes'),
    },
    {
      id: 'nav-tasks',
      label: 'Open Tasks & Day Planner',
      group: 'Navigation',
      icon: CalendarCheck,
      run: () => setPage('tasks'),
    },
    {
      id: 'nav-dashboard',
      label: 'Open Analytics Dashboard',
      group: 'Navigation',
      icon: BarChart3,
      run: () => setPage('dashboard'),
    },
    {
      id: 'nav-settings',
      label: 'Open Settings',
      group: 'Navigation',
      icon: Settings,
      run: () => setPage('settings'),
    },
    ...getAllPersonas().map((persona) => ({
      id: `persona-${persona.id}`,
      label: `Switch Persona: ${persona.name}`,
      group: 'Personas',
      icon: UserCircle2,
      run: () => {
        setActivePersonaId(persona.id);
        addToast({
          title: `Persona switched to ${persona.name}`,
          description: persona.role,
          variant: 'info',
        });
      },
    })),
    ...THEME_OPTIONS.map((t) => ({
      id: `theme-${t.id}`,
      label: `Theme: ${t.label}`,
      group: 'Appearance',
      icon: Palette,
      run: () => updateSettings({ theme: t.id }),
    })),
  ];

  const filtered = actions.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.group.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="relative z-10 w-full max-w-lg nova-surface-elevated rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--nova-border)]">
              <Search className="w-4 h-4 text-[var(--nova-text-muted)]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command, persona, theme, or page…"
                className="flex-1 bg-transparent text-sm text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] focus:outline-none"
              />
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--nova-text-muted)]">
                  No matching commands.
                </p>
              ) : (
                filtered.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        action.run();
                        setOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--nova-text)] hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 text-[var(--accent)] shrink-0" />
                        <span className="truncate">{action.label}</span>
                      </div>
                      <span className="text-xs text-[var(--nova-text-muted)] shrink-0">
                        {action.group}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
