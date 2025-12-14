import { queryGeneric as query, mutationGeneric as mutation } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

export const me = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    return await getUserFromToken(ctx, args.userKey);
  },
});

export const updateProfile = mutation({
  args: { userKey: v.string(), email: v.optional(v.string()), name: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");
    
    await ctx.db.patch(user._id, {
      email: args.email ?? user.email,
      name: args.name ?? user.name,
    });
    return user._id;
  },
});
