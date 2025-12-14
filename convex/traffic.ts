import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logVisit = mutation({
  args: {
    path: v.string(),
    visitor_id: v.string(),
    session_id: v.string(),
    ip_hash: v.optional(v.string()),
    user_agent: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    referrer: v.optional(v.string()),
    device_type: v.optional(v.string()),
    browser: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("traffic_logs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getSummary = query({
  args: {
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // In a real high-traffic app, we would use pre-aggregated stats.
    // For this implementation, we'll scan logs.
    const logs = await ctx.db.query("traffic_logs")
      .withIndex("by_timestamp", (q) => 
        q.gte("timestamp", args.from || 0).lte("timestamp", args.to || Date.now())
      )
      .collect();

    const totalViews = logs.length;
    const uniqueVisitors = new Set(logs.map(l => l.visitor_id)).size;
    
    // Bounce rate: Sessions with only 1 view / Total sessions
    const sessions = new Map<string, number>();
    logs.forEach(l => {
      sessions.set(l.session_id, (sessions.get(l.session_id) || 0) + 1);
    });
    
    let singlePageSessions = 0;
    sessions.forEach((count) => {
      if (count === 1) singlePageSessions++;
    });
    
    const bounceRate = sessions.size > 0 ? (singlePageSessions / sessions.size) * 100 : 0;

    // Avg Session Duration (approximate, since we don't track exit time perfectly)
    // We can only calculate duration for sessions with > 1 view
    // Duration = Last view time - First view time
    // This requires sorting logs by session, which is expensive here.
    // We'll skip complex duration calc for now or do a simple estimate.
    
    return {
      totalViews,
      uniqueVisitors,
      bounceRate,
      avgSessionDuration: 0, // Placeholder
    };
  },
});

export const getTrends = query({
  args: {
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    interval: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db.query("traffic_logs")
      .withIndex("by_timestamp", (q) => 
        q.gte("timestamp", args.from || 0).lte("timestamp", args.to || Date.now())
      )
      .collect();

    const grouped: Record<string, number> = {};
    
    logs.forEach(l => {
      const date = new Date(l.timestamp);
      let key = "";
      if (args.interval === "daily") {
        key = date.toISOString().split('T')[0];
      } else {
        // Weekly logic
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day == 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        key = monday.toISOString().split('T')[0];
      }
      
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getPages = query({
  args: {
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db.query("traffic_logs")
      .withIndex("by_timestamp", (q) => 
        q.gte("timestamp", args.from || 0).lte("timestamp", args.to || Date.now())
      )
      .collect();

    const counts: Record<string, number> = {};
    logs.forEach(l => {
      counts[l.path] = (counts[l.path] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },
});

export const getSources = query({
  args: {
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db.query("traffic_logs")
      .withIndex("by_timestamp", (q) => 
        q.gte("timestamp", args.from || 0).lte("timestamp", args.to || Date.now())
      )
      .collect();

    const counts: Record<string, number> = {};
    logs.forEach(l => {
      const source = l.referrer ? new URL(l.referrer).hostname : "Direct";
      counts[source] = (counts[source] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  },
});

export const getLogs = query({
  args: {
    paginationOpts: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("traffic_logs")
      .withIndex("by_timestamp")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
