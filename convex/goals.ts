import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

function computeRequired(target_amount: number, target_months: number, start_date?: number) {
  const monthly = target_amount / target_months;
  const weekly = target_amount / (target_months * 4.345); // average weeks per month
  const daily = target_amount / (target_months * 30.437); // average days per month
  const start = start_date ?? Date.now();
  const deadline = new Date(start);
  deadline.setMonth(deadline.getMonth() + target_months);
  return {
    required_monthly_savings: monthly,
    required_weekly_savings: weekly,
    required_daily_savings: daily,
    deadline: deadline.getTime(),
  };
}

export const create = mutation({
  args: {
    userKey: v.string(),
    slug: v.string(),
    target_amount: v.number(),
    target_months: v.number(),
    start_date: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");
    const calc = computeRequired(args.target_amount, args.target_months, args.start_date);
    const id = await ctx.db.insert("goals", {
      user_id: user._id,
      slug: args.slug,
      target_amount: args.target_amount,
      target_months: args.target_months,
      start_date: args.start_date,
      required_monthly_savings: calc.required_monthly_savings,
      required_weekly_savings: calc.required_weekly_savings,
      required_daily_savings: calc.required_daily_savings,
      deadline: calc.deadline,
      created_at: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activities", {
      user_id: user._id,
      type: "goal_create",
      description: `Created goal: ${args.slug}`,
      amount: args.target_amount,
      related_id: id,
      created_at: Date.now(),
    });

    return id;
  },
});

export const update = mutation({
  args: {
    userKey: v.string(),
    goalId: v.id("goals"),
    target_amount: v.optional(v.number()),
    target_months: v.optional(v.number()),
    start_date: v.optional(v.number()),
    slug: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user || goal.user_id !== user._id) throw new Error("Forbidden");
    const target_amount = args.target_amount ?? goal.target_amount;
    const target_months = args.target_months ?? goal.target_months;
    const start_date = args.start_date ?? goal.start_date;
    const calc = computeRequired(target_amount, target_months, start_date);
    await ctx.db.patch(args.goalId, {
      target_amount,
      target_months,
      start_date,
      slug: args.slug ?? goal.slug,
      required_monthly_savings: calc.required_monthly_savings,
      required_weekly_savings: calc.required_weekly_savings,
      required_daily_savings: calc.required_daily_savings,
      deadline: calc.deadline,
    });

    // Log activity
    await ctx.db.insert("activities", {
      user_id: user._id,
      type: "goal_update",
      description: `Updated goal: ${args.slug ?? goal.slug}`,
      amount: target_amount,
      related_id: args.goalId,
      created_at: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { userKey: v.string(), goalId: v.id("goals") },
  handler: async (ctx: any, args: any) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Not found");
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user || goal.user_id !== user._id) throw new Error("Forbidden");
    await ctx.db.delete(args.goalId);

    // Log activity
    await ctx.db.insert("activities", {
      user_id: user._id,
      type: "goal_delete",
      description: `Deleted goal: ${goal.slug}`,
      related_id: args.goalId,
      created_at: Date.now(),
    });
  },
});

export const list = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];
    const goals = await ctx.db.query("goals").withIndex("by_user", (q: any) => q.eq("user_id", user._id)).collect();
    return goals;
  },
});

export const bySlug = query({
  args: { userKey: v.string(), slug: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return null;
    const goal = await ctx.db
      .query("goals")
      .withIndex("by_user_slug", (q: any) => q.eq("user_id", user._id).eq("slug", args.slug))
      .unique();
    return goal ?? null;
  },
});

export const progress = query({
  args: { userKey: v.string(), goalId: v.id("goals") },
  handler: async (ctx: any, args: any) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Not found");
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user || goal.user_id !== user._id) throw new Error("Forbidden");

    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .collect();

    const total_income = txs.filter((t: any) => t.type === "income").reduce((a: number, b: any) => a + b.amount, 0);
    const total_expense = txs.filter((t: any) => t.type === "expense").reduce((a: number, b: any) => a + b.amount, 0);
    const net_savings = total_income - total_expense;
    const progress_percentage = Math.min(100, (net_savings / goal.target_amount) * 100);
    const daysLeft = Math.max(0, Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24)));
    const required_daily = goal.required_daily_savings;
    const remaining_required_savings = Math.max(0, goal.target_amount - net_savings);
    const feasibility = {
      daysLeft,
      required_daily,
      remaining_required_savings,
      feasible: remaining_required_savings <= daysLeft * required_daily,
    };
    let projected_completion_date: number | null = null;
    const start = goal.start_date ?? goal.created_at;
    const daysSoFar = Math.max(1, Math.ceil((Date.now() - start) / (1000 * 60 * 60 * 24)));
    const avgPerDay = net_savings / daysSoFar;
    if (avgPerDay > 0) {
      const daysNeeded = Math.ceil((goal.target_amount - net_savings) / avgPerDay);
      projected_completion_date = Date.now() + daysNeeded * 24 * 60 * 60 * 1000;
    }
    return {
      total_income_logged: total_income,
      total_expense_logged: total_expense,
      net_savings,
      progress_percentage,
      projected_completion_date,
      feasibility,
    };
  },
});
