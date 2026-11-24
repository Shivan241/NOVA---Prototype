/*
 * Analytics Dashboard presenting usage metrics, tool counts, mood trend, and productivity score.
 */

import { DashboardCharts } from '../components/dashboard/Charts';
import { StatCard } from '../components/dashboard/StatCard';
import { useChatStore } from '../store/chatStore';
import { useMemoryStore } from '../store/memoryStore';

export function DashboardPage() {
  const chats = useChatStore((s) => s.chats);
  const analytics = useMemoryStore((s) => s.analytics);
  const memories = useMemoryStore((s) => s.memories);
  const tasks = useMemoryStore((s) => s.tasks);

  const totalMessages = chats.reduce((acc, c) => acc + c.messages.length, 0);
  const toolCalls = analytics.filter((e) => e.type === 'tool').length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6 pb-24 md:pb-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--nova-text)]">
          Analytics Dashboard
        </h2>
        <p className="text-sm text-[var(--nova-text-muted)]">
          Activity telemetry, tool invocations, mood progression, and task velocity.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Conversations"
          value={chats.length}
          detail="Stored locally in IndexedDB"
        />
        <StatCard
          label="Total Messages"
          value={totalMessages}
          detail="Across all persona modes"
        />
        <StatCard
          label="Tool Invocations"
          value={toolCalls}
          detail="Notes, tasks, weather, search"
        />
        <StatCard
          label="Memory Nodes"
          value={memories.length}
          detail="Long-term personal context"
        />
      </div>

      <DashboardCharts
        analytics={analytics}
        completedTasks={completedTasks}
        totalTasks={tasks.length}
      />
    </div>
  );
}
