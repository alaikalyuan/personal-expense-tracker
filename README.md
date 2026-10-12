# 🪙 SakuTrack — Personal & Student Budget Tracker

> A modern, lightning-fast, mobile-first personal expense tracker with an autonomous AI Financial Assistant, Vision Receipt & Bank Mutation OCR, Automated Email Sync for Livin' Mandiri QRIS, Digital Subscription Manager, PWA Push Notifications, Sinking Funds, and Fair Split Bill.

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?style=flat-square&logo=supabase)
![DeepSeek AI](https://img.shields.io/badge/DeepSeek_AI-Vision%20%26%20Tools-4f46e5?style=flat-square)
![Web Push](https://img.shields.io/badge/Web_Push-PWA%20Notifications-e11d48?style=flat-square)
![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?style=flat-square)

---

## 📑 Table of Contents

- [What's New in Recent Updates](#-whats-new-in-recent-updates)
- [Key Features](#-key-features)
  - [🤖 AI Financial Assistant & Action Proposals](#-ai-financial-assistant--action-proposals)
  - [📸 AI Vision OCR & Bank Mutation Scanner](#-ai-vision-ocr--bank-mutation-scanner)
  - [📧 Automated Email Sync (Livin' Mandiri QRIS)](#-automated-email-sync-livin-mandiri-qris)
  - [📅 Digital Subscription Tracker](#-digital-subscription-tracker)
  - [🔔 PWA Web Push Notifications & Cron Automations](#-pwa-web-push-notifications--cron-automations)
  - [💼 Multi-Saku (Multi-Wallet) Architecture](#-multi-saku-multi-wallet-architecture)
  - [⚡ Natural Language Quick Add](#-natural-language-quick-add)
  - [📊 Dynamic Budget Pacing & Projected Burn Rate](#-dynamic-budget-pacing--projected-burn-rate)
  - [🔥 Consistency Streaks & No-Spend Days](#-consistency-streaks--no-spend-days)
  - [🎯 Sinking Funds & Surplus Sweep](#-sinking-funds--surplus-sweep)
  - [🧾 Itemized Split Bill & Public QR Sharing](#-itemized-split-bill--public-qr-sharing)
  - [🚀 Lossless Guest Onboarding & Auth](#-lossless-guest-onboarding--auth)
  - [📱 PWA, Dark Mode & Internationalization](#-pwa-dark-mode--internationalization)
- [Tech Stack](#-tech-stack)
- [Project Architecture & Structure](#-project-architecture--structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository & Install Dependencies](#1-clone-repository--install-dependencies)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Supabase Database & Auth Setup](#3-supabase-database--auth-setup)
  - [4. Run Local Development Server](#4-run-local-development-server)
- [Natural Language Parser Syntax](#-natural-language-parser-syntax)
- [Cloudflare Email Worker Setup](#-cloudflare-email-worker-setup)
- [Deployment & Cron Jobs](#-deployment--cron-jobs)
- [Test Suites](#-test-suites)
- [License](#-license)

---

## 🚀 What's New in Recent Updates

Recent git commits introduce several major platform capabilities:

1. **Autonomous AI Financial Assistant (`app/ai/`)**: Global slide-out assistant powered by DeepSeek with read tools, live financial health snapshots, safe action proposal cards (`ActionProposalCard`), markdown tables (`remark-gfm`), circular usage meters, and BYOK support.
2. **AI Vision OCR & Canvas Editor (`app/api/ai/extract`)**: Upload receipts or screenshots of bank mutations (BCA, Mandiri, e-wallets); features interactive crop/rotate canvas, itemized extraction, and duplicate detection.
3. **Automated Email Sync (`app/email-sync/`)**: Inbound webhook for Livin' by Mandiri QRIS transaction emails with custom domain routing via Cloudflare Workers, in-app Google Forwarding verification code interception, and hybrid review vs. auto-log modes.
4. **Digital Subscription Tracker (`/subscriptions`)**: Track recurring apps (Netflix, Spotify, ChatGPT) with billing cycles, upcoming renewal alerts, and 1-click Split Bill integration.
5. **PWA Web Push Notifications**: Automated daily reminder push notifications and renewal warnings powered by VAPID and background Vercel Cron.
6. **Multi-Saku Foundation (`/saku`)**: Full database foundation, view layers, and UI modals for multiple spending/stash wallets with master feature flag toggle.

---

## ✨ Key Features

### 🤖 AI Financial Assistant & Action Proposals
- **Global AI Assistant Sheet (`AiAssistantSheet`):** Open the assistant from any page header via `AiHeaderButton` with thread persistence in `localStorage`.
- **Comprehensive Financial Snapshot (`utils/ai/snapshot.ts`):** Gives the AI real-time context of spending pace, remaining budget, wallets, sinking funds, subscriptions, and active split bills.
- **Autonomous Function Calling:**
  - **Read Tools:** `search_expenses` (keyword, category, date range, wallet) and `get_period_summary` (weekly/monthly totals and breakdown).
  - **Write Action Proposals:** `log_expenses` (single or bulk batch entries), `update_expense`, `delete_expense`, `set_budget`, savings goals, and surplus sweeping.
- **Human-in-the-Loop Safety:** Proposed database modifications render interactive **Action Proposal Cards** requiring explicit user confirmation before executing.
- **Daily Usage & Quota Meter:** 20 daily message units on server keys with a circular SVG progress meter, photo quota costing (5 units), and a BYOK (Bring Your Own Key) setting for unlimited queries.
- **Markdown Tables & Formatting:** Styled tables and formatting rendered via `react-markdown` and `remark-gfm`.
- **Smart Spending Signals:** Dedicated `AiAdvisorCard` on the dashboard displaying rule-based pacing insights and quick prompt chips.

### 📸 AI Vision OCR & Bank Mutation Scanner
- **Receipt & Invoice OCR:** DeepSeek Vision (`deepseek-flash`) extracts merchant name, date, line items, taxes, service charges, discounts, and total amounts.
- **Bank Transfer & Mutation Parsing:** Recognizes bank statement screenshots and e-wallet transfers (BCA, Mandiri, GoPay, OVO, ShopeePay) with multi-transaction batch review.
- **Integrated Workflows:**
  - **Quick Add Modal:** "Upload Foto" button parses receipts directly into single or itemized expense entries.
  - **Split Bill Creator:** "Scan Struk" button auto-fills line items, tax percentage, service fees, and discounts.
- **Interactive Canvas Editor (`ImageUploadModal`):** Client-side cropping, 90° rotation, zoom, and JPEG compression before OCR upload.
- **Duplicate Detection (`utils/ai/duplicates.ts`):** Flags potential duplicates based on amount, date proximity, and merchant similarity with soft warning badges.

### 📧 Automated Email Sync (Livin' Mandiri QRIS)
- **Zero-Friction Email Ingestion:** Forwards bank notification emails to a dedicated address (`user_<token>@sakutrack.my.id`) via Cloudflare Email Routing.
- **Specialized Mandiri Parser (`utils/email/livinParser.ts`):** Extracts recipient/merchant, nominal amount, date, time, reference ID, and suggests categories.
- **In-App Gmail Forwarding Setup:** Intercepts Google Forwarding confirmation emails using a `SECURITY DEFINER` RPC to display the verification code directly in the app.
- **Hybrid Operation Modes:**
  - **Review Mode:** Shows a 3-row responsive `PendingTransactionsBanner` on the dashboard to review and approve or dismiss transactions.
  - **Auto-Log Mode:** Instantly records transactions into your expense tracker with target wallet assignment.
- **Live Paste Testing:** Built-in modal tester (`/api/email/parse-paste`) allows pasting raw email text to test extraction immediately.
- **Deduplication:** Prevents duplicate entries using unique reference IDs.

### 📅 Digital Subscription Tracker
- **Dedicated Subscription Manager (`/subscriptions`):** Track subscriptions (Netflix, Spotify, YouTube Premium, ChatGPT, iCloud, Google One, Wi-Fi) with custom pricing and renewal cycles (monthly, yearly, weekly).
- **Payment Platform Badges:** Supports Google Play, Apple App Store, Credit Card, GoPay, Dana, and more.
- **Split Bill Integration:** Automatically creates a Split Bill on renewal day or with 1 click, distributing costs to friends and logging the creator's share to expenses.
- **Dashboard Renewal Alerts:** Visual reminders on the dashboard when billing dates are approaching.

### 🔔 PWA Web Push Notifications & Cron Automations
- **W3C Web Push API:** Service worker (`public/sw.js`) with VAPID key authentication.
- **Configurable Notification Schedules:** Customizable daily reminder time and upcoming subscription renewal alerts.
- **Automated Vercel Cron (`/api/cron/notifications`):** Executes daily at 20:00 UTC (03:00 WIB) with `CRON_SECRET` authentication to dispatch pending push alerts.
- **Settings Modal (`NotificationSettingsModal`):** Easily subscribe, unsubscribe, and test browser push notifications.

### 💼 Multi-Saku (Multi-Wallet) Architecture
- **Full Multi-Wallet Data Model:** Supports spending wallets and stash pockets (`wallets`, `wallet_transactions`, `user_settings`, and `wallet_balances` view).
- **Saku Hub (`/saku`):** Saku switcher, income modal, and wallet-to-wallet transfer modal.
- **Master Feature Flag:** Governed by `FEATURE_MULTI_SAKU_ENABLED` in `utils/wallets/config.ts` to seamlessly toggle between standard and multi-wallet mode without schema changes.

### ⚡ Natural Language Quick Add
- **Zero-Effort Input:** Type naturally (e.g., `kopi 18k semalam`, `2x lunch 25k`, `bensin 30k hari senin`).
- **Auto-Categorization:** Keyword matching for **Food & Dining**, **Transportation**, **Utilities**, **Academics**, **Entertainment**, and **Others**.
- **Colloquial & Relative Dates:** Parses Indonesian and English relative terms (`kemarin`, `semalam`, `tadi malam`, `2 hari lalu`, `senin lalu`, `last week`) while preventing past day-of-week inputs from defaulting to future dates.
- **Multiplier & Quantity Support:** Computes totals (`2x kopi 15k` $\rightarrow$ Rp 30.000) while preserving item quantities (`2 indomie 15000`).
- **Exemption Tagging (`#exempt` / `exempt`):** Flags non-routine or reimbursable purchases to exclude them from weekly/monthly pacing.

### 📊 Dynamic Budget Pacing & Projected Burn Rate
- **Cadence Switcher:** Instantly toggle between **Weekly** (Monday–Sunday) and **Monthly** (1st to month-end) tracking.
- **Projected Burn Forecast:** Real-time projection estimating total spend by period end based on current daily pace vs. target pace.
- **Empathetic Pacing Badges:** Clear visual indicators displaying whether you are under-budget, on track, or exceeding pace.
- **Export & Share:** Export filtered expenses to CSV or generate clean text summaries ready for messaging apps (WhatsApp, Telegram).

### 🔥 Consistency Streaks & No-Spend Days
- **Logging Streak Counter:** Tracks consecutive active days of expense tracking.
- **Interactive Consistency Dots:** Visual status for every day of the active week.
- **1-Click "No-Spend Day" Logging:** Celebratory zero-expense entry (`Rp 0`) with confetti animation to maintain streaks on frugal days.

### 🎯 Sinking Funds & Surplus Sweep
- **Custom Sinking Goals:** Create targeted savings buckets with custom names, target amounts, and emojis (e.g., 💻 *Laptop Baru*, ✈️ *Liburan*).
- **Weekly Surplus Sweeping:** Sweep unspent budget directly into general savings or specific goals.
- **Deficit Week Patching:** Offset an overspent week directly from your accumulated savings balance without rewriting history.
- **Reversible Audit Trail:** 200-item transaction history with 1-click rollback for deposits, withdrawals, and allocations.

### 🧾 Itemized Split Bill & Public QR Sharing
- **Equal & Itemized Modes:** Split bills equally or assign individual items to specific friends.
- **Taxes, Service & Rounding:** Automatically distributes tax percentage, service fees, discounts, and custom cash rounding steps (e.g., Rp 100).
- **Public Friend View (`/split/[id]`):** Friends can view their itemized breakdown without signing in or creating accounts.
- **QR Code & Payment Info:** Displays payment instructions (BCA, Mandiri, GoPay, QRIS) with an interactive QR code.
- **Settle-up Tracking:** Toggle paid status per participant and sync the creator's share directly into your personal expense tracker with 1 click.

### 🚀 Lossless Guest Onboarding & Auth
- **Instant Guest Tryout:** Jump straight into the app with Supabase Anonymous Authentication.
- **Lossless Account Upgrade:** Upgrading or logging in automatically migrates and merges all guest expenses into the registered account.

### 📱 PWA, Dark Mode & Internationalization
- **Progressive Web App (PWA):** Installable on iOS, Android, and desktop with standalone support and service worker offline caching.
- **Flicker-Free Theme:** Dark and Light modes powered by SSR cookie hydration.
- **Bilingual (i18n):** Native support for English and Bahasa Indonesia.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Server Components) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, SSR Auth) |
| **AI Engine** | [DeepSeek API](https://www.deepseek.com/) (Function Calling & DeepSeek Vision `deepseek-flash`) |
| **Push Notifications** | [web-push](https://www.npmjs.com/package/web-push) (W3C Web Push Protocol & Service Worker) |
| **Markdown** | [react-markdown](https://www.npmjs.com/package/react-markdown) & [remark-gfm](https://www.npmjs.com/package/remark-gfm) |
| **Date Utilities** | [date-fns v4](https://date-fns.org/) |
| **Effects & QR** | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti), [qrcode](https://www.npmjs.com/package/qrcode) |
| **Email Forwarding** | [Cloudflare Workers](https://workers.cloudflare.com/) (Cloudflare Email Routing) |
| **Deployment** | [Vercel](https://vercel.com/) (Edge Cron & Singapore `sin1` region) |

---

## 📂 Project Architecture & Structure

```
personal-expense-tracker/
├── app/
│   ├── layout.tsx                # Root layout (PWA meta, Theme, i18n, AiAssistantProvider)
│   ├── page.tsx                  # Dashboard Server Component (Unified range query)
│   ├── actions.ts                # Server Actions (Auth, Expenses, Budgets, Savings)
│   ├── DashboardClient.tsx       # Main dashboard client state & views
│   ├── QuickAddExpense.tsx       # Natural language quick add + image upload trigger
│   ├── BudgetProgress.tsx        # Budget progress bar & cadence metrics
│   ├── ProjectedBurnCard.tsx     # Burn rate forecast and pace status
│   ├── BreakdownCard.tsx         # Category breakdown visualizer
│   ├── ExpenseList.tsx           # Expense list, search, filter, edit, delete, exempt
│   ├── TrackingStreak.tsx        # Logging streak counter & day consistency dots
│   ├── CadenceToggle.tsx         # Week / Month cadence switcher
│   ├── BottomNav.tsx             # Responsive mobile navigation bar
│   ├── NotificationSettingsModal.tsx # Push notification settings & test alerts
│   ├── manifest.ts               # Web App Manifest definition for PWA
│   ├── ai/                       # AI Assistant UI Components
│   │   ├── AiAssistantProvider.tsx   # Global AI context and sheet state
│   │   ├── AiAssistantSheet.tsx      # Slide-out chat sheet with tool proposals
│   │   ├── ActionProposalCard.tsx    # Interactive confirmation cards for AI actions
│   │   ├── AiHeaderButton.tsx        # Global header AI launcher button
│   │   ├── ImageUploadModal.tsx      # Canvas image editor (crop/rotate/zoom/compress)
│   │   └── actions.ts                # AI action execution server actions
│   ├── api/
│   │   ├── ai/advisor/route.ts       # Streaming DeepSeek assistant with tools
│   │   ├── ai/extract/route.ts       # DeepSeek Vision OCR endpoint
│   │   ├── cron/notifications/route.ts # Background cron for daily reminders & renewals
│   │   ├── email/inbound/route.ts    # Webhook receiving forwarded bank emails
│   │   ├── email/parse-paste/route.ts# Paste-testing endpoint for email extraction
│   │   └── notifications/            # Push subscription management & test routes
│   ├── email-sync/                   # Email Sync UI & Server Actions
│   │   ├── EmailSyncSettingsModal.tsx# Forwarding config & paste-testing modal
│   │   ├── PendingTransactionsBanner.tsx # Dashboard review banner for pending transactions
│   │   └── actions.ts                # Email sync approval & settings actions
│   ├── subscriptions/                # Digital Subscription Tracker
│   │   ├── page.tsx                  # Subscriptions page
│   │   ├── SubscriptionsClient.tsx   # Subscriptions client view & modals
│   │   ├── actions.ts                # Subscription CRUD & split bill generator
│   │   └── types.ts                  # Subscription data interfaces
│   ├── saku/                         # Multi-Saku (Multi-Wallet) Hub & Pages
│   ├── split/                        # Split bill dashboard, creator, public viewer
│   │   ├── new/                      # Split bill wizard (with "Scan Struk" OCR)
│   │   └── [id]/                     # Public shareable bill page with QR code
│   └── auth/                         # Supabase Auth routes (Guest, Callback, Login)
├── supabase/
│   ├── schema.sql                    # Master consolidated database schema (all tables & RPCs)
│   ├── email_sync_schema.sql         # Email sync DDL & ingestion RPC functions
│   ├── subscriptions_and_push_schema.sql # Subscriptions & Web Push DDL
│   ├── multi_saku_schema.sql         # Multi-wallet foundation DDL
│   ├── split_bill_schema.sql         # Split bill module DDL
│   └── fix_update_policy.sql         # Row Level Security updates
├── utils/
│   ├── ai/                           # AI Utilities
│   │   ├── snapshot.ts               # Real-time financial health context builder
│   │   ├── tools.ts                  # DeepSeek tool definitions & handlers
│   │   ├── vision.ts                 # Vision prompt, parsing & extraction normalizer
│   │   ├── duplicates.ts             # Duplicate transaction detection algorithms
│   │   ├── rateLimit.ts              # Daily 20-unit usage limiter & cost rules
│   │   └── imageCompress.ts          # Client-side canvas compression
│   ├── email/
│   │   └── livinParser.ts            # Specialized Livin' by Mandiri QRIS parser
│   ├── pwa/
│   │   ├── pushManager.ts            # Browser ServiceWorker push registration
│   │   └── webPushServer.ts          # Server-side VAPID web-push sender
│   ├── wallets/                      # Multi-wallet server helpers & feature flags
│   ├── expenseParser.ts              # Natural language regex parser & date math
│   ├── splitCalculator.ts            # Tax, service, discount & rounding algorithms
│   ├── streak.ts                     # Consecutive days & weekly consistency logic
│   ├── exemptions.ts                 # Exemption flag utilities (#exempt tags)
│   ├── date.ts                       # Timezone-aware date calculations (Asia/Jakarta)
│   ├── i18n/                         # Bilingual dictionary and context (id / en)
│   └── theme/                        # Light / Dark mode context and cookie helpers
├── public/
│   ├── sw.js                         # Service Worker for PWA & Push Notifications
│   └── icons/                        # PWA application icons
├── scripts/
│   ├── cloudflare-email-worker.js    # Cloudflare Worker for email forwarding
│   ├── test-livin-parser.mjs         # Test suite for Livin' Mandiri email parser
│   └── test-parser.mjs               # Test suite for natural language expense parser
└── vercel.json                       # Deployment & Cron schedule configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.18.0 or higher; v20+ recommended)
- [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), or [yarn](https://yarnpkg.com/)
- A free [Supabase](https://supabase.com/) project
- *(Optional for AI)* A [DeepSeek API Key](https://platform.deepseek.com/)
- *(Optional for Push Notifications)* VAPID keys generated via `npx web-push generate-vapid-keys`

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/your-username/personal-expense-tracker.git
cd personal-expense-tracker
npm install
```

### 2. Configure Environment Variables

Create `.env.local` by copying `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Optional Timezone Configuration (Defaults to Asia/Jakarta / WIB / GMT+7)
NEXT_PUBLIC_TIMEZONE=Asia/Jakarta

# Web Push Notifications (PWA)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@yourdomain.com
CRON_SECRET=your_cron_secret

# AI Financial Advisor & Vision OCR (DeepSeek API)
DEEPSEEK_API_KEY=your_deepseek_api_key
# Optional DeepSeek Base URL (defaults to https://api.deepseek.com)
# DEEPSEEK_BASE_URL=https://api.deepseek.com
# Optional Vision OCR Model (defaults to deepseek-flash)
# DEEPSEEK_VISION_MODEL=deepseek-flash
```

### 3. Supabase Database & Auth Setup

1. Open your **Supabase Dashboard** $\rightarrow$ **SQL Editor** $\rightarrow$ **New Query**.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) to create all tables (`expenses`, `split_bills`, `subscriptions`, `push_subscriptions`, `email_transactions`, `wallets`, `user_settings`), Row Level Security (RLS) policies, indexes, and RPC functions.
3. Configure Authentication:
   - Navigate to **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Anonymous** and toggle **Enable Anonymous Sign-Ins** to **ON** *(required for instant guest mode)*.
   - *(Optional)* Configure **Google** under Authentication Providers if you want Google OAuth sign-in.

### 4. Run Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💬 Natural Language Parser Syntax

The Quick Add input allows effortless expense logging through intuitive syntax:

| Input Example | Detected Name | Amount | Category | Date | Note |
|---|---|---|---|---|---|
| `kopi 18k` | Kopi | Rp 18.000 | Food & Dining | Today | Standard input |
| `2 indomie 15000` | 2 Indomie | Rp 15.000 | Food & Dining | Today | Quantity preserved in name |
| `2x kopi 15k` | Kopi | Rp 30.000 | Food & Dining | Today | Multiplier calculated |
| `bensin 30k kemarin` | Bensin | Rp 30.000 | Transportation | Yesterday | Relative day parsed |
| `wifi 350k hari senin` | Wifi | Rp 350.000 | Utilities | Last Monday | Day name parsed |
| `sepatu 500k #exempt` | Sepatu | Rp 500.000 | Others | Today | Excluded from budget pace |
| `1.5jt servis laptop` | Servis laptop | Rp 1.500.000 | Others | Today | Millions suffix support |
| `tiket bioskop 50k semalam` | Tiket bioskop | Rp 50.000 | Entertainment | Yesterday | Colloquial night keyword |

---

## ☁️ Cloudflare Email Worker Setup

To automatically capture Livin' Mandiri QRIS emails with a custom domain:

1. In your [Cloudflare Dashboard](https://dash.cloudflare.com/), select your domain.
2. Go to **Compute (Workers) > Workers & Pages > Create Application > Create Worker**.
3. Paste the contents of [`scripts/cloudflare-email-worker.js`](./scripts/cloudflare-email-worker.js) and click **Deploy**.
4. Set the environment variable `SAKUTRACK_URL` in Worker Settings (defaults to `https://www.sakutrack.my.id/api/email/inbound`).
5. Under your domain's **Email Routing > Routing Rules**, create a catch-all or custom address rule:
   - **Action:** Send to a Worker
   - **Destination:** Select your created Worker.
6. In Gmail, set up automatic forwarding to your SakuTrack address (`user_<token>@yourdomain.com`). SakuTrack will intercept the verification code and display it directly in the **Email Sync Settings** modal!

---

## 🌐 Deployment & Cron Jobs

The project is preconfigured for deployment on [Vercel](https://vercel.com/):

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project in Vercel.
3. In **Environment Variables**, add the variables specified in `.env.example`.
4. Ensure your Supabase Auth **Redirect URLs** include your production domain (e.g., `https://your-domain.vercel.app/auth/callback`).
5. The background cron defined in `vercel.json` runs automatically:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/notifications",
         "schedule": "0 20 * * *"
       }
     ]
   }
   ```
6. Deploy!

---

## 🧪 Test Suites

Run automated test suites to verify parsing and extraction logic:

```bash
# Test natural language expense parser syntax
node scripts/test-parser.mjs

# Test Livin' by Mandiri QRIS email extraction
node scripts/test-livin-parser.mjs
```

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js local development server |
| `npm run build` | Builds the production bundle |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint checks |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
