import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

const bucketType = v.union(
  v.literal("expense"),
  v.literal("savings"),
  v.literal("others")
);

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function previousYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const prev = new Date(y, m - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

async function loadBudgetForMonth(ctx: any, userId: any, yearMonth: string) {
  const budget = await ctx.db
    .query("monthly_budgets")
    .withIndex("by_user_month", (q: any) =>
      q.eq("user_id", userId).eq("year_month", yearMonth)
    )
    .unique();
  if (!budget) return null;

  const categories = await ctx.db
    .query("budget_categories")
    .withIndex("by_budget", (q: any) => q.eq("budget_id", budget._id))
    .collect();

  const sorted = categories.sort(
    (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
  );
  return { ...budget, categories: sorted };
}

export const get = query({
  args: { userKey: v.string(), yearMonth: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return null;
    const ym = args.yearMonth ?? currentYearMonth();
    return await loadBudgetForMonth(ctx, user._id, ym);
  },
});

export const list = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];
    const budgets = await ctx.db
      .query("monthly_budgets")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .collect();
    return budgets.sort((a: any, b: any) =>
      a.year_month < b.year_month ? 1 : -1
    );
  },
});

const categoryInput = v.object({
  bucket: bucketType,
  name: v.string(),
  amount: v.number(),
});

export const save = mutation({
  args: {
    userKey: v.string(),
    yearMonth: v.optional(v.string()),
    income: v.number(),
    expense_pct: v.number(),
    savings_pct: v.number(),
    others_pct: v.number(),
    categories: v.array(categoryInput),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    if (args.income < 0 || args.income > 999999999)
      throw new Error("Income must be between 0 and 999,999,999");
    const sum = args.expense_pct + args.savings_pct + args.others_pct;
    if (Math.abs(sum - 100) > 0.5)
      throw new Error("Percentages must sum to 100");
    [args.expense_pct, args.savings_pct, args.others_pct].forEach((p: number) => {
      if (p < 0 || p > 100) throw new Error("Each percentage must be 0-100");
    });

    for (const c of args.categories) {
      if (!c.name || c.name.trim().length === 0)
        throw new Error("Category name required");
      if (c.name.length > 60) throw new Error("Category name too long");
      if (c.amount < 0 || c.amount > 999999999)
        throw new Error("Category amount out of range");
    }

    const ym = args.yearMonth ?? currentYearMonth();
    const now = Date.now();

    const existing = await ctx.db
      .query("monthly_budgets")
      .withIndex("by_user_month", (q: any) =>
        q.eq("user_id", user._id).eq("year_month", ym)
      )
      .unique();

    let budgetId: any;
    if (existing) {
      await ctx.db.patch(existing._id, {
        income: args.income,
        expense_pct: args.expense_pct,
        savings_pct: args.savings_pct,
        others_pct: args.others_pct,
        updated_at: now,
      });
      budgetId = existing._id;

      // Replace categories
      const oldCats = await ctx.db
        .query("budget_categories")
        .withIndex("by_budget", (q: any) => q.eq("budget_id", budgetId))
        .collect();
      for (const c of oldCats) await ctx.db.delete(c._id);
    } else {
      budgetId = await ctx.db.insert("monthly_budgets", {
        user_id: user._id,
        year_month: ym,
        income: args.income,
        expense_pct: args.expense_pct,
        savings_pct: args.savings_pct,
        others_pct: args.others_pct,
        created_at: now,
        updated_at: now,
      });
    }

    let order = 0;
    for (const c of args.categories) {
      await ctx.db.insert("budget_categories", {
        budget_id: budgetId,
        user_id: user._id,
        bucket: c.bucket,
        name: c.name.trim(),
        amount: c.amount,
        order: order++,
        created_at: now,
      });
    }

    return budgetId;
  },
});

export const copyFromPrevious = mutation({
  args: { userKey: v.string(), yearMonth: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const targetMonth = args.yearMonth ?? currentYearMonth();
    const prevMonth = previousYearMonth(targetMonth);

    const prev = await loadBudgetForMonth(ctx, user._id, prevMonth);
    if (!prev) throw new Error("No budget found for previous month");

    const existing = await ctx.db
      .query("monthly_budgets")
      .withIndex("by_user_month", (q: any) =>
        q.eq("user_id", user._id).eq("year_month", targetMonth)
      )
      .unique();
    if (existing) throw new Error("A budget already exists for this month");

    const now = Date.now();
    const newId = await ctx.db.insert("monthly_budgets", {
      user_id: user._id,
      year_month: targetMonth,
      income: prev.income,
      expense_pct: prev.expense_pct,
      savings_pct: prev.savings_pct,
      others_pct: prev.others_pct,
      created_at: now,
      updated_at: now,
    });

    let order = 0;
    for (const c of prev.categories) {
      await ctx.db.insert("budget_categories", {
        budget_id: newId,
        user_id: user._id,
        bucket: c.bucket,
        name: c.name,
        amount: c.amount,
        order: order++,
        created_at: now,
      });
    }

    return newId;
  },
});

export const remove = mutation({
  args: { userKey: v.string(), yearMonth: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const budget = await ctx.db
      .query("monthly_budgets")
      .withIndex("by_user_month", (q: any) =>
        q.eq("user_id", user._id).eq("year_month", args.yearMonth)
      )
      .unique();
    if (!budget) return;

    const cats = await ctx.db
      .query("budget_categories")
      .withIndex("by_budget", (q: any) => q.eq("budget_id", budget._id))
      .collect();
    for (const c of cats) await ctx.db.delete(c._id);
    await ctx.db.delete(budget._id);
  },
});

// Returns budget vs actual spend for the given month, broken down per bucket
// and per category. Useful for both the dashboard summary and the budget page.
export const summary = query({
  args: { userKey: v.string(), yearMonth: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return null;

    const ym = args.yearMonth ?? currentYearMonth();
    const [y, m] = ym.split("-").map(Number);
    const start = new Date(y, m - 1, 1).getTime();
    const end = new Date(y, m, 0, 23, 59, 59, 999).getTime();

    const budget = await loadBudgetForMonth(ctx, user._id, ym);
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user_created", (q: any) => q.eq("user_id", user._id))
      .collect();

    const monthTxs = txs.filter(
      (t: any) => t.created_at >= start && t.created_at <= end
    );

    const buckets = ["expense", "savings", "others"] as const;
    const spendByBucket: Record<string, number> = {
      expense: 0,
      savings: 0,
      others: 0,
    };
    const spendByCategoryId: Record<string, number> = {};
    const spendByCategoryName: Record<string, number> = {};

    for (const tx of monthTxs) {
      if (tx.type === "income" || tx.type === "transfer") continue;
      const bucket = tx.bucket ?? "expense"; // debt_payment defaults to expense
      spendByBucket[bucket] = (spendByBucket[bucket] ?? 0) + tx.amount;
      if (tx.category_id) {
        spendByCategoryId[tx.category_id] =
          (spendByCategoryId[tx.category_id] ?? 0) + tx.amount;
      }
      const key = (tx.category || "Uncategorized").toLowerCase();
      spendByCategoryName[key] = (spendByCategoryName[key] ?? 0) + tx.amount;
    }

    const bucketAmounts = budget
      ? {
          expense: (budget.income * budget.expense_pct) / 100,
          savings: (budget.income * budget.savings_pct) / 100,
          others: (budget.income * budget.others_pct) / 100,
        }
      : { expense: 0, savings: 0, others: 0 };

    const categoryRows = budget
      ? budget.categories.map((c: any) => ({
          id: c._id,
          bucket: c.bucket,
          name: c.name,
          amount: c.amount,
          spent: spendByCategoryId[c._id] ?? 0,
        }))
      : [];

    const monthIncome = monthTxs
      .filter((t: any) => t.type === "income")
      .reduce((a: number, t: any) => a + t.amount, 0);

    return {
      yearMonth: ym,
      hasBudget: !!budget,
      income: budget?.income ?? 0,
      monthIncome,
      buckets: buckets.map((b) => ({
        key: b,
        budget: bucketAmounts[b],
        spent: spendByBucket[b],
        pct:
          bucketAmounts[b] > 0
            ? Math.min(100, (spendByBucket[b] / bucketAmounts[b]) * 100)
            : 0,
      })),
      categories: categoryRows,
      topCategoriesByName: Object.entries(spendByCategoryName)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    };
  },
});
