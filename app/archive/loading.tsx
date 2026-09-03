export default function ArchiveLoading() {
  return (
    <main className="max-w-md mx-auto p-4 pb-48 flex flex-col gap-6 font-sans animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-zinc-800" />
          <div className="space-y-1.5">
            <div className="h-6 w-28 bg-zinc-800 rounded-md" />
            <div className="h-3 w-40 bg-zinc-800/70 rounded-xs" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-zinc-800" />
      </div>

      {/* Historical Summary Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-linear-to-b from-zinc-900 to-zinc-950 p-4 shadow-sm space-y-3">
        <div className="h-2.5 w-32 bg-zinc-800 rounded-xs" />

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 bg-zinc-800/70 rounded-xs" />
            <div className="h-4 w-20 bg-zinc-800 rounded-xs" />
          </div>

          <div className="border-l border-zinc-800/80 pl-2.5 space-y-1.5">
            <div className="h-2.5 w-16 bg-zinc-800/70 rounded-xs" />
            <div className="h-4 w-20 bg-zinc-800 rounded-xs" />
          </div>

          <div className="border-l border-zinc-800/80 pl-2.5 space-y-1.5">
            <div className="h-2.5 w-14 bg-zinc-800/70 rounded-xs" />
            <div className="h-4 w-16 bg-zinc-800 rounded-xs" />
          </div>
        </div>
      </div>

      {/* Accordion List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-zinc-800 rounded-xs" />
                <div className="h-2.5 w-24 bg-zinc-800/60 rounded-xs" />
              </div>
              <div className="h-5 w-24 bg-zinc-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

