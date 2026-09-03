export default function CompareLoading() {
  return (
    <main className="max-w-md mx-auto p-4 pb-48 flex flex-col gap-6 font-sans animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div className="space-y-1.5">
          <div className="h-6 w-36 bg-zinc-800 rounded-md" />
          <div className="h-3 w-48 bg-zinc-800/70 rounded-xs" />
        </div>
        <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-zinc-800" />
      </div>

      {/* Week-over-Week Spend Hero Card */}
      <div className="rounded-2xl border border-zinc-800 bg-linear-to-b from-zinc-900 to-zinc-950 p-5 shadow-sm space-y-4">
        <div className="h-2.5 w-36 bg-zinc-800 rounded-xs" />

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-zinc-800/80 rounded-xs" />
            <div className="h-7 w-32 bg-zinc-800 rounded-md" />
            <div className="h-2.5 w-18 bg-zinc-800/60 rounded-xs" />
          </div>

          <div className="border-l border-zinc-800/80 pl-4 space-y-1.5">
            <div className="h-3 w-16 bg-zinc-800/80 rounded-xs" />
            <div className="h-7 w-32 bg-zinc-800 rounded-md" />
            <div className="h-2.5 w-18 bg-zinc-800/60 rounded-xs" />
          </div>
        </div>

        <div className="border-t border-zinc-800/80 pt-3 flex justify-between items-center">
          <div className="h-4 w-36 bg-zinc-800 rounded-md" />
          <div className="h-3.5 w-24 bg-zinc-800/70 rounded-xs" />
        </div>
      </div>

      {/* Burn Rate Pacing Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm space-y-3">
        <div className="h-3 w-36 bg-zinc-800 rounded-xs" />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3 space-y-2">
            <div className="h-2.5 w-24 bg-zinc-800/70 rounded-xs" />
            <div className="h-4 w-28 bg-zinc-800 rounded-xs" />
            <div className="h-2 w-20 bg-zinc-800/50 rounded-xs" />
          </div>
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3 space-y-2">
            <div className="h-2.5 w-24 bg-zinc-800/70 rounded-xs" />
            <div className="h-4 w-28 bg-zinc-800 rounded-xs" />
            <div className="h-2 w-20 bg-zinc-800/50 rounded-xs" />
          </div>
        </div>
        <div className="h-3 w-56 bg-zinc-800/60 rounded-xs mx-auto mt-2" />
      </div>

      {/* Daily Trend Sparkline Skeleton */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800/80">
          <div className="h-3 w-40 bg-zinc-800 rounded-xs" />
          <div className="h-3 w-28 bg-zinc-800/70 rounded-xs" />
        </div>

        <div className="flex items-end justify-between gap-2 h-28 px-1 pt-3">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-1 h-20">
                <div className="w-1/2 rounded-t-xs bg-zinc-800 h-10" />
                <div className="w-1/2 rounded-t-xs bg-zinc-700 h-14" />
              </div>
              <div className="h-2.5 w-5 bg-zinc-800/80 rounded-xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Category Changes Skeleton */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm space-y-3">
        <div className="h-3 w-32 bg-zinc-800 rounded-xs mb-2" />
        <div className="space-y-2.5">
          {[1, 2, 3].map((cat) => (
            <div
              key={cat}
              className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 bg-zinc-800 rounded-xs" />
                  <div className="h-2 w-32 bg-zinc-800/60 rounded-xs" />
                </div>
              </div>
              <div className="h-3.5 w-16 bg-zinc-800 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

