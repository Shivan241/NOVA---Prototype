/*
 * Root NOVA application shell coordinating IndexedDB hydration, theme sync,
 * global hotkeys, reminder notifications, page transitions, and layout chrome.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineBanner, ToastContainer } from './components/common/Toast';
import { CommandPalette } from './components/layout/CommandPalette';
import { Header, MobileBottomNav } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { useHotkeys } from './hooks/useHotkeys';
import { useTheme } from './hooks/useTheme';
import { ChatPage } from './pages/Chat';
import { DashboardPage } from './pages/Dashboard';
import { HomePage } from './pages/Home';
import { MemoryPage } from './pages/Memory';
import { NotesPage } from './pages/Notes';
import { SettingsPage } from './pages/Settings';
import { TasksPage } from './pages/Tasks';
import { VoiceModePage } from './pages/VoiceMode';
import { ensureInitialSeedData } from './data/seed';
import { sendBrowserNotification } from './services/notifications';
import { useChatStore } from './store/chatStore';
import { useMemoryStore } from './store/memoryStore';
import { useSettingsStore } from './store/settingsStore';
import { useUiStore } from './store/uiStore';

function NovaShell() {
  useTheme();
  useHotkeys();

  const currentPage = useUiStore((s) => s.currentPage);
  const addToast = useUiStore((s) => s.addToast);
  const hydrateChats = useChatStore((s) => s.hydrateChats);
  const hydrateWorkspace = useMemoryStore((s) => s.hydrateWorkspace);
  const tasks = useMemoryStore((s) => s.tasks);
  const markTaskNotified = useMemoryStore((s) => s.markTaskNotified);
  const notificationsEnabled = useSettingsStore(
    (s) => s.settings.notificationsEnabled
  );

  useEffect(() => {
    let active = true;
    void ensureInitialSeedData().finally(() => {
      if (!active) return;
      void hydrateChats();
      void hydrateWorkspace();
    });
    return () => {
      active = false;
    };
  }, [hydrateChats, hydrateWorkspace]);

  // Task reminder watcher
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      for (const task of tasks) {
        if (
          !task.completed &&
          !task.notified &&
          typeof task.reminderAt === 'number' &&
          task.reminderAt <= now
        ) {
          void markTaskNotified(task.id);
          addToast({
            title: 'Reminder',
            description: task.title,
            variant: 'info',
          });
          if (notificationsEnabled) {
            sendBrowserNotification('NOVA Reminder', task.title);
          }
        }
      }
    };

    checkReminders();
    const timer = setInterval(checkReminders, 15_000);
    return () => clearInterval(timer);
  }, [tasks, notificationsEnabled, markTaskNotified, addToast]);

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatPage />;
      case 'voice':
        return <VoiceModePage />;
      case 'memory':
        return <MemoryPage />;
      case 'notes':
        return <NotesPage />;
      case 'tasks':
        return <TasksPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'settings':
        return <SettingsPage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--nova-bg)] text-[var(--nova-text)] relative overflow-x-hidden">
      {/* Subtle animated ambient background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none nova-ambient-bg z-0"
      />

      <Sidebar />

      <div className="relative z-10 flex-1 flex flex-col min-w-0 min-h-screen">
        <Header />

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {currentPage !== 'voice' && <MobileBottomNav />}
      <CommandPalette />
      <ToastContainer />
      <OfflineBanner />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <NovaShell />
    </ErrorBoundary>
  );
}
