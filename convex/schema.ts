import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(), // Hashed password
    name: v.string(),
    role: v.optional(v.string()), // "admin" or undefined/null for regular users
    last_active: v.optional(v.number()),
    created_at: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  goals: defineTable({
    user_id: v.id("users"),
    slug: v.string(),
    target_amount: v.number(),
    target_months: v.number(),
    start_date: v.optional(v.number()),
    required_monthly_savings: v.number(),
    required_weekly_savings: v.number(),
    required_daily_savings: v.number(),
    deadline: v.number(),
    created_at: v.number(),
  }).index("by_user", ["user_id"]).index("by_user_slug", ["user_id", "slug"]),

  wallets: defineTable({
    user_id: v.id("users"),
    slug: v.string(),
    name: v.string(),
    balance: v.number(),
    type: v.string(),
    created_at: v.number(),
  }).index("by_user", ["user_id"]).index("by_user_slug", ["user_id", "slug"]),

  transactions: defineTable({
    user_id: v.id("users"),
    goal_id: v.optional(v.id("goals")),
    debt_id: v.optional(v.id("debts")), // Link to debts
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer"), v.literal("savings"), v.literal("debt_payment")),
    category: v.string(),
    wallet_id: v.optional(v.id("wallets")),
    transfer_from_wallet_id: v.optional(v.id("wallets")),
    transfer_to_wallet_id: v.optional(v.id("wallets")),
    method: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_user", ["user_id"]).index("by_user_created", ["user_id", "created_at"]),

  analytics_cache: defineTable({
    user_id: v.id("users"),
    goal_id: v.optional(v.id("goals")),
    monthly_expense_total: v.number(),
    monthly_income_total: v.number(),
    net_savings: v.number(),
    progress_percentage: v.number(),
    last_updated: v.number(),
  }).index("by_user_goal", ["user_id", "goal_id"]),

  activities: defineTable({
    user_id: v.id("users"),
    type: v.string(), // "transaction", "wallet_create", "goal_create", etc.
    description: v.string(),
    amount: v.optional(v.number()), // For transactions/goals
    related_id: v.optional(v.string()), // ID of the related object
    created_at: v.number(),
  }).index("by_user_created", ["user_id", "created_at"]),

  plans: defineTable({
    user_id: v.id("users"),
    goal_id: v.id("goals"),
    title: v.string(),
    content: v.string(),
    status: v.string(), // "active", "completed", "archived"
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_user", ["user_id"]).index("by_goal", ["goal_id"]),

  debts: defineTable({
    user_id: v.id("users"),
    name: v.string(), // Person/Entity name
    type: v.union(v.literal("owed_to_you"), v.literal("owed_by_you")), // Lending vs Borrowing
    total_amount: v.number(), // Original loan amount
    remaining_amount: v.number(),
    interest_rate: v.optional(v.number()), // Annual %
    due_date: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.string(), // "active", "paid", "defaulted"
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_user", ["user_id"]).index("by_user_status", ["user_id", "status"]),

  debt_payments: defineTable({
    user_id: v.id("users"),
    debt_id: v.id("debts"),
    amount: v.number(),
    date: v.number(),
    transaction_id: v.optional(v.id("transactions")), // Link to main tx log
    notes: v.optional(v.string()),
  }).index("by_debt", ["debt_id"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  rate_limits: defineTable({
    identifier: v.string(), // IP or User ID
    count: v.number(),
    last_reset: v.number(),
    blocked_until: v.optional(v.number()),
  }).index("by_identifier", ["identifier"]),

  security_logs: defineTable({
    identifier: v.string(),
    action: v.string(), // "blocked", "captcha_challenge", "captcha_solved"
    reason: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  }).index("by_identifier", ["identifier"]),
});
