# Performance budget

This file has two parts. The first is the **measured baseline** from Audit 002 (commit `a66510c`, 2026-11-13). The second is a **proposed budget**: a recommendation that nobody has adopted yet. Once the owner adopts it, change the status line below.

**Budget status: PROPOSED (not adopted).**

## 1. Measured baseline (Audit 002)

Everything here is **lab data**: a production build on localhost, talking to the live Supabase project. **No field (real-user) data was available**, so field Core Web Vitals for SakuTrack are UNVERIFIED. A Lighthouse run is never evidence of real-user Core Web Vitals.

### Bundle (production build, `.next/static`, gzip level 6)

| Measure | Audit 001 (2026-11-11) | Audit 002 |
|---|---:|---:|
| All client JS, gzip | 463,942 B | **571,353 B** (+23%, cause not traced) |
| All client JS, raw | 1,698,821 B | 1,937,876 B |
| CSS, raw / gzip | 164,470 B / n/a | 140,414 B / 19,615 B |
| First-load JS, `/` (gzip, modern browsers, excluding the `noModule` polyfill) | not measured | 283,762 B |
| First-load JS, other routes (same basis) | not measured | 189,857 B (`/split`) to 205,242 B (`/split/new`) |

`/` is about 80–95 KB gzip heavier than the other routes. The difference is one chunk (88,929 B gzip) that holds the Supabase browser client, which arrives through the statically imported `UpgradeAccountModal`.

### Lab Core Web Vitals (Lighthouse 13.6.0, mobile preset, simulated slow 4G + 4× CPU, 3 runs, median)

| Route (auth) | LCP | CLS | TBT (not INP) | Score |
|---|---:|---:|---:|---:|
| `/` signed out | 1,072 ms | 0 | 253 ms | 95 |
| `/` signed in (typical) | **3,261 ms** | 0 | 237 ms | 88 |
| `/savings` | **3,274 ms** | 0 | 297 ms | 86 |
| `/compare` | **2,964 ms** | 0 | 180 ms | 92 |
| `/split/<id>` friend view, signed out | 1,086 ms | 0 | 357 ms | 92 |
| `/` signed in (600 expenses, 1 run) | **3,171 ms** | 0 | 139 ms | 92 |

Caveat: other audit agents were using the same machine during these runs. INP can't be measured in Lighthouse navigation mode, so it is UNVERIFIED. The raw summaries are in `docs/audits/evidence/002/data/A-summary-*.json`.

### Server work on `/` (verified in code)

The dashboard makes 3 `auth.getUser` network calls per full page load, reads `wallet_balances` twice, runs an unbounded all-time `spent_at` query for the streak, and makes about 7 sequential round trips. Server response from localhost to the Supabase project was 131–169 ms.

## 2. Proposed budget (recommendation)

| Metric | Proposed limit | Basis | Status at baseline |
|---|---|---|---|
| Field LCP p75 (mobile) | ≤ 2.5 s | web.dev "Good" | UNVERIFIED (no field data) |
| Field INP p75 | ≤ 200 ms | web.dev "Good" | UNVERIFIED |
| Field CLS p75 | ≤ 0.1 | web.dev "Good" | UNVERIFIED |
| Lab LCP, signed-in `/`, `/savings`, `/compare` (Lighthouse mobile, median of 3) | ≤ 2.5 s | Proxy for the field target | FAIL (2.96–3.27 s) |
| Lab CLS, all routes | ≤ 0.05 | Leaves headroom under 0.1 | PASS (0) |
| Lab TBT, all routes | ≤ 200 ms | Proxy for responsiveness, not INP | PARTIAL (139–357 ms) |
| First-load JS per route, gzip, excluding the polyfill | ≤ 220 KB | Current non-`/` routes sit at 190–205 KB | FAIL on `/` (284 KB) |
| Total client JS, gzip | Must not grow without an entry in the changelog | Growth since Audit 001 was never explained | n/a |
| CSS, gzip | ≤ 25 KB | 19.6 KB today | PASS |
| `auth.getUser` calls per dashboard request | 1 | Audit 001 #48 | FAIL (3) |
| Sequential DB round trips on `/` | ≤ 3 | Run independent queries in parallel | FAIL (~7) |

## 3. How to measure

1. Run `npm run build`, then serve it with `npm run start -- -p 3100` (the `prod` entry in `.claude/launch.json`).
2. Run Lighthouse with `node docs/audits/evidence/002/scripts/agent-A-lh.mjs out|typical|large`. These scripts expect the tool folder layout described in `TESTING_PROTOCOL.md`. Run three times per route, use the median, and keep the machine otherwise idle.
3. Get bundle numbers with `node docs/audits/evidence/002/scripts/agent-A-bundle.mjs` (it reads `.next/static` and the route HTML).
4. Take field data from Vercel Speed Insights or CrUX once SakuTrack has enough traffic. Report it in its own table, separate from lab data.
