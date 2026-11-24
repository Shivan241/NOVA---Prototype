/*
 * Home overview page featuring the living AI Orb centerpiece, personalized Daily Briefing
 * synthesized from memory and tasks, Persona mode selector, and custom persona builder.
 */

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Mic,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { CardSkeleton } from '../components/common/Skeleton';
import { AIOrb } from '../components/orb/AIOrb';
import { MOOD_PALETTES } from '../config/theme';
import { fetchDailyBriefing } from '../services/gemini/chat';
import { useChatStore } from '../store/chatStore';
import { useMemoryStore } from '../store/memoryStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';
import type { OrbVisualStyle } from '../types';
import { generateId, toDateKey } from '../utils/formatters';

export function HomePage() {
  const setPage = useUiStore((s) => s.setPage);
  const addToast = useUiStore((s) => s.addToast);

  const orbState = useChatStore((s) => s.orbState);
  const currentMood = useChatStore((s) => s.currentMood);
  const micAmplitude = useChatStore((s) => s.micAmplitude);
  const createChat = useChatStore((s) => s.createChat);

  const settings = useSettingsStore((s) => s.settings);
  const activePersonaId = useSettingsStore((s) => s.activePersonaId);
  const setActivePersonaId = useSettingsStore((s) => s.setActivePersonaId);
  const getAllPersonas = useSettingsStore((s) => s.getAllPersonas);
  const getPersonaById = useSettingsStore((s) => s.getPersonaById);
  const addCustomPersona = useSettingsStore((s) => s.addCustomPersona);
  const deleteCustomPersona = useSettingsStore((s) => s.deleteCustomPersona);

  const memories = useMemoryStore((s) => s.memories);
  const tasks = useMemoryStore((s) => s.tasks);
  const toggleTask = useMemoryStore((s) => s.toggleTask);
  const briefing = useMemoryStore((s) => s.briefing);
  const setBriefing = useMemoryStore((s) => s.setBriefing);
  const hydrated = useMemoryStore((s) => s.hydrated);

  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customColor, setCustomColor] = useState('#FF7A1A');
  const [customOrbStyle, setCustomOrbStyle] = useState<OrbVisualStyle>('aurora');

  const activePersona = getPersonaById(activePersonaId);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const todayKey = toDateKey();

  const refreshBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const next = await fetchDailyBriefing({
        userName: settings.userName,
        memories,
        pendingTasks: pendingTasks.map((t) => t.title),
      });
      setBriefing(next);
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    if (hydrated && (!briefing || briefing.dateKey !== todayKey)) {
      void refreshBriefing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const handleCreatePersona = () => {
    if (!customName.trim() || !customPrompt.trim()) return;
    addCustomPersona({
      id: generateId('persona'),
      name: customName.trim(),
      role: customRole.trim() || 'Custom Persona',
      description: 'User-defined NOVA mode',
      systemPrompt: customPrompt.trim(),
      accentColor: customColor,
      secondaryColor: customColor,
      orbStyle: customOrbStyle,
      starterPrompts: [
        'Let us get started with my top priority today.',
        'Help me think through a challenge.',
      ],
      isCustom: true,
    });
    setCustomModalOpen(false);
    setCustomName('');
    setCustomRole('');
    setCustomPrompt('');
    addToast({
      title: 'Custom persona created',
      description: `${customName.trim()} is now active.`,
      variant: 'success',
    });
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6 space-y-8">
      {/* Hero Orb & Daily Briefing Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 nova-surface rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4">
          <AIOrb
            state={orbState}
            mood={currentMood}
            orbStyle={activePersona.orbStyle}
            personaPrimary={activePersona.accentColor}
            personaSecondary={activePersona.secondaryColor}
            micAmplitude={micAmplitude}
            size={186}
            onClick={() => setPage('voice')}
            ariaLabel="Launch Voice Mode"
          />

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[var(--nova-text)] text-balance">
              {activePersona.name}
            </h2>
            <p className="text-xs text-[var(--nova-text-muted)]">
              {activePersona.role}
              <span aria-hidden="true"> · </span>
              Mood: {MOOD_PALETTES[currentMood].label}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <Button
              variant="primary"
              onClick={() => {
                void createChat(activePersona.id).then(() => setPage('chat'));
              }}
            >
              <span>Start Chat</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={() => setPage('voice')}>
              <Mic className="w-4 h-4" />
              <span>Voice Mode</span>
            </Button>
          </div>
        </div>

        {/* Daily Briefing Card */}
        <div className="lg:col-span-7 nova-surface rounded-3xl p-6 flex flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--nova-text-muted)]">
                Daily Briefing · {todayKey}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--nova-text)] text-balance">
                {briefing?.greeting ?? `Hello, ${settings.userName}.`}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void refreshBriefing()}
              disabled={loadingBriefing}
              aria-label="Refresh daily briefing"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl nova-surface-elevated text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingBriefing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {loadingBriefing && !briefing ? (
            <CardSkeleton />
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-[var(--nova-text)]">
                {briefing?.motivationalLine}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--nova-border)]">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[var(--nova-text-muted)]">
                    Focus Summary
                  </p>
                  <p className="text-sm text-[var(--nova-text)]">
                    {briefing?.focusSummary}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[var(--nova-text-muted)]">
                    Learning Suggestion
                  </p>
                  <p className="text-sm text-[var(--nova-text)]">
                    {briefing?.learningSuggestion}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Today's Pending Tasks Preview */}
          <div className="pt-3 border-t border-[var(--nova-border)] space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--nova-text-muted)]">
              <span className="tabular-nums">
                Today&apos;s Tasks ({pendingTasks.length} pending)
              </span>
              <button
                type="button"
                onClick={() => setPage('tasks')}
                className="text-[var(--accent)] hover:underline cursor-pointer"
              >
                Open Planner
              </button>
            </div>
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-[var(--nova-text-muted)]">
                No pending tasks yet. Ask NOVA to create tasks or add them in Tasks &amp; Plan.
              </p>
            ) : (
              <div className="space-y-1.5">
                {pendingTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => void toggleTask(task.id)}
                    className="w-full flex items-center gap-2.5 text-left text-sm py-1.5 px-2 rounded-xl hover:bg-slate-500/8 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[var(--nova-text-muted)] shrink-0" />
                    <span className="truncate flex-1">{task.title}</span>
                    <span className="text-xs text-[var(--nova-text-muted)] capitalize">
                      {task.priority}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Persona Selector Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--nova-text)]">
              Persona Modes
            </h2>
            <p className="text-sm text-[var(--nova-text-muted)]">
              Switch NOVA&apos;s voice, expertise, and orb aura or craft a custom persona.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCustomModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Custom Persona</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getAllPersonas().map((persona) => {
            const active = persona.id === activePersonaId;
            return (
              <motion.div
                key={persona.id}
                whileHover={{ y: -2 }}
                className={`nova-surface rounded-2xl p-5 flex flex-col justify-between gap-3 transition-colors ${
                  active ? 'border-[var(--accent)]' : ''
                }`}
                style={
                  active
                    ? {
                        borderColor: 'var(--accent)',
                        boxShadow: '0 0 0 1px var(--accent-glow)',
                      }
                    : undefined
                }
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-[var(--nova-text)]">
                      {persona.name}
                    </h3>
                    {persona.isCustom && (
                      <button
                        type="button"
                        onClick={() => deleteCustomPersona(persona.id)}
                        aria-label={`Delete ${persona.name}`}
                        className="p-1 text-[var(--nova-text-muted)] hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[var(--nova-text-muted)]">
                    {persona.role} · {persona.orbStyle} orb
                  </p>
                  <p className="text-sm text-[var(--nova-text-muted)] leading-relaxed pt-1">
                    {persona.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--nova-border)]">
                  <button
                    type="button"
                    onClick={() => setActivePersonaId(persona.id)}
                    className={`text-xs font-medium cursor-pointer ${
                      active
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]'
                    }`}
                  >
                    {active ? 'Active Mode' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePersonaId(persona.id);
                      void createChat(persona.id).then(() => setPage('chat'));
                    }}
                    className="text-xs font-medium text-[var(--nova-text)] hover:text-[var(--accent)] cursor-pointer"
                  >
                    Chat now →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <Modal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        title="Create Custom Persona"
        description="Define a specialized prompt, accent hue, and orb style."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Name
            </label>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Philosophy Tutor"
              className="w-full rounded-xl nova-surface px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--nova-text-muted)]">
                Role Subtitle
              </label>
              <input
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Critical Thinker"
                className="w-full rounded-xl nova-surface px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--nova-text-muted)]">
                Orb Style
              </label>
              <select
                value={customOrbStyle}
                onChange={(e) =>
                  setCustomOrbStyle(e.target.value as OrbVisualStyle)
                }
                className="w-full rounded-xl nova-surface px-3 py-2 text-sm text-[var(--nova-text)]"
              >
                {(['aurora', 'pulse', 'prism', 'ember', 'grid', 'nebula'] as OrbVisualStyle[]).map(
                  (style) => (
                    <option key={style} value={style} className="bg-slate-900 text-white">
                      {style}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              Accent Color
            </label>
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="h-9 w-16 rounded-lg cursor-pointer bg-transparent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nova-text-muted)]">
              System Prompt
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              placeholder="Describe how NOVA should think, speak, and guide you…"
              className="w-full rounded-xl nova-surface px-3 py-2 text-sm text-[var(--nova-text)] nova-accent-ring"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setCustomModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePersona}>
              Create Persona
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
