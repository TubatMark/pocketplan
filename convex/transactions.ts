import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

const txType = v.union(
  v.literal("income"),
  v.literal("expense"),
  v.literal("transfer"),
  v.literal("debt_payment")
);

const bucketType = v.union(
  v.literal("expense"),
  v.literal("savings"),
  v.literal("others")
);

export const log = mutation({
  args: {
    userKey: v.string(),
    amount: v.number(),
    type: txType,
    category: v.string(),
    bucket: v.optional(bucketType),
    category_id: v.optional(v.id("budget_categories")),
    wallet_id: v.optional(v.id("wallets")),
    transfer_from_wallet_id: v.optional(v.id("wallets")),
    transfer_to_wallet_id: v.optional(v.id("wallets")),
    method: v.optional(v.string()),
    notes: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    if (args.amount <= 0 || args.amount > 999999999)
      throw new Error("Amount must be between 1 and 999,999,999");
    if (!Number.isFinite(args.amount)) throw new Error("Invalid amount");
    if (args.category && args.category.length > 100)
      throw new Error("Category too long");
    if (args.notes && args.notes.length > 1000) throw new Error("Notes too long");

    const now = args.timestamp ?? Date.now();

    if (args.type === "transfer") {
      if (!args.transfer_from_wallet_id || !args.transfer_to_wallet_id)
        throw new Error("Transfer requires from/to wallets");
      const from = await ctx.db.get(args.transfer_from_wallet_id);
      const to = await ctx.db.get(args.transfer_to_wallet_id);
      if (!from || !to) throw new Error("Wallet(s) not found");
      if (from.user_id !== user._id || to.user_id !== user._id)
        throw new Error("Forbidden");
      if (from.balance < args.amount) throw new Error("Insufficient funds");
      await ctx.db.patch(from._id, { balance: from.balance - args.amount });
      await ctx.db.patch(to._id, { balance: to.balance + args.amount });
      return await ctx.db.insert("transactions", {
        user_id: user._id,
        amount: args.amount,
        type: "transfer",
        category: args.category || "Transfer",
        transfer_from_wallet_id: from._id,
        transfer_to_wallet_id: to._id,
        method: args.method,
        notes: args.notes,
        created_at: now,
      });
    }

    if (!args.wallet_id) throw new Error("Wallet is required");
    const wallet = await ctx.db.get(args.wallet_id);
    if (!wallet || wallet.user_id !== user._id) throw new Error("Forbidden");

    const delta = args.type === "income" ? args.amount : -args.amount;
    const newBalance = wallet.balance + delta;
    if (newBalance < 0) throw new Error("Insufficient funds");
    await ctx.db.patch(wallet._id, { balance: newBalance });

    return await ctx.db.insert("transactions", {
      user_id: user._id,
      amount: args.amount,
      type: args.type,
      category: args.category,
      bucket: args.bucket,
      category_id: args.category_id,
      wallet_id: wallet._id,
      method: args.method,
      notes: args.notes,
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
    bucket: v.optional(bucketType),
    category_id: v.optional(v.id("budget_categories")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const tx = await ctx.db.get(args.transactionId);
    if (!tx || tx.user_id !== user._id) throw new Error("Transaction not found");

    if (args.amount !== undefined) {
      if (args.amount <= 0 || args.amount > 999999999)
        throw new Error("Amount must be between 1 and 999,999,999");
      if (!Number.isFinite(args.amount)) throw new Error("Invalid amount");
    }
    if (args.category !== undefined && args.category.length > 100)
      throw new Error("Category too long");
    if (args.notes !== undefined && args.notes.length > 1000)
      throw new Error("Notes too long");

    const newAmount = args.amount ?? tx.amount;
    const amountDiff = newAmount - tx.amount;

    if (amountDiff !== 0) {
      if (tx.type === "transfer") {
        if (tx.transfer_from_wallet_id) {
          const from = await ctx.db.get(tx.transfer_from_wallet_id);
          if (from) {
            const newFromBalance = from.balance + tx.amount - newAmount;
            if (newFromBalance < 0)
              throw new Error("Insufficient funds in source wallet after edit");
            await ctx.db.patch(from._id, { balance: newFromBalance });
          }
        }
        if (tx.transfer_to_wallet_id) {
          const to = await ctx.db.get(tx.transfer_to_wallet_id);
          if (to) {
            await ctx.db.patch(to._id, {
              balance: to.balance - tx.amount + newAmount,
            });
          }
        }
      } else if (tx.wallet_id) {
        const wallet = await ctx.db.get(tx.wallet_id);
        if (wallet) {
          const oldDelta = tx.type === "income" ? tx.amount : -tx.amount;
          const newDelta = tx.type === "income" ? newAmount : -newAmount;
          const newBalance = wallet.balance - oldDelta + newDelta;
          if (newBalance < 0)
            throw new Error("Insufficient funds in wallet after edit");
          await ctx.db.patch(wallet._id, { balance: newBalance });
        }
      }
    }

    const updates: Record<string, any> = {};
    if (args.amount !== undefined) updates.amount = newAmount;
    if (args.category !== undefined) updates.category = args.category;
    if (args.bucket !== undefined) updates.bucket = args.bucket;
    if (args.category_id !== undefined) updates.category_id = args.category_id;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.transactionId, updates);
  },
});

export const remove = mutation({
  args: { userKey: v.string(), transactionId: v.id("transactions") },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const tx = await ctx.db.get(args.transactionId);
    if (!tx || tx.user_id !== user._id) throw new Error("Transaction not found");

    if (tx.type === "transfer") {
      if (tx.transfer_from_wallet_id) {
        const from = await ctx.db.get(tx.transfer_from_wallet_id);
        if (from) await ctx.db.patch(from._id, { balance: from.balance + tx.amount });
      }
      if (tx.transfer_to_wallet_id) {
        const to = await ctx.db.get(tx.transfer_to_wallet_id);
        if (to) await ctx.db.patch(to._id, { balance: to.balance - tx.amount });
      }
    } else if (tx.wallet_id) {
      const wallet = await ctx.db.get(tx.wallet_id);
      if (wallet) {
        const reverse = tx.type === "income" ? -tx.amount : tx.amount;
        await ctx.db.patch(wallet._id, { balance: wallet.balance + reverse });
      }
    }

    await ctx.db.delete(args.transactionId);
  },
});

export const list = query({
  args: {
    userKey: v.string(),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user_created", (ix: any) => ix.eq("user_id", user._id))
      .collect();
    return rows.filter(
      (r: any) =>
        (args.from ? r.created_at >= args.from : true) &&
        (args.to ? r.created_at <= args.to : true)
    );
  },
});
