import { queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

// Single dashboard query: balances, this-month income/expense, today's expense,
// per-bucket budget progress, top categories, recent transactions, debts.
export const dashboard = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    const empty = {
      hasUser: false,
      totalBalance: 0,
      monthIncome: 0,
      monthExpense: 0,
      todayExpense: 0,
      yearMonth: "",
      hasBudget: false,
      budgetIncome: 0,
      buckets: [] as any[],
      topCategories: [] as any[],
      recentTransactions: [] as any[],
      outstandingDebt: 0,
      receivableDebt: 0,
      wallets: [] as any[],
    };

    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return empty;

    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).getTime();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [wallets, txs, debts, budget] = await Promise.all([
      ctx.db
        .query("wallets")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .collect(),
      ctx.db
        .query("transactions")
        .withIndex("by_user_created", (q: any) => q.eq("user_id", user._id))
        .collect(),
      ctx.db
        .query("debts")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .collect(),
      ctx.db
        .query("monthly_budgets")
        .withIndex("by_user_month", (q: any) =>
          q.eq("user_id", user._id).eq("year_month", ym)
        )
        .unique(),
    ]);

    const totalBalance = wallets.reduce((a: number, w: any) => a + w.balance, 0);

    const monthTxs = txs.filter(
      (t: any) => t.created_at >= startMonth && t.created_at <= endMonth
    );

    const monthIncome = monthTxs
      .filter((t: any) => t.type === "income")
      .reduce((a: number, t: any) => a + t.amount, 0);

    const monthExpense = monthTxs
      .filter((t: any) => t.type === "expense" || t.type === "debt_payment")
      .reduce((a: number, t: any) => a + t.amount, 0);

    const todayExpense = monthTxs
      .filter(
        (t: any) =>
          t.created_at >= todayStart &&
          t.created_at <= todayEnd &&
          (t.type === "expense" || t.type === "debt_payment")
      )
      .reduce((a: number, t: any) => a + t.amount, 0);

    const spentByBucket: Record<string, number> = {
      expense: 0,
      savings: 0,
      others: 0,
    };
    const spentByCategoryName: Record<string, number> = {};

    for (const t of monthTxs) {
      if (t.type === "income" || t.type === "transfer") continue;
      const b = t.bucket ?? "expense";
      spentByBucket[b] = (spentByBucket[b] ?? 0) + t.amount;
      const key = t.category || "Uncategorized";
      spentByCategoryName[key] = (spentByCategoryName[key] ?? 0) + t.amount;
    }

    const bucketBudgets = budget
      ? {
          expense: (budget.income * budget.expense_pct) / 100,
          savings: (budget.income * budget.savings_pct) / 100,
          others: (budget.income * budget.others_pct) / 100,
        }
      : { expense: 0, savings: 0, others: 0 };

    const buckets = (["expense", "savings", "others"] as const).map((key) => ({
      key,
      budget: bucketBudgets[key],
      spent: spentByBucket[key] ?? 0,
      pct:
        bucketBudgets[key] > 0
          ? Math.min(100, (spentByBucket[key] / bucketBudgets[key]) * 100)
          : 0,
    }));

    const topCategories = Object.entries(spentByCategoryName)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const recentTransactions = [...txs]
      .sort((a: any, b: any) => b.created_at - a.created_at)
      .slice(0, 8);

    const outstandingDebt = debts
      .filter((d: any) => d.type === "owed_by_you" && d.status === "active")
      .reduce((a: number, d: any) => a + d.remaining_amount, 0);
    const receivableDebt = debts
      .filter((d: any) => d.type === "owed_to_you" && d.status === "active")
      .reduce((a: number, d: any) => a + d.remaining_amount, 0);

    return {
      hasUser: true,
      totalBalance,
      monthIncome,
      monthExpense,
      todayExpense,
      yearMonth: ym,
      hasBudget: !!budget,
      budgetIncome: budget?.income ?? 0,
      buckets,
      topCategories,
      recentTransactions,
      outstandingDebt,
      receivableDebt,
      wallets,
    };
  },
});

// Day-by-day summary used by the calendar view: keyed by "YYYY-MM-DD".
export const monthCalendar = query({
  args: { userKey: v.string(), yearMonth: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return { yearMonth: args.yearMonth ?? "", days: {} };

    const ym =
      args.yearMonth ??
      (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })();
    const [y, m] = ym.split("-").map(Number);
    const start = new Date(y, m - 1, 1).getTime();
    const end = new Date(y, m, 0, 23, 59, 59, 999).getTime();

    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user_created", (q: any) => q.eq("user_id", user._id))
      .collect();

    const days: Record<
      string,
      { income: number; expense: number; transfer: number; count: number }
    > = {};
    for (const t of txs) {
      if (t.created_at < start || t.created_at > end) continue;
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!days[key]) days[key] = { income: 0, expense: 0, transfer: 0, count: 0 };
      days[key].count += 1;
      if (t.type === "income") days[key].income += t.amount;
      else if (t.type === "transfer") days[key].transfer += t.amount;
      else days[key].expense += t.amount; // expense + debt_payment
    }

    return { yearMonth: ym, days };
  },
});
