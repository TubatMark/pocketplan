import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

export const list = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .collect();
  },
});

export const create = mutation({
  args: {
    userKey: v.string(),
    name: v.string(),
    slug: v.string(),
    type: v.string(),
    balance: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    if (!args.name || args.name.trim().length === 0)
      throw new Error("Wallet name is required");
    if (args.name.length > 100) throw new Error("Name too long");
    if (args.balance < 0 || args.balance > 999999999)
      throw new Error("Balance must be between 0 and 999,999,999");
    if (!Number.isFinite(args.balance)) throw new Error("Invalid balance");

    return await ctx.db.insert("wallets", {
      user_id: user._id,
      slug: args.slug,
      name: args.name,
      type: args.type,
      balance: Math.max(0, args.balance),
      created_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    userKey: v.string(),
    walletId: v.id("wallets"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    type: v.optional(v.string()),
    balance: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const wallet = await ctx.db.get(args.walletId);
    if (!wallet) throw new Error("Not found");
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user || wallet.user_id !== user._id) throw new Error("Forbidden");
    await ctx.db.patch(args.walletId, {
      name: args.name ?? wallet.name,
      slug: args.slug ?? wallet.slug,
      type: args.type ?? wallet.type,
      balance: args.balance ?? wallet.balance,
    });
  },
});

export const remove = mutation({
  args: { userKey: v.string(), walletId: v.id("wallets") },
  handler: async (ctx: any, args: any) => {
    const wallet = await ctx.db.get(args.walletId);
    if (!wallet) throw new Error("Not found");
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user || wallet.user_id !== user._id) throw new Error("Forbidden");

    if (wallet.balance > 0)
      throw new Error(
        "Cannot delete a wallet with remaining balance. Transfer or withdraw funds first."
      );

    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .collect();
    for (const tx of txs) {
      if (
        tx.wallet_id === args.walletId ||
        tx.transfer_from_wallet_id === args.walletId ||
        tx.transfer_to_wallet_id === args.walletId
      ) {
        await ctx.db.patch(tx._id, {
          ...(tx.wallet_id === args.walletId ? { wallet_id: undefined } : {}),
          ...(tx.transfer_from_wallet_id === args.walletId
            ? { transfer_from_wallet_id: undefined }
            : {}),
          ...(tx.transfer_to_wallet_id === args.walletId
            ? { transfer_to_wallet_id: undefined }
            : {}),
        });
      }
    }

    await ctx.db.delete(args.walletId);
  },
});
