/*
 * Collapsible application sidebar with primary navigation, conversation search,
 * pin/rename/delete chat management, JSON chat import, and PWA install button.
 */

import { motion } from 'framer-motion';
import {
  BarChart3,
  BrainCircuit,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Home,
  MessageSquare,
  Mic,
  NotebookPen,
  Pin,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { Z_INDEX } from '../../config/constants';
import { useChatStore } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import type { AppPage } from '../../types';
import { parseImportedChatJson } from '../../utils/exportChat';
import { PWAInstallButton } from '../common/Toast';

const NAV_ITEMS: Array<{ id: AppPage; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'voice', label: 'Voice Mode', icon: Mic },
  { id: 'memory', label: 'Memory Graph', icon: BrainCircuit },
  { id: 'notes', label: 'Notes', icon: NotebookPen },
  { id: 'tasks', label: 'Tasks & Plan', icon: CalendarCheck },
  { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const currentPage = useUiStore((s) => s.currentPage);
  const setPage = useUiStore((s) => s.setPage);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const mobileMenuOpen = useUiStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useUiStore((s) => s.setMobileMenuOpen);
  const addToast = useUiStore((s) => s.addToast);

  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const createChat = useChatStore((s) => s.createChat);
  const selectChat = useChatStore((s) => s.selectChat);
  const togglePinChat = useChatStore((s) => s.togglePinChat);
  const renameChat = useChatStore((s) => s.renameChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const importChat = useChatStore((s) => s.importChat);

  const activePersonaId = useSettingsStore((s) => s.activePersonaId);
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    await createChat(activePersonaId);
    setPage('chat');
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const chat = parseImportedChatJson(text);
      await importChat(chat);
      setPage('chat');
      addToast({
        title: 'Conversation imported',
        description: chat.title,
        variant: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Invalid JSON file',
        variant: 'error',
      });
    }
    e.target.value = '';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Brand + Collapse */}
      <div className="flex items-center justify-between px-1.5 py-1">
        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setPage('home')}
            className="font-display text-lg font-bold tracking-tight text-[var(--nova-text)] whitespace-nowrap cursor-pointer"
          >
            NOVA
          </button>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-slate-500/10 transition-colors nova-accent-ring cursor-pointer"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Primary New Chat CTA */}
      <button
        type="button"
        onClick={() => void handleNewChat()}
        className="w-full min-h-[42px] px-3 rounded-xl nova-btn-primary text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 nova-accent-ring cursor-pointer"
      >
        <Plus className="w-4 h-4 shrink-0" />
        {!sidebarCollapsed && <span>New Chat</span>}
      </button>

      {/* Navigation Links */}
      <nav className="space-y-0.5" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              style={
                active
                  ? {
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }
                  : undefined
              }
              className={`w-full min-h-[40px] px-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors whitespace-nowrap nova-accent-ring cursor-pointer ${
                active
                  ? ''
                  : 'text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-slate-500/8'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Recent Conversations */}
      {!sidebarCollapsed && (
        <div className="flex-1 min-h-0 flex flex-col border-t border-[var(--nova-border)] pt-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-medium text-[var(--nova-text-muted)]">
              Conversations
            </span>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              onChange={(e) => void handleImportFile(e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              title="Import conversation JSON"
              className="p-1 text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats…"
              className="w-full rounded-xl nova-surface pl-8 pr-3 py-1.5 text-xs text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] nova-accent-ring"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
            {filteredChats.map((chat) => {
              const selected = chat.id === activeChatId && currentPage === 'chat';
              return (
                <div
                  key={chat.id}
                  style={
                    selected
                      ? {
                          backgroundColor: 'var(--accent-soft)',
                          borderColor: 'var(--accent-glow)',
                        }
                      : undefined
                  }
                  className={`group flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs transition-colors border border-transparent ${
                    selected
                      ? 'text-[var(--nova-text)] font-medium'
                      : 'text-[var(--nova-text-muted)] hover:bg-slate-500/8 hover:text-[var(--nova-text)]'
                  }`}
                >
                  {renamingId === chat.id ? (
                    <input
                      autoFocus
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onBlur={() => {
                        void renameChat(chat.id, renameDraft);
                        setRenamingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          void renameChat(chat.id, renameDraft);
                          setRenamingId(null);
                        }
                      }}
                      className="flex-1 bg-transparent border-b border-[var(--accent)] focus:outline-none text-[var(--nova-text)]"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        selectChat(chat.id);
                        setPage('chat');
                      }}
                      onDoubleClick={() => {
                        setRenamingId(chat.id);
                        setRenameDraft(chat.title);
                      }}
                      className="flex-1 text-left truncate cursor-pointer"
                    >
                      {chat.title}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void togglePinChat(chat.id)}
                    aria-label={chat.pinned ? 'Unpin chat' : 'Pin chat'}
                    className={`p-1 rounded-md cursor-pointer ${
                      chat.pinned
                        ? 'text-[var(--accent)]'
                        : 'opacity-0 group-hover:opacity-100 hover:text-[var(--nova-text)]'
                    }`}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteChat(chat.id)}
                    aria-label="Delete chat"
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      <div className="pt-2 border-t border-[var(--nova-border)]">
        <PWAInstallButton compact={sidebarCollapsed} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop collapsible sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 264 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ zIndex: Z_INDEX.SIDEBAR }}
        className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 nova-surface border-t-0 border-b-0 border-l-0"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile slide-over drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 md:hidden flex" style={{ zIndex: Z_INDEX.MODAL }}>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="relative z-10 w-72 h-full nova-surface-elevated"
          >
            {sidebarContent}
          </motion.aside>
        </div>
      )}
    </>
  );
}
