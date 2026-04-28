import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.optional(v.string()),
    last_active: v.optional(v.number()),
    created_at: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  wallets: defineTable({
    user_id: v.id("users"),
    slug: v.string(),
    name: v.string(),
    balance: v.number(),
    type: v.string(),
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_slug", ["user_id", "slug"]),

  // Monthly budget plans. One row per user per calendar month.
  monthly_budgets: defineTable({
    user_id: v.id("users"),
    year_month: v.string(), // "YYYY-MM"
    income: v.number(),
    expense_pct: v.number(),
    savings_pct: v.number(),
    others_pct: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_month", ["user_id", "year_month"]),

  // User-defined sub-categories under each bucket of a monthly budget.
  budget_categories: defineTable({
    budget_id: v.id("monthly_budgets"),
    user_id: v.id("users"),
    bucket: v.union(v.literal("expense"), v.literal("savings"), v.literal("others")),
    name: v.string(),
    amount: v.number(),
    order: v.optional(v.number()),
    created_at: v.number(),
  })
    .index("by_budget", ["budget_id"])
    .index("by_user", ["user_id"]),

  transactions: defineTable({
    user_id: v.id("users"),
    debt_id: v.optional(v.id("debts")),
    amount: v.number(),
    type: v.union(
      v.literal("income"),
      v.literal("expense"),
      v.literal("transfer"),
      v.literal("debt_payment")
    ),
    category: v.string(), // name snapshot
    bucket: v.optional(
      v.union(v.literal("expense"), v.literal("savings"), v.literal("others"))
    ),
    category_id: v.optional(v.id("budget_categories")),
    wallet_id: v.optional(v.id("wallets")),
    transfer_from_wallet_id: v.optional(v.id("wallets")),
    transfer_to_wallet_id: v.optional(v.id("wallets")),
    method: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_created", ["user_id", "created_at"]),

  debts: defineTable({
    user_id: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("owed_to_you"), v.literal("owed_by_you")),
    total_amount: v.number(),
    remaining_amount: v.number(),
    interest_rate: v.optional(v.number()),
    due_date: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_status", ["user_id", "status"]),

  debt_payments: defineTable({
    user_id: v.id("users"),
    debt_id: v.id("debts"),
    amount: v.number(),
    date: v.number(),
    transaction_id: v.optional(v.id("transactions")),
    notes: v.optional(v.string()),
  })
    .index("by_debt", ["debt_id"])
    .index("by_user", ["user_id"]),

  settings: defineTable({
    key: v.string(),
    value: v.union(v.string(), v.number(), v.boolean()),
  }).index("by_key", ["key"]),

  rate_limits: defineTable({
    identifier: v.string(),
    count: v.number(),
    last_reset: v.number(),
    blocked_until: v.optional(v.number()),
  }).index("by_identifier", ["identifier"]),

  security_logs: defineTable({
    identifier: v.string(),
    action: v.string(),
    reason: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        count: v.optional(v.number()),
        limit: v.optional(v.number()),
      })
    ),
    timestamp: v.number(),
  }).index("by_identifier", ["identifier"]),
});
