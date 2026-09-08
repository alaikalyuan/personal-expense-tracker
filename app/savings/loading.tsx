export default function SavingsLoading() {
  return (
    <main className="max-w-md mx-auto p-4 pb-48 flex flex-col gap-6 font-sans animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div className="space-y-1.5">
          <div className="h-6 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-3 w-44 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-xs" />
        </div>
        <div className="h-8 w-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Main Metric Banner */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 space-y-4">
        <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xs" />
        <div className="h-9 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40" />
          <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40" />
        </div>
      </div>

      {/* Supportive Note skeleton */}
      <div className="rounded-2xl border border-zinc-200/60 bg-zinc-50 p-4 dark:border-zinc-800/60 dark:bg-zinc-900/40 space-y-2">
        <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xs" />
        <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xs" />
      </div>

      {/* Goals Skeleton */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xs" />
          <div className="h-7 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-20 bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl" />
      </div>

      {/* Patching Section Skeleton */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
        <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-xs" />
        <div className="h-16 bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl" />
      </div>
    </main>
  );
}
