/*
 * Loading skeleton placeholders matching card and message geometries.
 */

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-300/40 dark:bg-slate-700/40 ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="nova-surface rounded-2xl p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}
