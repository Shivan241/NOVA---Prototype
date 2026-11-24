/*
 * Tasks, browser-notification reminders, and Calendar-style Day Planner timeline.
 */

import { Bell, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/common/Button';
import { requestNotificationPermission } from '../services/notifications';
import { useMemoryStore } from '../store/memoryStore';
import { useUiStore } from '../store/uiStore';
import type { PlannerBlock, TaskPriority } from '../types';
import { formatHourLabel, toDateKey } from '../utils/formatters';

export function TasksPage() {
  const tasks = useMemoryStore((s) => s.tasks);
  const addTask = useMemoryStore((s) => s.addTask);
  const toggleTask = useMemoryStore((s) => s.toggleTask);
  const deleteTask = useMemoryStore((s) => s.deleteTask);

  const plannerBlocks = useMemoryStore((s) => s.plannerBlocks);
  const addPlannerBlock = useMemoryStore((s) => s.addPlannerBlock);
  const togglePlannerBlock = useMemoryStore((s) => s.togglePlannerBlock);
  const deletePlannerBlock = useMemoryStore((s) => s.deletePlannerBlock);

  const addToast = useUiStore((s) => s.addToast);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDue, setTaskDue] = useState(toDateKey());
  const [reminderMinutes, setReminderMinutes] = useState('');

  // Day Planner state
  const [selectedDate, setSelectedDate] = useState(toDateKey());
  const [blockTitle, setBlockTitle] = useState('');
  const [blockStart, setBlockStart] = useState(9);
  const [blockDuration, setBlockDuration] = useState(1);
  const [blockCategory, setBlockCategory] =
    useState<PlannerBlock['category']>('deep-work');

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    const mins = Number(reminderMinutes);
    let reminderAt: number | undefined;
    if (Number.isFinite(mins) && mins > 0) {
      reminderAt = Date.now() + mins * 60_000;
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        addToast({
          title: 'Notification permission needed',
          description: 'Allow browser notifications to receive timed reminders.',
          variant: 'warning',
        });
      }
    }

    await addTask({
      title: taskTitle.trim(),
      priority: taskPriority,
      dueDate: taskDue || undefined,
      reminderAt,
    });
    setTaskTitle('');
    setReminderMinutes('');
  };

  const handleAddBlock = async () => {
    if (!blockTitle.trim()) return;
    await addPlannerBlock({
      title: blockTitle.trim(),
      date: selectedDate,
      startHour: blockStart,
      durationHours: blockDuration,
      category: blockCategory,
    });
    setBlockTitle('');
  };

  const dayBlocks = plannerBlocks.filter((b) => b.date === selectedDate);

  return (
    <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6 pb-24 md:pb-8 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[var(--nova-text)]">
          Tasks &amp; Day Planner
        </h2>
        <p className="text-sm text-[var(--nova-text-muted)]">
          Manage prioritized tasks, browser reminders, and time-blocked schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tasks & Reminders */}
        <section className="lg:col-span-6 nova-surface rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--nova-text)]">
              Tasks &amp; Reminders
            </h3>
            <span className="text-xs text-[var(--nova-text-muted)] tabular-nums">
              {tasks.filter((t) => !t.completed).length} pending
            </span>
          </div>

          <div className="space-y-2.5">
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleAddTask();
              }}
              placeholder="Add a new task…"
              className="w-full rounded-xl nova-surface-elevated px-3 py-2 text-sm text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] nova-accent-ring"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                aria-label="Priority"
                className="rounded-xl nova-surface-elevated px-2.5 py-2 text-xs text-[var(--nova-text)]"
              >
                <option value="low" className="bg-slate-900 text-white">
                  Low priority
                </option>
                <option value="medium" className="bg-slate-900 text-white">
                  Medium priority
                </option>
                <option value="high" className="bg-slate-900 text-white">
                  High priority
                </option>
              </select>
              <input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                aria-label="Due date"
                className="rounded-xl nova-surface-elevated px-2.5 py-2 text-xs text-[var(--nova-text)]"
              />
              <input
                type="number"
                min={1}
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(e.target.value)}
                placeholder="Remind (min)"
                className="rounded-xl nova-surface-elevated px-2.5 py-2 text-xs text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)]"
              />
              <Button variant="primary" size="sm" onClick={() => void handleAddTask()}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </Button>
            </div>
          </div>

          <div className="divide-y divide-[var(--nova-border)]">
            {tasks.length === 0 ? (
              <p className="py-8 text-center text-xs text-[var(--nova-text-muted)]">
                No tasks added yet.
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3 flex items-start justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => void toggleTask(task.id)}
                    className="flex items-start gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[var(--nova-text-muted)] mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          task.completed
                            ? 'line-through text-[var(--nova-text-muted)]'
                            : 'text-[var(--nova-text)]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--nova-text-muted)] flex flex-wrap items-center gap-2">
                        <span className="capitalize">{task.priority}</span>
                        {task.dueDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{task.dueDate}</span>
                          </>
                        )}
                        {task.reminderAt && !task.completed && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-[var(--accent)]">
                              <Bell className="w-3 h-3" />
                              Reminder set
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteTask(task.id)}
                    aria-label="Delete task"
                    className="p-1.5 text-[var(--nova-text-muted)] hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right: Calendar-style Day Planner */}
        <section className="lg:col-span-6 nova-surface rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[var(--nova-text)]">
              Day Planner
            </h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Planner date"
              className="rounded-xl nova-surface-elevated px-3 py-1.5 text-xs text-[var(--nova-text)]"
            />
          </div>

          <div className="space-y-2.5">
            <input
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              placeholder="Schedule a focus block, meeting, or study session…"
              className="w-full rounded-xl nova-surface-elevated px-3 py-2 text-sm text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] nova-accent-ring"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={blockStart}
                onChange={(e) => setBlockStart(Number(e.target.value))}
                aria-label="Start hour"
                className="rounded-xl nova-surface-elevated px-2.5 py-2 text-xs text-[var(--nova-text)]"
              >
                {Array.from({ length: 17 }, (_, i) => i + 6).map((hr) => (
                  <option key={hr} value={hr} className="bg-slate-900 text-white">
                    {formatHourLabel(hr)}
                  </option>
                ))}
              </select>
              <select
                value={blockDuration}
                onChange={(e) => setBlockDuration(Number(e.target.value))}
                aria-label="Duration"
                className="rounded-xl nova-surface-elevated px-2.5 py-2 text-xs text-[var(--nova-text)]"
              >
                {[0.5, 1, 1.5, 2, 3, 4].map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d}h
                  </option>
                ))}
              </select>
              <select
                value={blockCategory}
                onChange={(e) =>
                  setBlockCategory(e.target.value as PlannerBlock['category'])
                }
                aria-label="Block category"
                className="rounded-xl nova-surface-elevated px-2.5 py-2 text-xs text-[var(--nova-text)]"
              >
                <option value="deep-work" className="bg-slate-900 text-white">
                  Deep Work
                </option>
                <option value="learning" className="bg-slate-900 text-white">
                  Learning
                </option>
                <option value="meeting" className="bg-slate-900 text-white">
                  Meeting
                </option>
                <option value="personal" className="bg-slate-900 text-white">
                  Personal
                </option>
              </select>
              <Button variant="primary" size="sm" onClick={() => void handleAddBlock()}>
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2.5">
            {dayBlocks.length === 0 ? (
              <p className="py-8 text-center text-xs text-[var(--nova-text-muted)]">
                No time blocks scheduled for {selectedDate}. Ask NOVA to plan your day or add a block above.
              </p>
            ) : (
              dayBlocks.map((block) => (
                <div
                  key={block.id}
                  className="nova-surface-elevated rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => void togglePlannerBlock(block.id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="font-mono text-xs tabular-nums text-[var(--accent)] w-20 shrink-0">
                      {formatHourLabel(block.startHour)}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          block.completed
                            ? 'line-through text-[var(--nova-text-muted)]'
                            : 'text-[var(--nova-text)]'
                        }`}
                      >
                        {block.title}
                      </p>
                      <p className="text-xs text-[var(--nova-text-muted)] capitalize">
                        {block.category.replace('-', ' ')} · {block.durationHours}h
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePlannerBlock(block.id)}
                    aria-label="Delete block"
                    className="p-1.5 text-[var(--nova-text-muted)] hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
