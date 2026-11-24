/*
 * Toast notification stack, offline connectivity banner, and in-app PWA install prompt.
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  WifiOff,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useOnlineStatus, usePWAInstall } from '../../hooks/useOnlineStatus';
import { useUiStore } from '../../store/uiStore';
import { Modal } from './Modal';

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  return (
    <div
      className="fixed bottom-20 md:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon =
            toast.variant === 'error'
              ? AlertCircle
              : toast.variant === 'success'
                ? CheckCircle2
                : Info;
          const accent =
            toast.variant === 'error'
              ? 'text-rose-500'
              : toast.variant === 'success'
                ? 'text-emerald-500'
                : toast.variant === 'warning'
                  ? 'text-amber-500'
                  : 'text-[var(--accent)]';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="pointer-events-auto nova-surface-elevated rounded-xl p-3.5 shadow-lg flex items-start gap-3"
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${accent}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--nova-text)]">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="mt-0.5 text-xs text-[var(--nova-text-muted)] line-clamp-2">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline mode — local notes, tasks, and memories remain available.</span>
    </div>
  );
}

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="w-full flex items-center justify-center gap-2 rounded-xl nova-btn-primary px-3 py-2 text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        {!compact && <span>Install NOVA App</span>}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl nova-surface px-3 py-2 text-xs font-medium text-[var(--nova-text)] hover:bg-slate-500/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          {!compact && <span>Install on iOS</span>}
        </button>
        <Modal
          open={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          title="Install NOVA on iPhone / iPad"
        >
          <ol className="space-y-2 text-sm text-[var(--nova-text-muted)] list-decimal list-inside">
            <li>Tap the Share button in the Safari toolbar.</li>
            <li>Scroll down and tap Add to Home Screen.</li>
            <li>Launch NOVA anytime from your home screen.</li>
          </ol>
        </Modal>
      </>
    );
  }

  return null;
}
