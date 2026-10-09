import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDate,
} from "date-fns";
import { getNowInTimezone } from "@/utils/date";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please log in to use the AI advisor." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { messages = [], apiKeyOverride, language = "id" } = body;

    // Resolve DeepSeek API Key (hybrid override > server environment)
    const apiKey =
      apiKeyOverride && typeof apiKeyOverride === "string" && apiKeyOverride.trim().length > 0
        ? apiKeyOverride.trim()
        : process.env.DEEPSEEK_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "MISSING_API_KEY",
          message:
            "DeepSeek API key is not configured. Set DEEPSEEK_API_KEY in .env.local or enter your personal key in AI settings.",
        },
        { status: 400 }
      );
    }

    const now = getNowInTimezone();
    const currentDay = getDate(now);
    const totalDaysInMonth = getDaysInMonth(now);
    const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 });
    const startOfMonthDate = startOfMonth(now);
    const endOfMonthDate = endOfMonth(now);

    const startOfWeekStr = format(startOfWeekDate, "yyyy-MM-dd");
    const startOfMonthStr = format(startOfMonthDate, "yyyy-MM-dd");
    const endOfMonthStr = format(endOfMonthDate, "yyyy-MM-dd");

    // Fetch user recent expenses & period expenses
    const [expensesRes, recentExpensesRes, subscriptionsRes, walletsRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("amount, category, spent_at")
        .eq("user_id", user.id)
        .gte("spent_at", startOfMonthStr)
        .lte("spent_at", endOfMonthStr),
      supabase
        .from("expenses")
        .select("id, name, amount, category, spent_at, note")
        .eq("user_id", user.id)
        .order("spent_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("subscriptions")
        .select("name, price, billing_cycle, category, status")
        .eq("user_id", user.id)
        .eq("status", "active"),
      supabase
        .from("wallets")
        .select("name, kind, currency, weekly_budget, monthly_budget, opening_balance")
        .eq("user_id", user.id)
        .is("archived_at", null),
    ]);

    const monthExpenses = expensesRes.data || [];
    const recentExpenses = recentExpensesRes.data || [];
    const subscriptions = subscriptionsRes.data || [];
    const wallets = walletsRes.data || [];

    // Calculate period stats
    let totalSpentMonth = 0;
    let totalSpentWeek = 0;
    const categoryTotals: Record<string, number> = {};

    for (const exp of monthExpenses) {
      const amt = Number(exp.amount) || 0;
      totalSpentMonth += amt;
      const spentDate = exp.spent_at ? exp.spent_at.split("T")[0] : "";
      if (spentDate >= startOfWeekStr) {
        totalSpentWeek += amt;
      }
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
    }

    // Determine budgets
    const userWeeklyBudget = Number(user.user_metadata?.weekly_budget || 500000);
    const userMonthlyBudget = Number(
      user.user_metadata?.monthly_budget || Math.round((userWeeklyBudget / 7) * totalDaysInMonth)
    );

    const totalSubCommitmentMonthly = subscriptions.reduce((acc, sub) => {
      const p = Number(sub.price) || 0;
      if (sub.billing_cycle === "monthly") return acc + p;
      if (sub.billing_cycle === "yearly") return acc + Math.round(p / 12);
      if (sub.billing_cycle === "weekly") return acc + Math.round(p * 4.33);
      return acc + p;
    }, 0);

    const baseCurrency = wallets[0]?.currency || "IDR";
    const daysRemainingInMonth = Math.max(0, totalDaysInMonth - currentDay);

    // Build financial snapshot context string
    const categorySummary = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => {
        const pct = totalSpentMonth > 0 ? Math.round((amt / totalSpentMonth) * 100) : 0;
        return `- ${cat}: ${amt.toLocaleString()} (${pct}%)`;
      })
      .join("\n");

    const recentTxSummary = recentExpenses
      .slice(0, 30)
      .map((e) => {
        return `- ${e.spent_at}: ${e.name} [${e.category}] -> ${Number(e.amount).toLocaleString()}${
          e.note ? ` ("${e.note}")` : ""
        }`;
      })
      .join("\n");

    const subSummary =
      subscriptions.length > 0
        ? subscriptions
            .map((s) => `- ${s.name}: ${Number(s.price).toLocaleString()} / ${s.billing_cycle}`)
            .join("\n")
        : "No active subscriptions tracked.";

    const systemPrompt = `You are "SakuTrack AI", an empathetic, highly intelligent, and objective personal financial assistant embedded inside the SakuTrack expense tracker app.

USER'S REAL-TIME FINANCIAL CONTEXT:
- Base Currency: ${baseCurrency}
- Current Date: ${format(now, "yyyy-MM-dd")} (Day ${currentDay} of ${totalDaysInMonth} in the month)
- Days Remaining in Month: ${daysRemainingInMonth} days
- Monthly Budget: ${userMonthlyBudget.toLocaleString()} ${baseCurrency}
- Total Spent This Month (MTD): ${totalSpentMonth.toLocaleString()} ${baseCurrency} (${
      userMonthlyBudget > 0 ? Math.round((totalSpentMonth / userMonthlyBudget) * 100) : 0
    }% of monthly budget)
- Weekly Budget: ${userWeeklyBudget.toLocaleString()} ${baseCurrency}
- Total Spent This Week: ${totalSpentWeek.toLocaleString()} ${baseCurrency} (${
      userWeeklyBudget > 0 ? Math.round((totalSpentWeek / userWeeklyBudget) * 100) : 0
    }% of weekly budget)
- Total Active Monthly Subscriptions: ${totalSubCommitmentMonthly.toLocaleString()} ${baseCurrency}/month

SPENDING BY CATEGORY (This Month):
${categorySummary || "No expenses recorded this month yet."}

ACTIVE RECURRING SUBSCRIPTIONS:
${subSummary}

RECENT INDIVIDUAL TRANSACTIONS (Latest ${Math.min(30, recentExpenses.length)} items):
${recentTxSummary || "No recent transactions found."}

RESPONSE GUIDELINES:
1. LANGUAGE: The user's interface language is set to "${
      language === "id" ? "Bahasa Indonesia" : "English"
    }". You MUST answer in ${
      language === "id"
        ? "Bahasa Indonesia yang bersahabat, jelas, dan natural"
        : "clear, encouraging, and natural English"
    }.
2. ROLE: You are an analytical, constructive, and realistic financial advisor. Praise good spending habits, give constructive warnings if they are pacing over budget, point out large anomalous expenses, and offer actionable cost-cutting suggestions.
3. CONCISENESS & FORMATTING: Keep responses concise, well-structured, and readable on mobile devices. Use markdown bullet points, bold key numbers, and short paragraphs. When presenting comparisons or budget scenarios in a table, use standard GitHub Flavored Markdown table format with a blank line before and after, placing each row on its own separate line (never merge multiple table rows onto a single line). Do not write endless walls of text.
4. HONESTY: Always reference their actual numbers from the context above. If they have no expenses or budget set, kindly encourage them to record them.
5. SAFETY: You provide budgeting insights and personal finance habits, not certified legal or investment advice.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10),
    ];

    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

    const deepseekResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: apiMessages,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!deepseekResponse.ok) {
      const errText = await deepseekResponse.text().catch(() => "");
      let errMsg = `DeepSeek API returned error ${deepseekResponse.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          errMsg = parsed.error.message;
        }
      } catch {
        // use fallback errMsg
      }
      return NextResponse.json(
        { error: "DEEPSEEK_API_ERROR", message: errMsg },
        { status: deepseekResponse.status }
      );
    }

    return new Response(deepseekResponse.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to process AI request",
      },
      { status: 500 }
    );
  }
}
