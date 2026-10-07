export default function Loading() {
  return (
    <div className="min-h-screen pb-32 pt-4 px-4 max-w-md mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="h-9 w-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <div className="h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4" />

      <div className="space-y-3">
        <div className="h-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
