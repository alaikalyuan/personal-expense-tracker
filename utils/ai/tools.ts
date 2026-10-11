import { SupabaseClient } from "@supabase/supabase-js";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, subMonths } from "date-fns";
import type { CategoryKey } from "../i18n/dictionaries";

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export const AI_TOOLS: ToolDefinition[] = [
  // READ TOOLS
  {
    type: "function",
    function: {
      name: "search_expenses",
      description:
        "Cari dan filter riwayat pengeluaran pengguna berdasarkan kata kunci nama, kategori, rentang tanggal (dari/sampai), atau saku tertentu.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Kata kunci nama pengeluaran atau catatan (misal: 'kopi', 'bensin', 'makan siang').",
          },
          category: {
            type: "string",
            enum: ["Food & Dining", "Transportation", "Utilities", "Academics", "Entertainment", "Others"],
            description: "Filter berdasarkan kategori pengeluaran.",
          },
          start_date: {
            type: "string",
            description: "Tanggal awal format YYYY-MM-DD.",
          },
          end_date: {
            type: "string",
            description: "Tanggal akhir format YYYY-MM-DD.",
          },
          wallet_id: {
            type: "string",
            description: "UUID saku / dompet jika ingin membatasi pencarian.",
          },
          limit: {
            type: "number",
            description: "Jumlah maksimum hasil transaksi yang dikembalikan (default 20, maks 50).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_period_summary",
      description:
        "Dapatkan rincian total dan per-kategori pengeluaran untuk periode minggu atau bulan tertentu (misal: bulan Juli 2026 atau minggu ke-2 September).",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["week", "month"],
            description: "Jenis periode yang ingin dirangkum.",
          },
          date: {
            type: "string",
            description: "Tanggal referensi dalam periode tersebut (format YYYY-MM-DD atau YYYY-MM).",
          },
        },
        required: ["period", "date"],
      },
    },
  },

  // WRITE ACTION PROPOSAL TOOLS
  {
    type: "function",
    function: {
      name: "log_expenses",
      description:
        "Catat satu atau beberapa pengeluaran baru ke dalam aplikasi. Tindakan ini akan memunculkan kartu konfirmasi untuk disetujui pengguna.",
      parameters: {
        type: "object",
        properties: {
          expenses: {
            type: "array",
            description: "Daftar pengeluaran yang ingin dicatat.",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Nama atau judul pengeluaran (misal: 'Nasi Goreng', 'Bensin Motor')." },
                amount: { type: "number", description: "Nominal uang (angka positif, misal: 25000)." },
                category: {
                  type: "string",
                  enum: ["Food & Dining", "Transportation", "Utilities", "Academics", "Entertainment", "Others"],
                  description: "Kategori pengeluaran.",
                },
                spent_at: { type: "string", description: "Tanggal transaksi YYYY-MM-DD (default hari ini)." },
                note: { type: "string", description: "Catatan opsional." },
                wallet_id: { type: "string", description: "ID Saku tujuan (opsional, jika tidak diisi masuk saku utama)." },
              },
              required: ["name", "amount", "category"],
            },
          },
        },
        required: ["expenses"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_expense",
      description:
        "Ubah data transaksi pengeluaran yang sudah ada (berdasarkan ID transaksi). Menampilkan kartu konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          expense_id: { type: "string", description: "UUID transaksi pengeluaran yang ingin diubah." },
          name: { type: "string", description: "Nama baru (opsional)." },
          amount: { type: "number", description: "Nominal baru (opsional)." },
          category: {
            type: "string",
            enum: ["Food & Dining", "Transportation", "Utilities", "Academics", "Entertainment", "Others"],
            description: "Kategori baru (opsional).",
          },
          spent_at: { type: "string", description: "Tanggal baru YYYY-MM-DD (opsional)." },
          note: { type: "string", description: "Catatan baru (opsional)." },
          wallet_id: { type: "string", description: "Pindah ke saku lain (opsional)." },
        },
        required: ["expense_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_expense",
      description:
        "Hapus transaksi pengeluaran berdasarkan ID. Menampilkan kartu konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          expense_id: { type: "string", description: "UUID transaksi yang ingin dihapus." },
        },
        required: ["expense_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_expense_exempt",
      description:
        "Tandai atau hapus tanda pengecualian (one-off / pengeluaran langka tak berulang) pada transaksi agar tidak membebani anggaran operasional rutin. Menampilkan kartu konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          expense_id: { type: "string", description: "UUID transaksi yang ingin diatur." },
          is_exempt: { type: "boolean", description: "true jika ingin mengecualikan, false jika reguler." },
        },
        required: ["expense_id", "is_exempt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_budget",
      description:
        "Ubah target anggaran mingguan atau bulanan (secara global atau untuk saku tertentu). Menampilkan kartu konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          cadence: { type: "string", enum: ["week", "month"], description: "Periode anggaran (week/month)." },
          amount: { type: "number", description: "Besaran nominal anggaran baru." },
          wallet_id: { type: "string", description: "UUID saku khusus jika multi-saku aktif (opsional)." },
        },
        required: ["cadence", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_savings_goal",
      description:
        "Buat target tabungan baru (Savings Goal). Menampilkan kartu konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nama target tabungan (misal: 'Dana Darurat', 'Liburan Bali')." },
          target_amount: { type: "number", description: "Target nominal tabungan (angka positif)." },
          emoji: { type: "string", description: "Emoji representasi (misal: 🏖️, 🚗, 🛡️)." },
        },
        required: ["name", "target_amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "allocate_savings_to_goal",
      description:
        "Alokasikan sejumlah dana dari simpanan umum ke target tabungan tertentu. Menampilkan kartu konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          goal_id: { type: "string", description: "UUID target tabungan." },
          amount: { type: "number", description: "Nominal yang ingin dialokasikan." },
        },
        required: ["goal_id", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "withdraw_savings_from_goal",
      description:
        "Tarik kembali dana dari target tabungan ke simpanan bebas. Menampilkan kartu konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          goal_id: { type: "string", description: "UUID target tabungan." },
          amount: { type: "number", description: "Nominal yang ditarik." },
        },
        required: ["goal_id", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sweep_surplus_to_savings",
      description:
        "Pindahkan surplus sisa anggaran belanja saat ini langsung ke tabungan (Sweep to Savings). Menampilkan kartu konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Nominal surplus yang disapu ke tabungan." },
          target_goal_id: { type: "string", description: "UUID target tabungan tujuan (opsional)." },
        },
        required: ["amount"],
      },
    },
  },
];

export type AiActionName =
  | "log_expenses"
  | "update_expense"
  | "delete_expense"
  | "set_expense_exempt"
  | "set_budget"
  | "create_savings_goal"
  | "allocate_savings_to_goal"
  | "withdraw_savings_from_goal"
  | "sweep_surplus_to_savings";

export interface AiProposalPreviewLine {
  label: string;
  before?: string;
  after: string;
}

export interface AiProposal {
  id: string;
  action: AiActionName;
  args: Record<string, unknown>;
  preview: {
    title: string;
    lines: AiProposalPreviewLine[];
  };
  status: "pending" | "confirmed" | "cancelled" | "failed";
  error?: string;
}

// READ TOOL EXECUTORS
export async function executeReadTool(
  supabase: SupabaseClient,
  userId: string,
  toolName: string,
  rawArgs: Record<string, unknown>
): Promise<string> {
  if (toolName === "search_expenses") {
    const query = typeof rawArgs.query === "string" ? rawArgs.query.trim() : "";
    const category = typeof rawArgs.category === "string" ? rawArgs.category.trim() : "";
    const startDate = typeof rawArgs.start_date === "string" ? rawArgs.start_date.trim() : "";
    const endDate = typeof rawArgs.end_date === "string" ? rawArgs.end_date.trim() : "";
    const walletId = typeof rawArgs.wallet_id === "string" ? rawArgs.wallet_id.trim() : "";
    const limit = Math.min(Math.max(Number(rawArgs.limit) || 20, 1), 50);

    let dbQuery = supabase
      .from("expenses")
      .select("id, name, amount, category, spent_at, note, wallet_id")
      .eq("user_id", userId);

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,note.ilike.%${query}%`);
    }
    if (category) {
      dbQuery = dbQuery.eq("category", category);
    }
    if (startDate) {
      dbQuery = dbQuery.gte("spent_at", startDate);
    }
    if (endDate) {
      dbQuery = dbQuery.lte("spent_at", endDate);
    }
    if (walletId) {
      dbQuery = dbQuery.eq("wallet_id", walletId);
    }

    const { data, error } = await dbQuery
      .order("spent_at", { ascending: false })
      .limit(limit);

    if (error) {
      return JSON.stringify({ error: error.message });
    }

    const rows = data || [];
    const totalAmount = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

    return JSON.stringify({
      count: rows.length,
      total_amount: totalAmount,
      results: rows,
    });
  }

  if (toolName === "get_period_summary") {
    const period = rawArgs.period === "week" ? "week" : "month";
    const dateStr = typeof rawArgs.date === "string" ? rawArgs.date : format(new Date(), "yyyy-MM-dd");
    const refDate = parseISO(dateStr.length === 7 ? `${dateStr}-01` : dateStr);

    let startStr: string;
    let endStr: string;

    if (period === "week") {
      const sw = startOfWeek(refDate, { weekStartsOn: 1 });
      const ew = endOfWeek(refDate, { weekStartsOn: 1 });
      startStr = format(sw, "yyyy-MM-dd");
      endStr = format(ew, "yyyy-MM-dd");
    } else {
      const sm = startOfMonth(refDate);
      const em = endOfMonth(refDate);
      startStr = format(sm, "yyyy-MM-dd");
      endStr = format(em, "yyyy-MM-dd");
    }

    const { data, error } = await supabase
      .from("expenses")
      .select("amount, category, spent_at")
      .eq("user_id", userId)
      .gte("spent_at", startStr)
      .lte("spent_at", endStr);

    if (error) {
      return JSON.stringify({ error: error.message });
    }

    const expenses = data || [];
    let total = 0;
    const catTotals: Record<string, number> = {};

    for (const exp of expenses) {
      const amt = Number(exp.amount || 0);
      total += amt;
      catTotals[exp.category] = (catTotals[exp.category] || 0) + amt;
    }

    return JSON.stringify({
      period,
      start_date: startStr,
      end_date: endStr,
      total_spent: total,
      transaction_count: expenses.length,
      by_category: catTotals,
    });
  }

  return JSON.stringify({ error: `Tool ${toolName} not supported` });
}

// PROPOSAL VALIDATOR & NORMALIZER
export async function buildAiProposal(
  supabase: SupabaseClient,
  userId: string,
  toolName: AiActionName,
  rawArgs: Record<string, unknown>
): Promise<AiProposal | null> {
  const proposalId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `prop-${Date.now()}`;

  if (toolName === "log_expenses") {
    const rawList = Array.isArray(rawArgs.expenses) ? rawArgs.expenses : [];
    if (rawList.length === 0) return null;

    const validatedItems: Array<{
      name: string;
      amount: number;
      category: CategoryKey;
      spent_at?: string;
      note?: string | null;
      wallet_id?: string | null;
    }> = [];

    const lines: AiProposalPreviewLine[] = [];

    for (const item of rawList.slice(0, 10)) {
      const name = String(item.name || "").trim();
      const amount = Math.max(0, Math.round(Number(item.amount) || 0));
      if (!name || amount <= 0) continue;

      const category = (item.category || "Others") as CategoryKey;
      const spentAt = typeof item.spent_at === "string" ? item.spent_at : undefined;
      const note = typeof item.note === "string" ? item.note : null;
      const walletId = typeof item.wallet_id === "string" ? item.wallet_id : null;

      validatedItems.push({ name, amount, category, spent_at: spentAt, note, wallet_id: walletId });
      lines.push({
        label: `${name} • ${category}`,
        after: `Rp ${amount.toLocaleString()}`,
      });
    }

    if (validatedItems.length === 0) return null;

    return {
      id: proposalId,
      action: "log_expenses",
      args: { expenses: validatedItems },
      preview: {
        title: `Catat ${validatedItems.length} Pengeluaran`,
        lines,
      },
      status: "pending",
    };
  }

  if (toolName === "update_expense") {
    const expenseId = String(rawArgs.expense_id || "").trim();
    if (!expenseId) return null;

    const { data: existing } = await supabase
      .from("expenses")
      .select("id, name, amount, category, spent_at, note, wallet_id")
      .eq("id", expenseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) return null;

    const lines: AiProposalPreviewLine[] = [];
    const updateArgs: Record<string, unknown> = { expense_id: expenseId };

    if (rawArgs.name && String(rawArgs.name).trim() !== existing.name) {
      const newName = String(rawArgs.name).trim();
      updateArgs.name = newName;
      lines.push({ label: "Nama", before: existing.name, after: newName });
    }
    if (rawArgs.amount !== undefined && Number(rawArgs.amount) !== Number(existing.amount)) {
      const newAmt = Math.max(0, Math.round(Number(rawArgs.amount)));
      updateArgs.amount = newAmt;
      lines.push({
        label: "Nominal",
        before: `Rp ${Number(existing.amount).toLocaleString()}`,
        after: `Rp ${newAmt.toLocaleString()}`,
      });
    }
    if (rawArgs.category && String(rawArgs.category) !== existing.category) {
      updateArgs.category = String(rawArgs.category);
      lines.push({ label: "Kategori", before: existing.category, after: String(rawArgs.category) });
    }
    if (rawArgs.spent_at && String(rawArgs.spent_at) !== existing.spent_at) {
      updateArgs.spent_at = String(rawArgs.spent_at);
      lines.push({ label: "Tanggal", before: existing.spent_at, after: String(rawArgs.spent_at) });
    }
    if (rawArgs.note !== undefined && String(rawArgs.note) !== (existing.note || "")) {
      updateArgs.note = String(rawArgs.note);
      lines.push({ label: "Catatan", before: existing.note || "-", after: String(rawArgs.note) });
    }

    if (lines.length === 0) return null;

    return {
      id: proposalId,
      action: "update_expense",
      args: updateArgs,
      preview: {
        title: `Ubah Pengeluaran: ${existing.name}`,
        lines,
      },
      status: "pending",
    };
  }

  if (toolName === "delete_expense") {
    const expenseId = String(rawArgs.expense_id || "").trim();
    if (!expenseId) return null;

    const { data: existing } = await supabase
      .from("expenses")
      .select("id, name, amount, category, spent_at")
      .eq("id", expenseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) return null;

    return {
      id: proposalId,
      action: "delete_expense",
      args: { expense_id: expenseId },
      preview: {
        title: `Hapus Pengeluaran`,
        lines: [
          { label: "Transaksi", after: `${existing.name} (Rp ${Number(existing.amount).toLocaleString()})` },
          { label: "Kategori", after: existing.category },
          { label: "Tanggal", after: existing.spent_at },
        ],
      },
      status: "pending",
    };
  }

  if (toolName === "set_expense_exempt") {
    const expenseId = String(rawArgs.expense_id || "").trim();
    const isExempt = Boolean(rawArgs.is_exempt);
    if (!expenseId) return null;

    const { data: existing } = await supabase
      .from("expenses")
      .select("id, name, amount")
      .eq("id", expenseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) return null;

    return {
      id: proposalId,
      action: "set_expense_exempt",
      args: { expense_id: expenseId, is_exempt: isExempt },
      preview: {
        title: isExempt ? "Tandai sebagai Pengecualian" : "Hapus Tanda Pengecualian",
        lines: [
          { label: "Transaksi", after: `${existing.name} (Rp ${Number(existing.amount).toLocaleString()})` },
          {
            label: "Status Anggaran",
            after: isExempt
              ? "Dikecualikan dari anggaran belanja rutin (One-off)"
              : "Dihitung kembali dalam anggaran rutin",
          },
        ],
      },
      status: "pending",
    };
  }

  if (toolName === "set_budget") {
    const cadence = rawArgs.cadence === "month" ? "month" : "week";
    const amount = Math.max(0, Math.round(Number(rawArgs.amount) || 0));
    const walletId = typeof rawArgs.wallet_id === "string" ? rawArgs.wallet_id : undefined;
    if (amount <= 0) return null;

    let sakuName = "Utama";
    if (walletId) {
      const { data: w } = await supabase.from("wallets").select("name").eq("id", walletId).maybeSingle();
      if (w?.name) sakuName = w.name;
    }

    return {
      id: proposalId,
      action: "set_budget",
      args: { cadence, amount, wallet_id: walletId },
      preview: {
        title: `Ubah Target Anggaran ${cadence === "week" ? "Mingguan" : "Bulanan"}`,
        lines: [
          { label: "Saku / Dompet", after: sakuName },
          { label: "Nominal Baru", after: `Rp ${amount.toLocaleString()}` },
        ],
      },
      status: "pending",
    };
  }

  if (toolName === "create_savings_goal") {
    const name = String(rawArgs.name || "").trim();
    const targetAmount = Math.max(0, Math.round(Number(rawArgs.target_amount) || 0));
    const emoji = String(rawArgs.emoji || "🎯").trim();
    if (!name || targetAmount <= 0) return null;

    return {
      id: proposalId,
      action: "create_savings_goal",
      args: { name, target_amount: targetAmount, emoji },
      preview: {
        title: `Buat Target Tabungan Baru`,
        lines: [
          { label: "Nama Target", after: `${emoji} ${name}` },
          { label: "Nominal Target", after: `Rp ${targetAmount.toLocaleString()}` },
        ],
      },
      status: "pending",
    };
  }

  if (toolName === "allocate_savings_to_goal" || toolName === "withdraw_savings_from_goal") {
    const goalId = String(rawArgs.goal_id || "").trim();
    const amount = Math.max(0, Math.round(Number(rawArgs.amount) || 0));
    if (!goalId || amount <= 0) return null;

    const { data: goal } = await supabase
      .from("savings_goals")
      .select("name, emoji, allocated_amount")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    const goalName = goal ? `${goal.emoji || "🎯"} ${goal.name}` : "Target Tabungan";
    const isAllocate = toolName === "allocate_savings_to_goal";

    return {
      id: proposalId,
      action: toolName,
      args: { goal_id: goalId, amount },
      preview: {
        title: isAllocate ? `Alokasikan ke Tabungan` : `Tarik dari Tabungan`,
        lines: [
          { label: "Target", after: goalName },
          { label: "Nominal", after: `Rp ${amount.toLocaleString()}` },
          ...(goal
            ? [
                {
                  label: "Saldo Sekarang",
                  after: `Rp ${Number(goal.allocated_amount || 0).toLocaleString()}`,
                },
              ]
            : []),
        ],
      },
      status: "pending",
    };
  }

  if (toolName === "sweep_surplus_to_savings") {
    const amount = Math.max(0, Math.round(Number(rawArgs.amount) || 0));
    const targetGoalId = typeof rawArgs.target_goal_id === "string" ? rawArgs.target_goal_id : undefined;
    if (amount <= 0) return null;

    return {
      id: proposalId,
      action: "sweep_surplus_to_savings",
      args: { amount, target_goal_id: targetGoalId },
      preview: {
        title: `Sapu Sisa Anggaran ke Tabungan`,
        lines: [
          { label: "Nominal Pindahan", after: `Rp ${amount.toLocaleString()}` },
          { label: "Tujuan", after: "Simpanan Bebas (Stash Wallet)" },
        ],
      },
      status: "pending",
    };
  }

  return null;
}

