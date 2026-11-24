/*
 * Three-zone Top Header Bar and ergonomic Mobile Bottom Navigation Bar
 * using central orange accent tokens and Z_INDEX constants.
 */

import {
  BrainCircuit,
  Command,
  Home,
  Menu,
  MessageSquare,
  Mic,
  Plus,
} from 'lucide-react';
import { Z_INDEX } from '../../config/constants';
import { useChatStore } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import type { AppPage } from '../../types';

const PAGE_TITLES: Record<AppPage, string> = {
  home: 'Overview',
  chat: 'Conversation',
  voice: 'Voice Mode',
  memory: 'Memory Graph',
  notes: 'Notes',
  tasks: 'Tasks & Planner',
  dashboard: 'Analytics',
  settings: 'Settings',
};

export function Header() {
  const currentPage = useUiStore((s) => s.currentPage);
  const setPage = useUiStore((s) => s.setPage);
  const setMobileMenuOpen = useUiStore((s) => s.setMobileMenuOpen);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);

  const createChat = useChatStore((s) => s.createChat);
  const activePersonaId = useSettingsStore((s) => s.activePersonaId);

  return (
    <header
      style={{ zIndex: Z_INDEX.HEADER }}
      className="sticky top-0 h-14 px-4 md:px-6 flex items-center justify-between gap-8 border-b border-[var(--nova-border)] bg-[var(--nova-bg)]/80 backdrop-blur-md"
    >
      {/* Zone 1: Brand / Mobile menu + Current page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[var(--nova-text)] hover:bg-slate-500/10 nova-accent-ring cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-[var(--nova-text)] whitespace-nowrap truncate">
          {PAGE_TITLES[currentPage]}
        </h1>
      </div>

      {/* Zone 2: Concise single-line workspace nav links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--nova-text-muted)]">
        {(
          [
            ['home', 'Home'],
            ['chat', 'Chat'],
            ['memory', 'Memory'],
            ['tasks', 'Planner'],
            ['dashboard', 'Analytics'],
          ] as Array<[AppPage, string]>
        ).map(([page, label]) => (
          <button
            key={page}
            type="button"
            onClick={() => setPage(page)}
            style={
              currentPage === page
                ? { textDecorationColor: 'var(--accent)' }
                : undefined
            }
            className={`whitespace-nowrap shrink-0 transition-colors nova-accent-ring rounded-md px-1 cursor-pointer ${
              currentPage === page
                ? 'text-[var(--nova-text)] underline underline-offset-8 decoration-2'
                : 'hover:text-[var(--nova-text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Zone 3: Command Palette & Quick New Chat action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Open command palette"
          className="min-h-[38px] px-3 rounded-xl nova-surface text-xs font-medium text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] flex items-center gap-2 whitespace-nowrap shrink-0 nova-accent-ring cursor-pointer"
        >
          <Command className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quick Actions</span>
          <kbd className="hidden sm:inline font-mono text-[11px] opacity-70">
            Ctrl+K
          </kbd>
        </button>
        <button
          type="button"
          onClick={() => {
            void createChat(activePersonaId).then(() => setPage('chat'));
          }}
          className="min-h-[38px] px-3.5 rounded-xl nova-btn-primary text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 nova-accent-ring cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const currentPage = useUiStore((s) => s.currentPage);
  const setPage = useUiStore((s) => s.setPage);

  const items: Array<{ id: AppPage; label: string; icon: typeof Home }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'memory', label: 'Memory', icon: BrainCircuit },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      style={{ zIndex: Z_INDEX.MOBILE_NAV }}
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 grid grid-cols-4 items-center border-t border-[var(--nova-border)] bg-[var(--nova-surface)]/95 backdrop-blur-md"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentPage === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setPage(item.id)}
            style={active ? { color: 'var(--accent)' } : undefined}
            className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium cursor-pointer ${
              active ? '' : 'text-[var(--nova-text-muted)]'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
