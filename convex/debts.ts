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
    walletId: v.optional(v.id("wallets")), // Optional: link to wallet deduction
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    // 1. Handle Wallet Transaction (Optional)
    if (args.walletId) {
      const wallet = await ctx.db.get(args.walletId);
      if (!wallet || wallet.user_id !== user._id) throw new Error("Wallet not found");

      if (args.type === "owed_to_you") {
        // Lending money: Expense (Deduct from wallet)
        if (wallet.balance < args.total_amount) {
          throw new Error(`Insufficient funds in ${wallet.name}. Available: ₱${wallet.balance}`);
        }
        await ctx.db.patch(wallet._id, { balance: wallet.balance - args.total_amount });
        
        await ctx.db.insert("transactions", {
          user_id: user._id,
          amount: args.total_amount,
          type: "expense",
          category: "Debt Creation",
          wallet_id: wallet._id,
          created_at: Date.now(),
          notes: `Lent to ${args.name}`,
        });

      } else if (args.type === "owed_by_you") {
        // Borrowing money: Income (Add to wallet)
        await ctx.db.patch(wallet._id, { balance: wallet.balance + args.total_amount });

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

    const id = await ctx.db.insert("debts", {
      user_id: user._id,
      name: args.name,
      type: args.type,
      total_amount: args.total_amount,
      remaining_amount: args.total_amount, // Start with full amount
      interest_rate: args.interest_rate,
      due_date: args.due_date,
      notes: args.notes,
      status: "active",
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Log Activity
    await ctx.db.insert("activities", {
      user_id: user._id,
      type: "debt_create",
      description: args.type === "owed_by_you" 
        ? `Borrowed ₱${args.total_amount} from ${args.name}`
        : `Lent ₱${args.total_amount} to ${args.name}`,
      amount: args.total_amount,
      related_id: id,
      created_at: Date.now(),
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
    
    // If total amount changes, adjust remaining amount by the same delta
    if (args.total_amount !== undefined) {
      const delta = args.total_amount - debt.total_amount;
      updates.total_amount = args.total_amount;
      updates.remaining_amount = Math.max(0, debt.remaining_amount + delta);
      
      // Update status if it becomes paid or active again
      if (updates.remaining_amount === 0) updates.status = "paid";
      else if (debt.status === "paid" && updates.remaining_amount > 0) updates.status = "active";
    }

    await ctx.db.patch(debt._id, updates);
  },
});

export const remove = mutation({
  args: {
    userKey: v.string(),
    debtId: v.id("debts"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.user_id !== user._id) throw new Error("Debt not found");

    // Delete related payments? Or keep them as orphans? 
    // Usually safer to delete or archive. Let's delete for MVP cleanup.
    const payments = await ctx.db.query("debt_payments")
      .withIndex("by_debt", (q: any) => q.eq("debt_id", debt._id))
      .collect();
    
    for (const p of payments) {
      await ctx.db.delete(p._id);
    }

    await ctx.db.delete(debt._id);
  },
});

export const makePayment = mutation({
  args: {
    userKey: v.string(),
    debtId: v.id("debts"),
    amount: v.number(),
    walletId: v.optional(v.id("wallets")), // Optional: link to wallet deduction
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.user_id !== user._id) throw new Error("Debt not found");

    if (args.amount <= 0) throw new Error("Invalid amount");

    // 1. Update Debt Balance
    const newRemaining = Math.max(0, debt.remaining_amount - args.amount);
    const newStatus = newRemaining === 0 ? "paid" : "active";

    await ctx.db.patch(debt._id, {
      remaining_amount: newRemaining,
      status: newStatus,
      updated_at: Date.now(),
    });

    // 2. Log in main Transaction Log (if wallet involved)
    let txId = undefined;
    if (args.walletId) {
      const wallet = await ctx.db.get(args.walletId);
      if (wallet && wallet.user_id === user._id) {
        // If I owe money (owed_by_you), paying it is an EXPENSE
        // If someone owes me (owed_to_you), receiving it is INCOME
        const type = debt.type === "owed_by_you" ? "expense" : "income";
        const newBalance = type === "income" ? wallet.balance + args.amount : wallet.balance - args.amount;

        await ctx.db.patch(wallet._id, { balance: newBalance });

        txId = await ctx.db.insert("transactions", {
          user_id: user._id,
          debt_id: debt._id,
          amount: args.amount,
          type: "debt_payment", // Special type or map to inc/exp? Let's use debt_payment for clarity but track flow
          category: "Debt Payment",
          wallet_id: wallet._id,
          created_at: Date.now(),
          notes: args.notes,
        });
      }
    }

    // 3. Log in Debt Payments Table
    await ctx.db.insert("debt_payments", {
      user_id: user._id,
      debt_id: debt._id,
      amount: args.amount,
      date: Date.now(),
      transaction_id: txId,
      notes: args.notes,
    });

    // 4. Log Activity
    await ctx.db.insert("activities", {
      user_id: user._id,
      type: "debt_payment",
      description: debt.type === "owed_by_you" 
        ? `Paid ₱${args.amount} to ${debt.name}`
        : `Received ₱${args.amount} from ${debt.name}`,
      amount: args.amount,
      related_id: debt._id,
      created_at: Date.now(),
    });
  },
});

export const getPayments = query({
  args: {
    userKey: v.string(),
    debtId: v.id("debts"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];

    const payments = await ctx.db.query("debt_payments")
      .withIndex("by_debt", (q: any) => q.eq("debt_id", args.debtId))
      .collect();

    // Sort descending by date
    return payments.sort((a: any, b: any) => b.date - a.date);
  },
});
