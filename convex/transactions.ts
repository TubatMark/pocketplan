import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

export const log = mutation({
  args: {
    userKey: v.string(),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer"), v.literal("savings"), v.literal("debt_payment")),
    category: v.string(),
    wallet_id: v.optional(v.id("wallets")),
    transfer_from_wallet_id: v.optional(v.id("wallets")),
    transfer_to_wallet_id: v.optional(v.id("wallets")),
    method: v.optional(v.string()),
    notes: v.optional(v.string()),
    goal_id: v.optional(v.id("goals")),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    // Server-side validation
    if (args.amount <= 0 || args.amount > 999999999) throw new Error("Amount must be between 1 and 999,999,999");
    if (!Number.isFinite(args.amount)) throw new Error("Invalid amount");
    if (args.category && args.category.length > 100) throw new Error("Category too long");
    if (args.notes && args.notes.length > 1000) throw new Error("Notes too long");

    const now = args.timestamp ?? Date.now();

    if (args.type === "savings" && !args.goal_id) {
      throw new Error("Savings transaction requires a goal");
    }

    if (args.type === "transfer") {
      if (!args.transfer_from_wallet_id || !args.transfer_to_wallet_id) throw new Error("Transfer requires from/to wallets");
      const from = await ctx.db.get(args.transfer_from_wallet_id);
      const to = await ctx.db.get(args.transfer_to_wallet_id);
      if (!from || !to) throw new Error("Wallet(s) not found");
      if (from.user_id !== user._id || to.user_id !== user._id) throw new Error("Forbidden");
      if (from.balance < args.amount) throw new Error("Insufficient funds");
      await ctx.db.patch(from._id, { balance: from.balance - args.amount });
      await ctx.db.patch(to._id, { balance: to.balance + args.amount });
      await ctx.db.insert("transactions", {
        user_id: user._id,
        goal_id: args.goal_id,
        amount: args.amount,
        type: "transfer",
        category: args.category,
        wallet_id: undefined,
        transfer_from_wallet_id: from._id,
        transfer_to_wallet_id: to._id,
        method: args.method,
        notes: args.notes,
        created_at: now,
      });

      // Log activity
      await ctx.db.insert("activities", {
        user_id: user._id,
        type: "transfer",
        description: `Transferred ${args.amount} from ${from.name} to ${to.name}`,
        amount: args.amount,
        created_at: now,
      });

      return;
    }

    if (!args.wallet_id) throw new Error("Wallet is required");
    const wallet = await ctx.db.get(args.wallet_id);
    if (!wallet || wallet.user_id !== user._id) throw new Error("Forbidden");

    const delta = args.type === "income" ? args.amount : -args.amount;
    const newBalance = wallet.balance + delta;
    if (newBalance < 0) throw new Error("Insufficient funds");
    await ctx.db.patch(wallet._id, { balance: newBalance });
    await ctx.db.insert("transactions", {
      user_id: user._id,
      goal_id: args.goal_id,
      amount: args.amount,
      type: args.type,
      category: args.category,
      wallet_id: wallet._id,
      transfer_from_wallet_id: undefined,
      transfer_to_wallet_id: undefined,
      method: args.method,
      notes: args.notes,
      created_at: now,
    });

    // Log activity
    await ctx.db.insert("activities", {
      user_id: user._id,
      type: args.type,
      description: `${args.type.charAt(0).toUpperCase() + args.type.slice(1).replace('_', ' ')}: ${args.category} (${wallet.name})`,
      amount: args.amount,
      related_id: wallet._id,
      created_at: now,
    });
  },
});

export const update = mutation({
  args: {
    userKey: v.string(),
    transactionId: v.id("transactions"),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const tx = await ctx.db.get(args.transactionId);
    if (!tx || tx.user_id !== user._id) throw new Error("Transaction not found");

    // Validation
    if (args.amount !== undefined) {
      if (args.amount <= 0 || args.amount > 999999999) throw new Error("Amount must be between 1 and 999,999,999");
      if (!Number.isFinite(args.amount)) throw new Error("Invalid amount");
    }
    if (args.category !== undefined && args.category.length > 100) throw new Error("Category too long");
    if (args.notes !== undefined && args.notes.length > 1000) throw new Error("Notes too long");

    const newAmount = args.amount ?? tx.amount;
    const amountDiff = newAmount - tx.amount;

    // If amount changed, reverse old wallet effect and apply new one
    if (amountDiff !== 0) {
      if (tx.type === "transfer") {
        // For transfers, adjust both wallets
        if (tx.transfer_from_wallet_id) {
          const from = await ctx.db.get(tx.transfer_from_wallet_id);
          if (from) {
            const newFromBalance = from.balance + tx.amount - newAmount; // reverse old, apply new
            if (newFromBalance < 0) throw new Error("Insufficient funds in source wallet after edit");
            await ctx.db.patch(from._id, { balance: newFromBalance });
          }
        }
        if (tx.transfer_to_wallet_id) {
          const to = await ctx.db.get(tx.transfer_to_wallet_id);
          if (to) {
            await ctx.db.patch(to._id, { balance: to.balance - tx.amount + newAmount });
          }
        }
      } else if (tx.wallet_id) {
        const wallet = await ctx.db.get(tx.wallet_id);
        if (wallet) {
          // Reverse old effect, apply new
          const oldDelta = tx.type === "income" ? tx.amount : -tx.amount;
          const newDelta = tx.type === "income" ? newAmount : -newAmount;
          const newBalance = wallet.balance - oldDelta + newDelta;
          if (newBalance < 0) throw new Error("Insufficient funds in wallet after edit");
          await ctx.db.patch(wallet._id, { balance: newBalance });
        }
      }
    }

    // Apply updates
    const updates: Record<string, any> = {};
    if (args.amount !== undefined) updates.amount = newAmount;
    if (args.category !== undefined) updates.category = args.category;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.transactionId, updates);

    // Log activity
    await ctx.db.insert("activities", {
      user_id: user._id,
      type: "transaction_edit",
      description: `Edited ${tx.type}: ${args.category ?? tx.category}${amountDiff !== 0 ? ` (₱${tx.amount} → ₱${newAmount})` : ""}`,
      amount: newAmount,
      related_id: args.transactionId,
      created_at: Date.now(),
    });
  },
});

export const list = query({
  args: { userKey: v.string(), from: v.optional(v.number()), to: v.optional(v.number()) },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];
    let q = ctx.db.query("transactions").withIndex("by_user_created", (ix: any) => ix.eq("user_id", user._id));
    const rows = await q.collect();
    return rows.filter((r: any) => (args.from ? r.created_at >= args.from : true) && (args.to ? r.created_at <= args.to : true));
  },
});

export const listByGoal = query({
  args: { userKey: v.string(), goalId: v.id("goals") },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];
    
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .filter((q: any) => q.eq(q.field("goal_id"), args.goalId))
      .collect();

    // Sort by created_at descending
    const sorted = transactions.sort((a: any, b: any) => b.created_at - a.created_at);

    // Enrich with wallet names
    const enriched = await Promise.all(sorted.map(async (t: any) => {
      let walletName = "Unknown Wallet";
      if (t.wallet_id) {
        const w = await ctx.db.get(t.wallet_id);
        if (w) walletName = w.name;
      } else if (t.transfer_from_wallet_id) {
        const w = await ctx.db.get(t.transfer_from_wallet_id);
        if (w) walletName = w.name;
      }
      return { ...t, walletName };
    }));

    return enriched;
  },
});
