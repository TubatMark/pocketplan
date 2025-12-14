import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

export const list = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];
    return await ctx.db.query("wallets").withIndex("by_user", (q: any) => q.eq("user_id", user._id)).collect();
  },
});

export const create = mutation({
  args: { userKey: v.string(), name: v.string(), slug: v.string(), type: v.string(), balance: v.number() },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");
    const id = await ctx.db.insert("wallets", {
      user_id: user._id,
      slug: args.slug,
      name: args.name,
      type: args.type,
      balance: Math.max(0, args.balance),
      created_at: Date.now(),
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      user_id: user._id,
      type: "wallet_create",
      description: `Created wallet: ${args.name}`,
      amount: args.balance,
      related_id: id,
      created_at: Date.now(),
    });

    return id;
  },
});

export const update = mutation({
  args: { userKey: v.string(), walletId: v.id("wallets"), name: v.optional(v.string()), slug: v.optional(v.string()), type: v.optional(v.string()), balance: v.optional(v.number()) },
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

    // Log activity
    await ctx.db.insert("activities", {
      user_id: user._id,
      type: "wallet_update",
      description: `Updated wallet: ${args.name ?? wallet.name}`,
      amount: args.balance ?? wallet.balance,
      related_id: args.walletId,
      created_at: Date.now(),
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
    await ctx.db.delete(args.walletId);

    // Log activity
    await ctx.db.insert("activities", {
      user_id: user._id,
      type: "wallet_delete",
      description: `Deleted wallet: ${wallet.name}`,
      related_id: args.walletId,
      created_at: Date.now(),
    });
  },
});
