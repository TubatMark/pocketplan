import { mutationGeneric as mutation, queryGeneric as query, internalMutationGeneric as internalMutation } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Constants
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes block

export const checkRateLimit = mutation({
  args: { identifier: v.string() },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const record = await ctx.db
      .query("rate_limits")
      .withIndex("by_identifier", (q: any) => q.eq("identifier", args.identifier))
      .first();

    if (record) {
      // Check if blocked
      if (record.blocked_until && record.blocked_until > now) {
        return { allowed: false, reason: "blocked", blockedUntil: record.blocked_until };
      }

      // Check window
      if (now - record.last_reset > RATE_LIMIT_WINDOW) {
        // Reset window
        await ctx.db.patch(record._id, {
          count: 1,
          last_reset: now,
        });
        return { allowed: true };
      } else {
        // Increment
        const newCount = record.count + 1;
        if (newCount > MAX_REQUESTS) {
          // Block
          const blockedUntil = now + BLOCK_DURATION;
          await ctx.db.patch(record._id, {
            count: newCount,
            blocked_until: blockedUntil,
          });

          // Log security incident
          await ctx.db.insert("security_logs", {
            identifier: args.identifier,
            action: "blocked",
            reason: "rate_limit_exceeded",
            timestamp: now,
            metadata: { count: newCount, limit: MAX_REQUESTS },
          });

          return { allowed: false, reason: "rate_limit", blockedUntil };
        } else {
          await ctx.db.patch(record._id, { count: newCount });
          return { allowed: true };
        }
      }
    } else {
      // Create new record
      await ctx.db.insert("rate_limits", {
        identifier: args.identifier,
        count: 1,
        last_reset: now,
      });
      return { allowed: true };
    }
  },
});

export const logSuspiciousActivity = mutation({
  args: { 
    identifier: v.string(), 
    reason: v.string(),
    metadata: v.optional(v.any())
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.insert("security_logs", {
      identifier: args.identifier,
      action: "suspicious_activity",
      reason: args.reason,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

export const verifyCaptcha = mutation({
  args: {
    identifier: v.string(),
    token: v.string()
  },
  handler: async (ctx: any, args: any) => {
    // Validate CAPTCHA token format - must be non-empty and reasonable length
    if (!args.token || args.token.length < 20 || args.token.length > 4096) {
      return { success: false };
    }

    // Verify with Google reCAPTCHA API
    // Falls back to token-present check only if secret key is not configured
    let isValid = false;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (secretKey) {
      try {
        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(args.token)}`,
        });
        const data = await response.json();
        isValid = data.success === true;
      } catch {
        // If verification service is down, deny by default
        isValid = false;
      }
    } else {
      // Development fallback: accept test key tokens
      isValid = !!args.token;
    }

    if (isValid) {
      // Unblock user
      const record = await ctx.db
        .query("rate_limits")
        .withIndex("by_identifier", (q: any) => q.eq("identifier", args.identifier))
        .first();

      if (record) {
        await ctx.db.patch(record._id, {
          blocked_until: undefined,
          count: 0,
          last_reset: Date.now(),
        });
      }

      await ctx.db.insert("security_logs", {
        identifier: args.identifier,
        action: "captcha_solved",
        timestamp: Date.now(),
      });

      return { success: true };
    }

    return { success: false };
  },
});
