export default function DashboardLoading() {
  return (
    <main className="max-w-md mx-auto p-4 pb-48 flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 w-36 bg-zinc-800 rounded-md" />
        <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-zinc-800" />
      </div>

      {/* Burn Rate Summary Hero Card Skeleton */}
      <div className="rounded-2xl border border-zinc-800 bg-linear-to-b from-zinc-900 to-zinc-950 p-5 shadow-sm space-y-4">
        <div>
          <div className="h-3 w-24 bg-zinc-800 rounded-xs mb-2" />
          <div className="h-8 w-44 bg-zinc-800 rounded-md" />
        </div>

        {/* Budget Progress Skeleton */}
        <div className="pt-2 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-28 bg-zinc-800/80 rounded-xs" />
            <div className="h-3 w-16 bg-zinc-800/80 rounded-xs" />
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full" />
        </div>

        {/* Micro-Stats Shelf */}
        <div className="grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-4">
          <div>
            <div className="h-2.5 w-14 bg-zinc-800/80 rounded-xs mb-1.5" />
            <div className="h-4 w-20 bg-zinc-800 rounded-xs mb-1" />
            <div className="h-2.5 w-16 bg-zinc-800/60 rounded-xs" />
          </div>
          <div className="border-l border-zinc-800/60 pl-2">
            <div className="h-2.5 w-16 bg-zinc-800/80 rounded-xs mb-1.5" />
            <div className="h-4 w-18 bg-zinc-800 rounded-xs mb-1" />
            <div className="h-2.5 w-14 bg-zinc-800/60 rounded-xs" />
          </div>
          <div className="border-l border-zinc-800/60 pl-2">
            <div className="h-2.5 w-12 bg-zinc-800/80 rounded-xs mb-1.5" />
            <div className="h-4 w-16 bg-zinc-800 rounded-xs mb-1" />
            <div className="h-2.5 w-14 bg-zinc-800/60 rounded-xs" />
          </div>
        </div>
      </div>

      {/* Breakdown Card Skeleton */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="h-3 w-28 bg-zinc-800 rounded-xs" />
          <div className="h-6 w-32 bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-36 bg-zinc-800/40 rounded-xl" />
      </div>

      {/* Recent Entries Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-3 w-24 bg-zinc-800 rounded-xs mb-1" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-zinc-800" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-zinc-800 rounded-xs" />
                  <div className="h-2.5 w-16 bg-zinc-800/60 rounded-xs" />
                </div>
              </div>
              <div className="h-4 w-20 bg-zinc-800 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

