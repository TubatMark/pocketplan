import { queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

export const walletHistory = query({
  args: { 
    userKey: v.string(), 
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    walletId: v.optional(v.string())
  },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return [];

    const wallets = await ctx.db.query("wallets")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .collect();

    let txs = await ctx.db.query("transactions")
      .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
      .collect();
    
    // Sort transactions by date ascending
    txs.sort((a: any, b: any) => a.created_at - b.created_at);

    // Filter by specific wallet if requested
    if (args.walletId && args.walletId !== "all") {
      const wId = args.walletId;
      txs = txs.filter((t: any) => 
        t.wallet_id === wId || 
        t.transfer_from_wallet_id === wId || 
        t.transfer_to_wallet_id === wId
      );
    }

    // Determine date range and grouping
    const now = new Date();
    let startDate = new Date();
    
    if (args.period === "daily") startDate.setDate(now.getDate() - 30); // Last 30 days
    if (args.period === "weekly") startDate.setDate(now.getDate() - 90); // Last 3 months
    if (args.period === "monthly") startDate.setFullYear(now.getFullYear() - 1); // Last 1 year
    
    const startTime = startDate.getTime();

    // Calculate initial balances before the start date
    // We start with current balance and work backwards, OR start with 0 and replay everything
    // Replaying everything is safer for accuracy
    
    // Map to track balance of each wallet
    const walletBalances: Record<string, number> = {};
    wallets.forEach((w: any) => walletBalances[w._id] = 0); // Start at 0? No, we need initial state.
    
    // BETTER APPROACH:
    // 1. Get current balances of all wallets.
    // 2. We need to "un-apply" transactions that happened AFTER our data points to find historical balances?
    //    OR rely on the fact we have all history?
    //    Let's assume we have full history in `txs`.
    //    If we re-play from start of time, we get accurate history.
    
    const timePoints: Record<string, any> = {};

    // Helper to format date key
    const formatKey = (date: Date) => {
      if (args.period === "daily") return date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (args.period === "weekly") {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
      }
      if (args.period === "monthly") return date.toISOString().slice(0, 7); // YYYY-MM
      return "";
    };

    // Replay history
    txs.forEach((t: any) => {
      // Apply transaction logic to wallet balances
      // Logic mirrors the `log` mutation but purely for calculation here
      if (t.type === "income") {
        if (walletBalances[t.wallet_id] !== undefined) walletBalances[t.wallet_id] += t.amount;
      } else if (t.type === "expense") {
        if (walletBalances[t.wallet_id] !== undefined) walletBalances[t.wallet_id] -= t.amount;
      } else if (t.type === "transfer") {
        if (walletBalances[t.transfer_from_wallet_id] !== undefined) walletBalances[t.transfer_from_wallet_id] -= t.amount;
        if (walletBalances[t.transfer_to_wallet_id] !== undefined) walletBalances[t.transfer_to_wallet_id] += t.amount;
      } else if (t.type === "savings") {
         // Savings usually moves money out of a "spending" wallet into a "goal" (conceptually)
         // or just stays in the wallet but is tagged.
         // If it has a wallet_id, we treat it like an expense/allocation? 
         // Existing logic in `log` for savings treats it like an expense (deducts from wallet).
         if (walletBalances[t.wallet_id] !== undefined) walletBalances[t.wallet_id] -= t.amount;
      }

      // Record snapshot if within requested time range
      if (t.created_at >= startTime) {
        const key = formatKey(new Date(t.created_at));
        
        // Clone current state
        const total = Object.values(walletBalances).reduce((a, b) => a + b, 0);
        
        // If filtering by specific wallet, return just that one, else total
        let value = total;
        if (args.walletId && args.walletId !== "all") {
           value = walletBalances[args.walletId] || 0;
        }

        // We only want the LAST balance of the period, so we overwrite
        timePoints[key] = { date: key, balance: value };
      }
    });

    // Fill in gaps? Charts handle gaps okay usually, but better to fill forward.
    // For now, return collected points.
    return Object.values(timePoints);
  }
});

export const dashboard = query({
  args: { userKey: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) return { 
      totalBalance: 0, 
      monthIncome: 0, 
      monthExpense: 0, 
      monthNet: 0, 
      trends: { balance: 0, income: 0, expense: 0, net: 0 },
      wallets: [], 
      goalProgress: [], 
      spendingByCategory: [],
      spendingHistory: [],
      warnings: { overspending: false, goalAchieved: false, aheadOfSchedule: false, behindSchedule: false } 
    };

    const wallets = await ctx.db.query("wallets").withIndex("by_user", (q: any) => q.eq("user_id", user._id)).collect();
    const txs = await ctx.db.query("transactions").withIndex("by_user", (q: any) => q.eq("user_id", user._id)).collect();
    const goals = await ctx.db.query("goals").withIndex("by_user", (q: any) => q.eq("user_id", user._id)).collect();
    
    const totalBalance = wallets.reduce((a: number, w: any) => a + w.balance, 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startCurrent = new Date(currentYear, currentMonth, 1).getTime();
    const endCurrent = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();

    // Previous month calculation
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();
    const startPrev = new Date(prevYear, prevMonth, 1).getTime();
    const endPrev = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999).getTime();

    const currentRange = txs.filter((t: any) => t.created_at >= startCurrent && t.created_at <= endCurrent);
    const prevRange = txs.filter((t: any) => t.created_at >= startPrev && t.created_at <= endPrev);

    const income = currentRange.filter((t: any) => t.type === "income").reduce((a: number, b: any) => a + b.amount, 0);
    const expense = currentRange.filter((t: any) => t.type === "expense").reduce((a: number, b: any) => a + b.amount, 0);
    const transferVolume = currentRange.filter((t: any) => t.type === "transfer").reduce((a: number, b: any) => a + b.amount, 0);
    const net = income - expense;

    const prevIncome = prevRange.filter((t: any) => t.type === "income").reduce((a: number, b: any) => a + b.amount, 0);
    const prevExpense = prevRange.filter((t: any) => t.type === "expense").reduce((a: number, b: any) => a + b.amount, 0);
    const prevNet = prevIncome - prevExpense;

    // Spending by Category (Current Month)
    const categoryMap: Record<string, number> = {};
    currentRange.filter((t: any) => t.type === "expense").forEach((t: any) => {
      const cat = t.category || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });
    const spendingByCategory = Object.entries(categoryMap)
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories

    // Weekly History (Sunday to Saturday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekTime = startOfWeek.getTime();
    
    // Initialize with 0s for Sun-Sat
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const spendingMap = days.map(day => ({ day, amount: 0 }));
    const incomeMap = days.map(day => ({ day, amount: 0 }));
    const transferMap = days.map(day => ({ day, amount: 0 }));

    txs.forEach((t: any) => {
      if (t.created_at >= startOfWeekTime) {
        const d = new Date(t.created_at);
        const dayIndex = d.getDay();
        
        if (t.type === "expense") {
          spendingMap[dayIndex].amount += t.amount;
        } else if (t.type === "income") {
          incomeMap[dayIndex].amount += t.amount;
        } else if (t.type === "transfer") {
          transferMap[dayIndex].amount += t.amount;
        }
      }
    });

    const spendingHistory = spendingMap;
    const incomeHistory = incomeMap;
    const transferHistory = transferMap;

    // Helper to calculate percentage change safely
    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    const trends = {
      income: calcTrend(income, prevIncome),
      expense: calcTrend(expense, prevExpense),
      net: calcTrend(net, prevNet),
      balance: calcTrend(totalBalance, totalBalance - net) 
    };

    let goalProgress: Array<{ slug: string; progress: number; remaining: number; saved: number }> = [];
    for (const g of goals as any[]) {
      // Calculate savings specifically for this goal
      // Look for transactions that have this goal_id (direct contribution)
      // OR look for transfers to a "Goal Wallet" if we had that concept, but for now relying on goal_id linkage
      
      const goalTransactions = txs.filter((t: any) => t.goal_id === g._id);
      
      const saved = goalTransactions.reduce((acc: number, t: any) => {
         // Income/Transfer IN adds to goal
         if (t.type === 'income' || (t.type === 'transfer' && t.transfer_to_wallet_id)) return acc + t.amount;
         // Expense/Transfer OUT subtracts (if users withdraw from goal)
         if (t.type === 'expense' || (t.type === 'transfer' && t.transfer_from_wallet_id)) return acc - t.amount;
         return acc;
      }, 0);

      // Ensure saved amount isn't negative for display purposes
      const net_saved = Math.max(0, saved);
      
      const progress = Math.min(100, (net_saved / g.target_amount) * 100);
      const remaining = Math.max(0, g.target_amount - net_saved);
      goalProgress.push({ slug: g.slug, progress, remaining, saved: net_saved });
    }
    
    const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const week = txs.filter((t: any) => t.created_at >= weekStart && t.created_at <= Date.now());
    const weekIncome = week.filter((t: any) => t.type === "income").reduce((a: number, b: any) => a + b.amount, 0);
    const weekExpense = week.filter((t: any) => t.type === "expense").reduce((a: number, b: any) => a + b.amount, 0);
    
    const goalAchieved = (goals as any[]).some((g: any) => {
      const total_income = txs.filter((t: any) => t.type === "income").reduce((a: number, b: any) => a + b.amount, 0);
      const total_expense = txs.filter((t: any) => t.type === "expense").reduce((a: number, b: any) => a + b.amount, 0);
      const net_savings = total_income - total_expense;
      return net_savings >= g.target_amount;
    });
    const aheadOfSchedule = (goals as any[]).some((g: any) => {
      const start = g.start_date ?? g.created_at;
      const daysSoFar = Math.max(1, Math.ceil((Date.now() - start) / (1000 * 60 * 60 * 24)));
      const total_income = txs.filter((t: any) => t.type === "income").reduce((a: number, b: any) => a + b.amount, 0);
      const total_expense = txs.filter((t: any) => t.type === "expense").reduce((a: number, b: any) => a + b.amount, 0);
      const net_savings = total_income - total_expense;
      const avgPerDay = net_savings / daysSoFar;
      return avgPerDay >= g.required_daily_savings * 1.1;
    });
    const behindSchedule = (goals as any[]).some((g: any) => {
      const start = g.start_date ?? g.created_at;
      const daysSoFar = Math.max(1, Math.ceil((Date.now() - start) / (1000 * 60 * 60 * 24)));
      const total_income = txs.filter((t: any) => t.type === "income").reduce((a: number, b: any) => a + b.amount, 0);
      const total_expense = txs.filter((t: any) => t.type === "expense").reduce((a: number, b: any) => a + b.amount, 0);
      const net_savings = total_income - total_expense;
      const avgPerDay = net_savings / daysSoFar;
      return avgPerDay < g.required_daily_savings * 0.9;
    });
    
    const warnings = {
      overspending: expense > income || weekExpense > weekIncome,
      goalAchieved,
      aheadOfSchedule,
      behindSchedule,
    };

    return { 
      totalBalance, 
      monthIncome: income, 
      monthExpense: expense, 
      monthTransferVolume: transferVolume,
      monthNet: net, 
      trends,
      wallets, 
      goalProgress, 
      spendingByCategory,
      spendingHistory,
      incomeHistory,
      transferHistory,
      warnings 
    };
  },
});
