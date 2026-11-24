/*
 * Application Settings page for configuring model, reasoning depth, creativity,
 * speech language & TTS voice picker, theme, animation intensity, notifications, and data wipe.
 */

import {
  Activity,
  Database,
  ShieldCheck,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { PWAInstallButton } from '../components/common/Toast';
import { GEMINI_MODELS, THINKING_DEPTH_OPTIONS } from '../config/models';
import { THEME_OPTIONS } from '../config/theme';
import { clearDemoData, loadDemoData } from '../data/seed';
import { useVoice } from '../hooks/useVoice';
import { testGeminiEndpoint } from '../services/gemini/chat';
import { requestNotificationPermission } from '../services/notifications';
import { clearAllIndexedDBData } from '../services/storage/db';
import { useChatStore } from '../store/chatStore';
import { useMemoryStore } from '../store/memoryStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';
import type {
  AnimationIntensity,
  GeminiModelId,
  SpeechLanguage,
  ThinkingDepth,
} from '../types';

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetAllSettings = useSettingsStore((s) => s.resetAllSettings);
  const clearChatsState = useChatStore((s) => s.clearChatsState);
  const hydrateChats = useChatStore((s) => s.hydrateChats);
  const clearWorkspaceMemoryState = useMemoryStore(
    (s) => s.clearWorkspaceMemoryState
  );
  const hydrateWorkspace = useMemoryStore((s) => s.hydrateWorkspace);
  const addToast = useUiStore((s) => s.addToast);

  const { voices, speak } = useVoice();
  const [wipeOpen, setWipeOpen] = useState(false);
  const [serverReady, setServerReady] = useState<boolean | null>(null);
  const [testingConn, setTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data: { geminiConfigured?: boolean }) =>
        setServerReady(Boolean(data.geminiConfigured))
      )
      .catch(() => setServerReady(false));
  }, []);

  const handleTestConnection = async () => {
    setTestingConn(true);
    setTestResult(null);
    const res = await testGeminiEndpoint(settings.model);
    setTestingConn(false);
    if (res.ok) {
      const msg = `Connected to ${res.model} (${res.latencyMs ?? 0} ms)${res.reply ? ` — "${res.reply}"` : ''}`;
      setTestResult({ ok: true, message: msg });
      addToast({
        title: 'Gemini connection healthy',
        description: `${res.model} responded in ${res.latencyMs ?? 0} ms.`,
        variant: 'success',
      });
    } else {
      const errMsg = res.error || 'Connection test failed.';
      setTestResult({ ok: false, message: errMsg });
      addToast({
        title: 'Gemini connection failed',
        description: errMsg,
        variant: 'error',
      });
    }
  };

  const handleLoadDemoData = async () => {
    setDemoBusy(true);
    try {
      await loadDemoData();
      await Promise.all([hydrateChats(), hydrateWorkspace()]);
      addToast({
        title: 'Demo data loaded',
        description:
          'Starter memories, notes, tasks, planner blocks, sample chats, and analytics added.',
        variant: 'success',
      });
    } finally {
      setDemoBusy(false);
    }
  };

  const handleClearDemoData = async () => {
    setDemoBusy(true);
    try {
      await clearDemoData();
      await Promise.all([hydrateChats(), hydrateWorkspace()]);
      addToast({
        title: 'Demo data cleared',
        description: 'Sample records removed while preserving your own items.',
        variant: 'info',
      });
    } finally {
      setDemoBusy(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const perm = await requestNotificationPermission();
      updateSettings({ notificationsEnabled: perm === 'granted' });
      if (perm !== 'granted') {
        addToast({
          title: 'Permission blocked',
          description: 'Enable browser notifications in site settings.',
          variant: 'warning',
        });
      }
    } else {
      updateSettings({ notificationsEnabled: false });
    }
  };

  const handleWipeAllData = async () => {
    await clearAllIndexedDBData();
    clearChatsState();
    clearWorkspaceMemoryState();
    resetAllSettings();
    setWipeOpen(false);
    addToast({
      title: 'All local data wiped',
      description: 'Conversations, memories, notes, tasks, and preferences reset.',
      variant: 'success',
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-6 pb-24 md:pb-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--nova-text)]">
          Settings
        </h2>
        <p className="text-sm text-[var(--nova-text-muted)]">
          Personalize NOVA&apos;s intelligence, voice, visual atmosphere, and local storage.
        </p>
      </div>

      {/* Server Gemini Connection Info + Live Test */}
      <section className="nova-surface rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[var(--accent)] mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--nova-text)]">
                Server-Managed Gemini Connection
              </h3>
              <p className="text-xs text-[var(--nova-text-muted)] mt-0.5">
                {serverReady === null
                  ? 'Checking server readiness…'
                  : serverReady
                    ? 'Connected via AI Studio server environment secrets.'
                    : 'Gemini API secret not detected in environment. Check Secrets panel.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={testingConn}
              onClick={() => void handleTestConnection()}
            >
              <Activity className={`w-3.5 h-3.5 ${testingConn ? 'animate-pulse' : ''}`} />
              <span>{testingConn ? 'Testing…' : 'Test Connection'}</span>
            </Button>
            <PWAInstallButton />
          </div>
        </div>

        {testResult && (
          <div
            className={`rounded-xl px-3.5 py-2.5 text-xs border ${
              testResult.ok
                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/35 bg-rose-500/10 text-rose-300'
            }`}
          >
            {testResult.message}
          </div>
        )}
      </section>

      {/* Profile & Intelligence */}
      <section className="nova-surface rounded-2xl p-5 space-y-5">
        <h3 className="text-base font-semibold text-[var(--nova-text)]">
          Profile &amp; Model
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Your Name
            </label>
            <input
              value={settings.userName}
              onChange={(e) => updateSettings({ userName: e.target.value })}
              placeholder="Explorer"
              className="w-full rounded-xl nova-surface-elevated px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Gemini Model
            </label>
            <select
              value={settings.model}
              onChange={(e) =>
                updateSettings({ model: e.target.value as GeminiModelId })
              }
              className="w-full rounded-xl nova-surface-elevated px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Reasoning Depth
            </label>
            <select
              value={settings.thinkingDepth}
              onChange={(e) =>
                updateSettings({ thinkingDepth: e.target.value as ThinkingDepth })
              }
              className="w-full rounded-xl nova-surface-elevated px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
            >
              {THINKING_DEPTH_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-slate-900 text-white"
                >
                  {opt.label} — {opt.summary}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--nova-text-muted)]">
                Response Creativity (Temperature)
              </span>
              <span className="font-mono tabular-nums text-[var(--nova-text)]">
                {settings.creativity.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.creativity}
              onChange={(e) =>
                updateSettings({ creativity: Number(e.target.value) })
              }
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 pt-2 border-t border-[var(--nova-border)] cursor-pointer">
          <div>
            <p className="text-sm font-medium text-[var(--nova-text)]">
              Enable Google Search Grounding by Default
            </p>
            <p className="text-xs text-[var(--nova-text-muted)]">
              Include live web citations automatically on new conversations.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.searchGroundingDefault}
            onChange={(e) =>
              updateSettings({ searchGroundingDefault: e.target.checked })
            }
            className="h-4 w-4 accent-[var(--accent)]"
          />
        </label>
      </section>

      {/* Voice & Language */}
      <section className="nova-surface rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-semibold text-[var(--nova-text)]">
          Voice &amp; Language
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Preferred Language
            </label>
            <select
              value={settings.language}
              onChange={(e) =>
                updateSettings({ language: e.target.value as SpeechLanguage })
              }
              className="w-full rounded-xl nova-surface-elevated px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
            >
              <option value="hinglish" className="bg-slate-900 text-white">
                Hinglish
              </option>
              <option value="hi-IN" className="bg-slate-900 text-white">
                Hindi (हिन्दी)
              </option>
              <option value="en-IN" className="bg-slate-900 text-white">
                English (India)
              </option>
              <option value="en-US" className="bg-slate-900 text-white">
                English (US)
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Speech Voice Picker
            </label>
            <div className="flex gap-2">
              <select
                value={settings.voiceURI}
                onChange={(e) => updateSettings({ voiceURI: e.target.value })}
                className="flex-1 min-w-0 rounded-xl nova-surface-elevated px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
              >
                <option value="" className="bg-slate-900 text-white">
                  Auto-match language
                </option>
                {voices.map((v) => (
                  <option
                    key={v.voiceURI}
                    value={v.voiceURI}
                    className="bg-slate-900 text-white"
                  >
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  speak('Hello, I am NOVA, your personal assistant.')
                }
                aria-label="Test voice"
                className="min-h-[38px] px-3 rounded-xl nova-surface-elevated text-[var(--nova-text)] hover:bg-slate-500/15 nova-accent-ring cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 pt-2 border-t border-[var(--nova-border)] cursor-pointer">
          <div>
            <p className="text-sm font-medium text-[var(--nova-text)]">
              Hands-Free / Auto-Speak Replies
            </p>
            <p className="text-xs text-[var(--nova-text-muted)]">
              Read NOVA&apos;s responses aloud automatically in Chat and Voice Mode.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.ttsEnabled || settings.handsFree}
            onChange={(e) =>
              updateSettings({
                ttsEnabled: e.target.checked,
                handsFree: e.target.checked,
              })
            }
            className="h-4 w-4 accent-[var(--accent)]"
          />
        </label>
      </section>

      {/* Appearance & Motion */}
      <section className="nova-surface rounded-2xl p-5 space-y-5">
        <h3 className="text-base font-semibold text-[var(--nova-text)]">
          Theme &amp; Motion
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEME_OPTIONS.map((t) => {
            const active = settings.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => updateSettings({ theme: t.id })}
                style={
                  active
                    ? {
                        borderColor: 'var(--accent)',
                        backgroundColor: 'var(--accent-soft)',
                      }
                    : undefined
                }
                className={`rounded-xl p-3 text-left border transition-colors nova-accent-ring cursor-pointer ${
                  active
                    ? 'text-[var(--nova-text)]'
                    : 'nova-surface-elevated text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]'
                }`}
              >
                <p className="text-xs font-semibold">{t.label}</p>
                <p className="mt-1 text-[11px] opacity-80">{t.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--nova-border)]">
          <div>
            <p className="text-sm font-medium text-[var(--nova-text)]">
              Animation Intensity
            </p>
            <p className="text-xs text-[var(--nova-text-muted)]">
              Automatically adapts when system prefers-reduced-motion is enabled.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 nova-surface-elevated rounded-xl">
            {(['low', 'medium', 'high'] as AnimationIntensity[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => updateSettings({ animationIntensity: lvl })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize cursor-pointer ${
                  settings.animationIntensity === lvl
                    ? 'nova-btn-primary'
                    : 'text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 pt-2 border-t border-[var(--nova-border)] cursor-pointer">
          <div>
            <p className="text-sm font-medium text-[var(--nova-text)]">
              Browser Task Notifications
            </p>
            <p className="text-xs text-[var(--nova-text-muted)]">
              Deliver desktop reminders when scheduled tasks are due.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={() => void handleToggleNotifications()}
            className="h-4 w-4 accent-[var(--accent)]"
          />
        </label>
      </section>

      {/* Demo Data Management */}
      <section className="nova-surface rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-[var(--accent)] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-[var(--nova-text)]">
              Starter Demo Data
            </h3>
            <p className="text-xs text-[var(--nova-text-muted)] mt-0.5">
              Populate realistic sample memories, notes, tasks, chats, and 14-day analytics, or clear demo entries without touching your own data.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            disabled={demoBusy}
            onClick={() => void handleLoadDemoData()}
          >
            {demoBusy ? 'Loading…' : 'Load Demo Data'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={demoBusy}
            onClick={() => void handleClearDemoData()}
          >
            Clear Demo Data
          </Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="nova-surface rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-rose-500">
            Reset &amp; Wipe Local Data
          </h3>
          <p className="text-xs text-[var(--nova-text-muted)] mt-0.5">
            Permanently remove all IndexedDB chats, memories, notes, tasks, and custom personas.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setWipeOpen(true)}>
          <Trash2 className="w-4 h-4" />
          <span>Wipe All Data</span>
        </Button>
      </section>

      <Modal
        open={wipeOpen}
        onClose={() => setWipeOpen(false)}
        title="Confirm Data Wipe"
        description="This permanently erases all local NOVA data on this browser."
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => setWipeOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void handleWipeAllData()}>
            Confirm Wipe
          </Button>
        </div>
      </Modal>
    </div>
  );
}
