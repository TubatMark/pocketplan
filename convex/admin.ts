import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

// Reusing the simple hash from auth.ts (in a real app, import shared logic)
function hashPassword(password: string) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// 1. Seed Admin User
export const seedAdmin = mutation({
  args: {},
  handler: async (ctx: any) => {
    const email = "admin@admin.com";
    const password = "admin123";

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .unique();

    if (existing) {
        // Ensure role is set
        if (existing.role !== "admin") {
            await ctx.db.patch(existing._id, { role: "admin" });
            return "Updated existing user to admin";
        }
        return "Admin already exists";
    }

    await ctx.db.insert("users", {
      email,
      password: hashPassword(password),
      name: "System Administrator",
      role: "admin",
      created_at: Date.now(),
    });

    return "Admin created successfully";
  },
});

// Helper: Ensure caller is admin
async function ensureAdmin(ctx: any, userKey: string) {
    const user = await getUserFromToken(ctx, userKey);
    if (!user || user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
    }
    return user;
}

// 2. Dashboard Stats
export const getDashboardStats = query({
    args: { userKey: v.string() },
    handler: async (ctx: any, args: any) => {
        await ensureAdmin(ctx, args.userKey);

        const users = await ctx.db.query("users").collect();
        const totalUsers = users.length;
        
        // Active in last 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        // If last_active is not set, fallback to created_at for recently created users
        const activeUsers = users.filter((u: any) => 
            (u.last_active && u.last_active > thirtyDaysAgo) || 
            u.created_at > thirtyDaysAgo
        ).length;

        const inactiveUsers = totalUsers - activeUsers;

        // System Performance (Mocked for now, but could be DB size, request count etc)
        // Let's get total transactions as a proxy for system load
        const totalTransactions = (await ctx.db.query("transactions").collect()).length;

        return {
            totalUsers,
            activeUsers,
            inactiveUsers,
            totalTransactions,
            performanceScore: 98, // Mock score
        };
    }
});

// 3. User Management
export const getUsers = query({
    args: { userKey: v.string() },
    handler: async (ctx: any, args: any) => {
        await ensureAdmin(ctx, args.userKey);
        // Return all users (Pagination should be added for large datasets)
        return await ctx.db.query("users").order("desc").collect();
    }
});

export const updateUserRole = mutation({
    args: { userKey: v.string(), userId: v.id("users"), role: v.string() },
    handler: async (ctx: any, args: any) => {
        await ensureAdmin(ctx, args.userKey);
        await ctx.db.patch(args.userId, { role: args.role });
    }
});

export const deleteUser = mutation({
    args: { userKey: v.string(), userId: v.id("users") },
    handler: async (ctx: any, args: any) => {
        const admin = await ensureAdmin(ctx, args.userKey);
        if (admin._id === args.userId) {
            throw new Error("Cannot delete yourself");
        }
        await ctx.db.delete(args.userId);
        // Clean up related data (cascade delete would be better)
        // For MVP, leaving related data orphaned or cleaning up later
    }
});

// 4. System Reset (Maintenance)
export const resetData = mutation({
  args: {},
  handler: async (ctx: any) => {
    // Intentionally no admin check here to allow easy reset via CLI without needing a token
    // In production, this should DEFINITELY be protected or removed
    
    const tables = [
      "goals",
      "wallets",
      "transactions",
      "analytics_cache",
      "activities",
      "plans",
      "debts",
      "debt_payments",
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

    return `All data (except users and sessions) has been cleared. Deleted ${count} records.`;
  },
});
