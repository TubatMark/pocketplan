import { internalQueryGeneric as internalQuery, queryGeneric as query, mutationGeneric as mutation } from "convex/server";
import { v } from "convex/values";

export const exportData = internalQuery({
  args: {},
  handler: async (ctx: any) => {
    // Fetch all data from all tables
    const users = await ctx.db.query("users").collect();
    const wallets = await ctx.db.query("wallets").collect();
    const goals = await ctx.db.query("goals").collect();
    const transactions = await ctx.db.query("transactions").collect();
    const activities = await ctx.db.query("activities").collect();
    const debts = await ctx.db.query("debts").collect();
    const debt_payments = await ctx.db.query("debt_payments").collect();
    const plans = await ctx.db.query("plans").collect();

    return {
      timestamp: Date.now(),
      data: {
        users,
        wallets,
        goals,
        transactions,
        activities,
        debts,
        debt_payments,
        plans
      }
    };
  },
});

export const getSettings = query({
  args: {},
  handler: async (ctx: any) => {
    const daily = await ctx.db.query("settings").withIndex("by_key", (q: any) => q.eq("key", "backup_daily")).unique();
    const weekly = await ctx.db.query("settings").withIndex("by_key", (q: any) => q.eq("key", "backup_weekly")).unique();
    
    return {
      daily: daily?.value ?? true, // Default to true
      weekly: weekly?.value ?? true
    };
  },
});

export const updateSettings = mutation({
  args: {
    type: v.union(v.literal("daily"), v.literal("weekly")),
    enabled: v.boolean(),
  },
  handler: async (ctx: any, args: any) => {
    const key = `backup_${args.type}`;
    const existing = await ctx.db.query("settings").withIndex("by_key", (q: any) => q.eq("key", key)).unique();
    
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.enabled });
    } else {
      await ctx.db.insert("settings", { key, value: args.enabled });
    }
  },
});
