# 🪙 SakuTrack — Personal & Student Budget Tracker

> A modern, lightning-fast, mobile-first personal expense tracker built for students and budget-conscious individuals. Track daily expenses with natural language, forecast weekly/monthly burn rates, manage sinking funds, and split bills with friends seamlessly.

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?style=flat-square&logo=supabase)
![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?style=flat-square)

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture & Structure](#-project-architecture--structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository & Install Dependencies](#1-clone-repository--install-dependencies)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Supabase Database & Auth Setup](#3-supabase-database--auth-setup)
  - [4. Run Local Development Server](#4-run-local-development-server)
- [Natural Language Parser Syntax](#-natural-language-parser-syntax)
- [Split Bill Workflow](#-split-bill-workflow)
- [Savings & Sinking Funds System](#-savings--sinking-funds-system)
- [Deployment](#-deployment)
- [Scripts](#-scripts)
- [License](#-license)

---

## ✨ Key Features

### ⚡ Natural Language Quick Add
- **Zero-effort input:** Type naturally like chatting (e.g., `kopi 18k semalam`, `2x lunch 25k`, `bensin 30k hari senin`).
- **Auto-categorization:** Smart keyword detection for **Food & Dining**, **Transportation**, **Utilities**, **Academics**, **Entertainment**, and **Others**.
- **Colloquial & Relative Date Math:** Understands Indonesian and English relative terms (`kemarin`, `semalam`, `tadi malam`, `2 hari lalu`, `senin lalu`, `last week`, `on friday`).
- **Multiplier & Quantity Support:** Automatically calculates totals (`2x kopi 15k` $\rightarrow$ Rp 30.000) while preventing quantity disambiguation errors (`2 indomie 15000`).
- **Exemption Tagging (`#exempt` / `exempt`):** Flag one-off, reimbursable, or non-routine purchases so they do not distort your daily budget pacing.

### 📊 Dynamic Budget Pacing & Projected Burn Rate
- **Cadence Switcher:** Instantly toggle between **Weekly** (Monday–Sunday) and **Monthly** (1st to month-end) tracking.
- **Projected Burn Forecast:** Real-time calculation predicting total spend by period end based on your daily burn rate versus target pace.
- **Empathetic Pacing Badges:** Clear visual indicators displaying whether you are under-budget, on track, or exceeding your pace.
- **Export & Share:** Export expense history to CSV or copy formatted summaries ready for messaging apps (WhatsApp, Telegram).

### 🔥 Consistency Streaks & No-Spend Days
- **Logging Streak Counter:** Tracks consecutive days of logging to cultivate consistent financial habits.
- **Interactive Week Consistency Dots:** Visual status for every day of the active week.
- **1-Click "No-Spend Day" Logging:** Celebratory zero-expense entry with confetti animation (`Rp 0`) to keep streaks alive on frugal days.

### 🎯 Sinking Funds & Surplus Sweep (`/savings`)
- **Custom Sinking Goals:** Create dedicated savings targets with custom names, target amounts, and emojis (e.g., 💻 *Laptop Baru*, ✈️ *Liburan*).
- **Weekly Surplus Sweeping:** Sweep unspent budget directly into general savings or straight into specific goals at the end of the week.
- **Deficit Week Patching:** Overspent a week? Cover the deficit directly from your savings balance without resetting past records.
- **Audit History & Rollback:** Full transaction history with 1-click reversible records for deposits, withdrawals, and allocations.

### 🧾 Itemized Split Bill & Public QR Sharing (`/split`)
- **Flexible Splitting Modes:** Split bills equally or item-by-item across participants.
- **Taxes, Service & Rounding:** Automatically distributes tax percentage, service fees, discounts, and custom cash rounding steps (e.g., Rp 100).
- **Public Friend View (`/split/[id]`):** Shareable link accessible without requiring friends to log in or create accounts.
- **QR Code & Payment Info:** Displays payment details (BCA, Mandiri, GoPay, QRIS) with an interactive QR code for quick scanning at tables.
- **Settle-up Tracking:** Toggle paid status per participant and sync the creator's share directly into your personal expense tracker with 1 click.

### 🚀 Seamless Guest Mode & Data Migration
- **Instant Onboarding:** Jump straight into the app as an anonymous guest with no signup required.
- **Lossless Account Upgrade:** When upgrading or logging in, all guest expenses are automatically migrated and merged into the registered account.

### 📱 PWA, Dark Mode & Internationalization
- **Progressive Web App (PWA):** Installable on iOS, Android, and desktop browsers with standalone fullscreen support.
- **Flicker-Free Theme:** Dark and Light mode powered by SSR cookie hydration.
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
| **Date Utilities** | [date-fns v4](https://date-fns.org/) |
| **Effects & QR** | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti), [qrcode](https://www.npmjs.com/package/qrcode) |
| **Deployment** | [Vercel](https://vercel.com/) (Optimized for `sin1` Singapore region) |

---

## 📂 Project Architecture & Structure

```
personal-expense-tracker/
├── app/
│   ├── layout.tsx                # Root layout (PWA meta, Theme & i18n providers)
│   ├── page.tsx                  # Dashboard Server Component (Unified range query)
│   ├── actions.ts                # Server Actions (Auth, Expenses, Budgets, Savings)
│   ├── DashboardClient.tsx       # Main dashboard client state & views
│   ├── QuickAddExpense.tsx       # Natural language quick add input + chips
│   ├── BudgetProgress.tsx        # Budget progress bar & cadence metrics
│   ├── ProjectedBurnCard.tsx     # Burn rate forecast and pace status
│   ├── BreakdownCard.tsx         # Category breakdown visualizer
│   ├── ExpenseList.tsx           # Expense entries list, search, filter, edit, delete
│   ├── TrackingStreak.tsx        # Logging streak counter & day consistency dots
│   ├── CadenceToggle.tsx         # Week / Month cadence switcher
│   ├── BottomNav.tsx             # Responsive mobile navigation bar
│   ├── manifest.ts               # Web App Manifest definition for PWA
│   ├── archive/                  # Historical weeks & surplus/deficit review
│   ├── compare/                  # Daily trend and week-over-week comparisons
│   ├── savings/                  # Sinking funds, goal allocation, surplus sweep
│   ├── split/                    # Split bill dashboard, creator, public viewer
│   │   ├── new/                  # Split Bill creation wizard (Equal & Itemized)
│   │   └── [id]/                 # Public shareable bill page with QR code
│   └── auth/                     # Supabase Auth routes (Guest, Callback, Login)
├── supabase/
│   ├── schema.sql                # Complete database schema, tables, RLS, and indexes
│   ├── split_bill_schema.sql     # Split bill module specific DDL
│   └── fix_update_policy.sql     # Row Level Security policy updates
├── utils/
│   ├── expenseParser.ts          # Natural language regex parser & date math
│   ├── splitCalculator.ts        # Tax, service, discount & rounding algorithms
│   ├── streak.ts                 # Consecutive days & weekly consistency logic
│   ├── exemptions.ts             # Exemption flag utilities (#exempt tags)
│   ├── date.ts                   # Timezone-aware date calculations (Asia/Jakarta)
│   ├── i18n/                     # Bilingual dictionary and context (id / en)
│   ├── theme/                    # Light / Dark mode context and cookie helpers
│   └── supabase/                 # Browser, server, and middleware Supabase clients
├── scripts/
│   └── test-parser.mjs           # Unit test suite for natural language parser
└── public/
    └── icons/                    # PWA application icons
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.18.0 or higher; v20+ recommended)
- [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), or [yarn](https://yarnpkg.com/)
- A free [Supabase](https://supabase.com/) account and project

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/your-username/personal-expense-tracker.git
cd personal-expense-tracker
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials:

```env
# Supabase Configuration (from Supabase Dashboard -> Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Optional: Timezone for server-rendered date calculations (Defaults to Asia/Jakarta)
NEXT_PUBLIC_TIMEZONE=Asia/Jakarta
```

### 3. Supabase Database & Auth Setup

1. Open your **Supabase Dashboard** $\rightarrow$ **SQL Editor** $\rightarrow$ **New Query**.
2. Copy and paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
   - This creates `expenses`, `split_bills`, `split_participants`, and `split_items` with appropriate Row Level Security (RLS) policies and indexes.
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

You can run parser test assertions locally:
```bash
node scripts/test-parser.mjs
```

---

## 🍕 Split Bill Workflow

1. Navigate to **Split Bill** (`/split`) and click **Buat Tagihan Baru**.
2. Choose between:
   - **Itemized Mode:** Input individual dishes/items and assign which friends shared each item.
   - **Equal Mode:** Split total cost equally across all participants.
3. Enter optional tax percentage, service fees, discounts, and cash rounding step (e.g., Rp 100).
4. Add payment instructions (Bank transfer / E-wallet / QRIS).
5. Share the generated link or QR code (`/split/[id]`). Friends can open the page on any device without logging in.
6. Check off settled payments, and click **Catat Bagian Saya ke Tracker** to automatically log your personal share into your expense tracker.

---

## 💰 Savings & Sinking Funds System

SakuTrack features a dedicated sinking fund manager (`/savings`):

- **Surplus Sweep:** At the end of a week with unused budget, sweep the remaining funds into savings with one click.
- **Sinking Goals:** Set up targeted savings buckets (e.g., emergency fund, gadgets, gifts).
- **Deficit Cover:** If an unexpected expense puts a past week over budget, use **Patch Week** to offset the deficit with your savings balance.
- **Audit Trail:** Every deposit, withdrawal, sweep, and allocation is recorded with an option to revert entries at any time.

---

## 🌐 Deployment

The project is preconfigured for deployment on [Vercel](https://vercel.com/):

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project in Vercel.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_TIMEZONE` *(optional, e.g. `Asia/Jakarta`)*
4. Ensure your Supabase Auth **Redirect URLs** include your production domain (e.g., `https://your-domain.vercel.app/auth/callback`).
5. Deploy!

`vercel.json` is configured to deploy serverless routes to the **Singapore (`sin1`)** region for minimal latency across Southeast Asia.

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
