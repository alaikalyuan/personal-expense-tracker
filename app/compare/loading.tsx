export default function CompareLoading() {
  return (
    <main className="max-w-md mx-auto p-4 pb-48 flex flex-col gap-6 font-sans animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div className="space-y-1.5">
          <div className="h-6 w-36 bg-line rounded-md" />
          <div className="h-3 w-48 bg-line rounded-xs" />
        </div>
        <div className="h-8 w-8 rounded-xl bg-line border border-line" />
      </div>

      {/* Week-over-Week Spend Hero Card */}
      <div className="rounded-2xl border border-line bg-card p-5 shadow-sm space-y-4">
        <div className="h-2.5 w-36 bg-line rounded-xs" />

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-line rounded-xs" />
            <div className="h-7 w-32 bg-line rounded-md" />
            <div className="h-2.5 w-18 bg-line rounded-xs" />
          </div>

          <div className="border-l border-line pl-4 space-y-1.5">
            <div className="h-3 w-16 bg-line rounded-xs" />
            <div className="h-7 w-32 bg-line rounded-md" />
            <div className="h-2.5 w-18 bg-line rounded-xs" />
          </div>
        </div>

        <div className="border-t border-line pt-3 flex justify-between items-center">
          <div className="h-4 w-36 bg-line rounded-md" />
          <div className="h-3.5 w-24 bg-line rounded-xs" />
        </div>
      </div>

      {/* Burn Rate Pacing Card */}
      <div className="rounded-2xl border border-line bg-card p-4 shadow-sm space-y-3">
        <div className="h-3 w-36 bg-line rounded-xs" />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line bg-card p-3 space-y-2">
            <div className="h-2.5 w-24 bg-line rounded-xs" />
            <div className="h-4 w-28 bg-line rounded-xs" />
            <div className="h-2 w-20 bg-line rounded-xs" />
          </div>
          <div className="rounded-xl border border-line bg-card p-3 space-y-2">
            <div className="h-2.5 w-24 bg-line rounded-xs" />
            <div className="h-4 w-28 bg-line rounded-xs" />
            <div className="h-2 w-20 bg-line rounded-xs" />
          </div>
        </div>
        <div className="h-3 w-56 bg-line rounded-xs mx-auto mt-2" />
      </div>

      {/* Daily Trend Comparison Skeleton */}
      <div className="rounded-2xl border border-line bg-card p-4 shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-line">
          <div className="h-3 w-40 bg-line rounded-xs" />
          <div className="h-6 w-32 bg-line rounded-lg" />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-3">
            <div className="h-3 w-16 bg-line rounded-xs" />
            <div className="h-3 w-16 bg-line rounded-xs" />
          </div>
          <div className="h-2.5 w-14 bg-line rounded-xs" />
        </div>

        <div className="flex gap-2">
          <div className="h-4 w-28 bg-line rounded-full" />
          <div className="h-4 w-32 bg-line rounded-full" />
        </div>

        {/* Chart View Skeleton */}
        <div className="flex items-end justify-between gap-1.5 h-32 px-1 pt-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end rounded-lg p-1"
            >
              <div className="w-full flex items-end justify-center gap-1 h-20">
                <div className="w-1/2 rounded-t-xs bg-line h-10" />
                <div className="w-1/2 rounded-t-xs bg-line h-14" />
              </div>
              <div className="h-2.5 w-5 bg-line rounded-xs" />
            </div>
          ))}
        </div>

        {/* Selected Day Details Card Skeleton */}
        <div className="rounded-xl border border-line bg-card p-3.5 space-y-2.5">
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-28 bg-line rounded-xs" />
            <div className="h-3 w-20 bg-line rounded-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="h-12 bg-card rounded-lg border border-line" />
            <div className="h-12 bg-card rounded-lg border border-line" />
          </div>
          <div className="h-3 w-40 bg-line rounded-xs pt-1" />
        </div>
      </div>

      {/* Category Changes Skeleton */}
      <div className="rounded-2xl border border-line bg-card p-4 shadow-sm space-y-3">
        <div className="h-3 w-32 bg-line rounded-xs mb-2" />
        <div className="space-y-2.5">
          {[1, 2, 3].map((cat) => (
            <div
              key={cat}
              className="rounded-xl border border-line bg-card p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-line" />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 bg-line rounded-xs" />
                  <div className="h-2 w-32 bg-line rounded-xs" />
                </div>
              </div>
              <div className="h-3.5 w-16 bg-line rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

