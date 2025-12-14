import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

export const list = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];
    
    return await ctx.db
      .query("activities")
      .withIndex("by_user_created", (q: any) => q.eq("user_id", user._id))
      .order("desc")
      .take(100); // Increased limit for full history view
  },
});

export const log = mutation({
  args: {
    userKey: v.string(),
    type: v.string(),
    description: v.string(),
    amount: v.optional(v.number()),
    related_id: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    await ctx.db.insert("activities", {
      user_id: user._id,
      type: args.type,
      description: args.description,
      amount: args.amount,
      related_id: args.related_id,
      created_at: Date.now(),
    });
  },
});
