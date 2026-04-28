import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

async function hashPassword(password: string, salt?: string): Promise<string> {
  const passwordSalt = salt ?? crypto.randomUUID();
  const data = new TextEncoder().encode(passwordSalt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${passwordSalt}:${hashHex}`;
}

export const seedAdmin = mutation({
  args: {
    email: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const email = (args.email ?? "admin@admin.com").trim().toLowerCase();
    const password = args.password ?? "admin123";

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .unique();

    if (existing) {
      if (existing.role !== "admin") {
        await ctx.db.patch(existing._id, { role: "admin" });
        return "Updated existing user to admin";
      }
      return "Admin already exists";
    }

    await ctx.db.insert("users", {
      email,
      password: await hashPassword(password),
      name: "System Administrator",
      role: "admin",
      created_at: Date.now(),
    });

    return "Admin created successfully";
  },
});

export const promoteToAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { role: "admin" });
    return `User ${args.email} promoted to admin`;
  },
});

async function ensureAdmin(ctx: any, userKey: string) {
  const user = await getUserFromToken(ctx, userKey);
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

export const getDashboardStats = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    await ensureAdmin(ctx, args.userKey);

    const users = await ctx.db.query("users").collect();
    const totalUsers = users.length;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeUsers = users.filter(
      (u: any) =>
        (u.last_active && u.last_active > thirtyDaysAgo) ||
        u.created_at > thirtyDaysAgo
    ).length;
    const inactiveUsers = totalUsers - activeUsers;

    const totalTransactions = (await ctx.db.query("transactions").collect()).length;
    const performanceScore =
      totalUsers > 0 ? Math.min(100, Math.round((activeUsers / totalUsers) * 100)) : 0;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalTransactions,
      performanceScore,
    };
  },
});

export const getUsers = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    await ensureAdmin(ctx, args.userKey);
    return await ctx.db.query("users").order("desc").collect();
  },
});

export const updateUserRole = mutation({
  args: { userKey: v.string(), userId: v.id("users"), role: v.string() },
  handler: async (ctx: any, args: any) => {
    await ensureAdmin(ctx, args.userKey);
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

const USER_DATA_TABLES = [
  "wallets",
  "transactions",
  "debts",
  "debt_payments",
  "monthly_budgets",
  "budget_categories",
] as const;

export const deleteUser = mutation({
  args: { userKey: v.string(), userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    const admin = await ensureAdmin(ctx, args.userKey);
    if (admin._id === args.userId) {
      throw new Error("Cannot delete yourself");
    }

    for (const table of USER_DATA_TABLES) {
      const records = await ctx.db
        .query(table)
        .withIndex("by_user", (q: any) => q.eq("user_id", args.userId))
        .collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(args.userId);
  },
});

// Wipes all transactional/budget data. Useful when redeploying with a new schema.
// Preserves users and sessions so you can sign back in.
export const resetData = mutation({
  args: { userKey: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    if (args.userKey) {
      await ensureAdmin(ctx, args.userKey);
    }

    const tables = [
      "wallets",
      "transactions",
      "debts",
      "debt_payments",
      "monthly_budgets",
      "budget_categories",
      "settings",
      "rate_limits",
      "security_logs",
    ];

    let count = 0;
    for (const table of tables) {
      const records = await ctx.db.query(table).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
        count++;
      }
    }

    return `Cleared ${count} records across ${tables.length} tables. Users and sessions preserved.`;
  },
});
