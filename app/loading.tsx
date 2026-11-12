/**
 * Fallback shown while a page loads. It is deliberately generic (a heading,
 * one large card, a few list rows) because it also covers /saku and /split,
 * and it uses theme tokens so it is correct in both light and dark.
 */
export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Memuat / Loading"
      className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-28 pt-4 motion-safe:animate-pulse"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-40 rounded-lg bg-line" />
          <div className="h-3 w-28 rounded bg-line" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-11 rounded-xl bg-line" />
          <div className="h-11 w-11 rounded-xl bg-line" />
        </div>
      </div>

      <div className="h-12 rounded-xl bg-line" />

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5">
        <div className="h-4 w-24 rounded bg-line" />
        <div className="h-10 w-48 rounded-lg bg-line" />
        <div className="h-4 w-56 rounded bg-line" />
        <div className="h-2.5 w-full rounded-full bg-line" />
      </div>

      <div className="h-5 w-32 rounded bg-line" />
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 border-b border-dashed border-line px-4 py-4 last:border-b-0">
            <div className="flex flex-col gap-2">
              <div className="h-4 w-36 rounded bg-line" />
              <div className="h-3 w-24 rounded bg-line" />
            </div>
            <div className="h-4 w-20 rounded bg-line" />
          </div>
        ))}
      </div>
    </main>
  );
}
