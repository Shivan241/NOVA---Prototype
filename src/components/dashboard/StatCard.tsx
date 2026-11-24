/*
 * Tabular statistic KPI card for the Analytics Dashboard.
 */

interface StatCardProps {
  label: string;
  value: string | number;
  detail: string;
}

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="nova-surface rounded-2xl p-5 space-y-1.5">
      <p className="text-xs font-medium text-[var(--nova-text-muted)]">{label}</p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums text-[var(--nova-text)]">
        {value}
      </p>
      <p className="text-xs text-[var(--nova-text-muted)]">{detail}</p>
    </div>
  );
}
