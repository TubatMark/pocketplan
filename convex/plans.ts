import { mutationGeneric as mutation, queryGeneric as query, actionGeneric as action } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

// --- Queries & Mutations ---

export const getGoalContext = query({
  args: { userKey: v.string(), goalId: v.id("goals") },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.user_id !== user._id) throw new Error("Goal not found");

    // Fetch recent transactions related to this goal
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .filter((q: any) => q.eq(q.field("goal_id"), args.goalId))
      .collect();

    // Fetch wallets to see available funds
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .collect();

    return { goal, transactions, wallets };
  },
});

export const savePlan = mutation({
  args: { 
    userKey: v.string(), 
    goalId: v.id("goals"), 
    title: v.string(), 
    content: v.string() 
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    // Check if plan exists for this goal
    const existing = await ctx.db
      .query("plans")
      .withIndex("by_goal", (q: any) => q.eq("goal_id", args.goalId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        content: args.content,
        updated_at: Date.now(),
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("plans", {
        user_id: user._id,
        goal_id: args.goalId,
        title: args.title,
        content: args.content,
        status: "active",
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      return id;
    }
  },
});

export const getPlan = query({
  args: { userKey: v.string(), goalId: v.id("goals") },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return null;

    return await ctx.db
      .query("plans")
      .withIndex("by_goal", (q: any) => q.eq("goal_id", args.goalId))
      .unique();
  },
});

// --- Actions ---

export const generate = action({
  args: { userKey: v.string(), goalId: v.id("goals") },
  handler: async (ctx: any, args: any) => {
    // 1. Fetch Context
    const context = await ctx.runQuery("plans:getGoalContext" as any, { 
      userKey: args.userKey, 
      goalId: args.goalId 
    });

    const { goal, transactions, wallets } = context;

    // 2. Prepare Prompt
    const systemPrompt = `You are an expert financial planner AI. Your goal is to create a detailed, step-by-step plan to help the user achieve their financial goal.
    
    Data Provided:
    - Goal: ${goal.slug}
    - Target Amount: ${goal.target_amount}
    - Target Date: ${new Date(goal.deadline).toDateString()}
    - Current Savings for Goal: ${transactions.reduce((acc: number, t: any) => t.type === 'income' || t.type === 'savings' || (t.type === 'transfer' && t.transfer_to_wallet_id) ? acc + t.amount : acc - t.amount, 0)}
    - Available Wallets: ${wallets.map((w: any) => `${w.name} (${w.balance})`).join(", ")}
    
    Output Format:
    Return a Markdown formatted response with:
    1. Executive Summary
    2. Step-by-Step Action Plan (Timeline based)
    3. Monthly/Weekly Savings Targets
    4. Tips to optimize spending based on the goal.
    `;

    // 3. Call Grok API
    // Note: In production, use process.env.GROK_API_KEY
    const GROK_API_KEY = process.env.GROK_API_KEY; 
    
    if (!GROK_API_KEY) {
      throw new Error("GROK_API_KEY is not defined");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate my financial plan." }
        ],
        temperature: 1,
        max_tokens: 8192,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const json = await response.json();
    const planContent = json.choices[0]?.message?.content || "Failed to generate plan.";

    // 4. Save Plan
    await ctx.runMutation("plans:savePlan" as any, {
      userKey: args.userKey,
      goalId: args.goalId,
      title: `Plan for ${goal.slug}`,
      content: planContent,
    });

    return planContent;
  },
});
