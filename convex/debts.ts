import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

export const list = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];
    return await ctx.db
      .query("debts")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .collect();
  },
});

export const create = mutation({
  args: {
    userKey: v.string(),
    name: v.string(),
    type: v.union(v.literal("owed_to_you"), v.literal("owed_by_you")),
    total_amount: v.number(),
    interest_rate: v.optional(v.number()),
    due_date: v.optional(v.number()),
    notes: v.optional(v.string()),
    walletId: v.optional(v.id("wallets")),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    if (!args.name || args.name.trim().length === 0)
      throw new Error("Name is required");
    if (args.name.length > 200) throw new Error("Name too long");
    if (args.total_amount <= 0 || args.total_amount > 999999999)
      throw new Error("Amount must be between 1 and 999,999,999");
    if (
      args.interest_rate !== undefined &&
      (args.interest_rate < 0 || args.interest_rate > 100)
    )
      throw new Error("Interest rate must be 0-100%");
    if (args.notes && args.notes.length > 1000)
      throw new Error("Notes too long");

    if (args.walletId) {
      const wallet = await ctx.db.get(args.walletId);
      if (!wallet || wallet.user_id !== user._id)
        throw new Error("Wallet not found");

      if (args.type === "owed_to_you") {
        if (wallet.balance < args.total_amount) {
          throw new Error(
            `Insufficient funds in ${wallet.name}. Available: ₱${wallet.balance}`
          );
        }
        await ctx.db.patch(wallet._id, {
          balance: wallet.balance - args.total_amount,
        });
        await ctx.db.insert("transactions", {
          user_id: user._id,
          amount: args.total_amount,
          type: "expense",
          category: "Debt Creation",
          bucket: "expense",
          wallet_id: wallet._id,
          created_at: Date.now(),
          notes: `Lent to ${args.name}`,
        });
      } else {
        await ctx.db.patch(wallet._id, {
          balance: wallet.balance + args.total_amount,
        });
        await ctx.db.insert("transactions", {
          user_id: user._id,
          amount: args.total_amount,
          type: "income",
          category: "Loan Proceeds",
          wallet_id: wallet._id,
          created_at: Date.now(),
          notes: `Borrowed from ${args.name}`,
        });
      }
    }

    return await ctx.db.insert("debts", {
      user_id: user._id,
      name: args.name,
      type: args.type,
      total_amount: args.total_amount,
      remaining_amount: args.total_amount,
      interest_rate: args.interest_rate,
      due_date: args.due_date,
      notes: args.notes,
      status: "active",
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    userKey: v.string(),
    debtId: v.id("debts"),
    name: v.optional(v.string()),
    total_amount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.user_id !== user._id) throw new Error("Debt not found");

    const updates: any = { updated_at: Date.now() };
    if (args.name) updates.name = args.name;
    if (args.notes) updates.notes = args.notes;

    if (args.total_amount !== undefined) {
      const delta = args.total_amount - debt.total_amount;
      updates.total_amount = args.total_amount;
      updates.remaining_amount = Math.max(0, debt.remaining_amount + delta);

      if (updates.remaining_amount === 0) updates.status = "paid";
      else if (debt.status === "paid" && updates.remaining_amount > 0)
        updates.status = "active";
    }

    await ctx.db.patch(debt._id, updates);
  },
});

export const remove = mutation({
  args: { userKey: v.string(), debtId: v.id("debts") },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.user_id !== user._id) throw new Error("Debt not found");

    const payments = await ctx.db
      .query("debt_payments")
      .withIndex("by_debt", (q: any) => q.eq("debt_id", debt._id))
      .collect();
    for (const p of payments) await ctx.db.delete(p._id);

    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .collect();
    for (const tx of txs) {
      if (tx.debt_id === debt._id) {
        await ctx.db.patch(tx._id, { debt_id: undefined });
      }
    }

    await ctx.db.delete(debt._id);
  },
});

export const makePayment = mutation({
  args: {
    userKey: v.string(),
    debtId: v.id("debts"),
    amount: v.number(),
    walletId: v.optional(v.id("wallets")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.user_id !== user._id) throw new Error("Debt not found");
    if (args.amount <= 0) throw new Error("Invalid amount");

    const newRemaining = Math.max(0, debt.remaining_amount - args.amount);
    const newStatus = newRemaining === 0 ? "paid" : "active";

    await ctx.db.patch(debt._id, {
      remaining_amount: newRemaining,
      status: newStatus,
      updated_at: Date.now(),
    });

    let txId: any = undefined;
    if (args.walletId) {
      const wallet = await ctx.db.get(args.walletId);
      if (!wallet || wallet.user_id !== user._id)
        throw new Error("Wallet not found");

      const isExpense = debt.type === "owed_by_you";
      const newBalance = isExpense
        ? wallet.balance - args.amount
        : wallet.balance + args.amount;
      if (newBalance < 0) throw new Error(`Insufficient funds in ${wallet.name}`);
      await ctx.db.patch(wallet._id, { balance: newBalance });

      txId = await ctx.db.insert("transactions", {
        user_id: user._id,
        debt_id: debt._id,
        amount: args.amount,
        type: isExpense ? "debt_payment" : "income",
        category: isExpense ? "Debt Payment" : "Debt Received",
        bucket: isExpense ? "expense" : undefined,
        wallet_id: wallet._id,
        created_at: Date.now(),
        notes: args.notes,
      });
    }

    await ctx.db.insert("debt_payments", {
      user_id: user._id,
      debt_id: debt._id,
      amount: args.amount,
      date: Date.now(),
      transaction_id: txId,
      notes: args.notes,
    });
  },
});

export const getPayments = query({
  args: { userKey: v.string(), debtId: v.id("debts") },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];

    const payments = await ctx.db
      .query("debt_payments")
      .withIndex("by_debt", (q: any) => q.eq("debt_id", args.debtId))
      .collect();

    return payments.sort((a: any, b: any) => b.date - a.date);
  },
});
