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

    const updates: Record<string, string> = {};

    if (args.name !== undefined) {
      const trimmed = args.name.trim();
      if (trimmed.length < 1 || trimmed.length > 100) throw new Error("Name must be 1-100 characters");
      updates.name = trimmed;
    }

    if (args.email !== undefined) {
      const email = args.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email format");

      // Check uniqueness if email is changing
      if (email !== user.email) {
        const existing = await ctx.db
          .query("users")
          .withIndex("by_email", (q: any) => q.eq("email", email))
          .unique();
        if (existing) throw new Error("Email already in use");
      }
      updates.email = email;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return user._id;
  },
});
