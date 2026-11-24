/*
 * Recharts analytics visualizations for daily usage, tool invocations,
 * mood trends, and computed productivity score.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsEvent, Mood } from '../../types';
import { toDateKey } from '../../utils/formatters';

interface ChartsProps {
  analytics: AnalyticsEvent[];
  completedTasks: number;
  totalTasks: number;
}

const MOOD_SCORE: Record<Mood, number> = {
  excited: 5,
  focused: 4,
  calm: 4,
  neutral: 3,
  sad: 2,
};

const MOOD_COLORS: Record<Mood, string> = {
  calm: '#3B82F6',
  excited: '#F97316',
  focused: '#10B981',
  sad: '#8B5CF6',
  neutral: '#0EA5E9',
};

export function DashboardCharts({
  analytics,
  completedTasks,
  totalTasks,
}: ChartsProps) {
  // Build last 14 days series
  const days = Array.from({ length: 14 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - idx));
    const key = toDateKey(d);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayEvents = analytics.filter((e) => e.dateKey === key);
    const messages = dayEvents.filter((e) => e.type === 'message').length;
    const tools = dayEvents.filter((e) => e.type === 'tool').length;
    const moodEvents = dayEvents.filter((e) => e.mood);
    const avgMood =
      moodEvents.length > 0
        ? Number(
            (
              moodEvents.reduce(
                (acc, e) => acc + MOOD_SCORE[e.mood ?? 'neutral'],
                0
              ) / moodEvents.length
            ).toFixed(2)
          )
        : 3.5;

    return { label, messages, tools, avgMood };
  });

  // Tool usage aggregation
  const toolCountsMap = new Map<string, number>();
  for (const evt of analytics) {
    if (evt.type === 'tool' && evt.toolName) {
      toolCountsMap.set(
        evt.toolName,
        (toolCountsMap.get(evt.toolName) ?? 0) + 1
      );
    }
  }
  const toolData = Array.from(toolCountsMap.entries()).map(([name, count]) => ({
    name: name.replace(/_/g, ' '),
    count,
  }));

  // Mood distribution
  const moodMap = new Map<Mood, number>();
  for (const evt of analytics) {
    if (evt.mood) {
      moodMap.set(evt.mood, (moodMap.get(evt.mood) ?? 0) + 1);
    }
  }
  const moodDistribution = Array.from(moodMap.entries()).map(([mood, count]) => ({
    name: mood,
    value: count,
    color: MOOD_COLORS[mood],
  }));

  const completionRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const productivityScore = Math.min(
    100,
    Math.round(completionRatio * 65 + Math.min(35, analytics.length * 2))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Daily Activity Area Chart */}
      <div className="nova-surface rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--nova-text)]">
            Usage Per Day
          </h3>
          <p className="text-xs text-[var(--nova-text-muted)]">
            Messages and tool calls over the past 14 days
          </p>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="messages"
                name="Messages"
                stroke="#FF7A1A"
                fill="#FF7A1A"
                fillOpacity={0.24}
              />
              <Area
                type="monotone"
                dataKey="tools"
                name="Tool Calls"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.18}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tool Usage Bar Chart */}
      <div className="nova-surface rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--nova-text)]">
            Tool Usage Breakdown
          </h3>
          <p className="text-xs text-[var(--nova-text-muted)]">
            Gemini function calls executed in your workspace
          </p>
        </div>
        <div className="h-60 w-full">
          {toolData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[var(--nova-text-muted)]">
              Ask NOVA to check weather, create tasks, save notes, or calculate math to populate tool analytics.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Invocations" fill="#FF7A1A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Mood Trend Line Chart */}
      <div className="nova-surface rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--nova-text)]">
            Mood Trend
          </h3>
          <p className="text-xs text-[var(--nova-text-muted)]">
            Average conversational energy index (1–5 scale)
          </p>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="avgMood"
                name="Mood Index"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8B5CF6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Productivity & Mood Mix */}
      <div className="nova-surface rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--nova-text)]">
            Productivity & Tone Balance
          </h3>
          <p className="text-xs text-[var(--nova-text-muted)]">
            Computed from task completion rate and active sessions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-auto py-3">
          <div className="space-y-2">
            <p className="text-xs text-[var(--nova-text-muted)]">
              Productivity Score
            </p>
            <p className="text-4xl font-bold tabular-nums text-[var(--nova-text)]">
              {productivityScore}
              <span className="text-base font-normal text-[var(--nova-text-muted)]">
                /100
              </span>
            </p>
            <p className="text-xs text-[var(--nova-text-muted)] tabular-nums">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </div>

          <div className="h-44 w-full">
            {moodDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[var(--nova-text-muted)]">
                Send messages to chart mood balance.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={3}
                  >
                    {moodDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
