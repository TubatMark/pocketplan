import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

// SHA-256 based password hashing with per-user salt
// Uses the Web Crypto API available in Convex runtime
async function hashPassword(password: string, salt?: string): Promise<string> {
  const passwordSalt = salt ?? crypto.randomUUID();
  const data = new TextEncoder().encode(passwordSalt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${passwordSalt}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Support legacy hashes (no colon = old bitwise hash)
  if (!storedHash.includes(":")) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString() === storedHash;
  }
  const [salt] = storedHash.split(":");
  const rehashed = await hashPassword(password, salt);
  return rehashed === storedHash;
}

// Email format validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export const signUp = mutation({
  args: { email: v.string(), password: v.string(), name: v.string() },
  handler: async (ctx: any, args: any) => {
    // Server-side validation
    const email = args.email.trim().toLowerCase();
    if (!isValidEmail(email)) throw new Error("Invalid email format");
    if (args.password.length < 6) throw new Error("Password must be at least 6 characters");
    if (args.name.trim().length < 1 || args.name.length > 100) throw new Error("Name must be 1-100 characters");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .unique();
    if (existing) throw new Error("Email already in use");

    const userId = await ctx.db.insert("users", {
      email,
      password: await hashPassword(args.password),
      name: args.name.trim(),
      created_at: Date.now(),
    });

    const token = crypto.randomUUID();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return { token, userId };
  },
});

export const signIn = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx: any, args: any) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .unique();
    if (!user) throw new Error("Invalid credentials");

    const valid = await verifyPassword(args.password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    // Upgrade legacy hash to SHA-256 on successful login
    if (!user.password.includes(":")) {
      await ctx.db.patch(user._id, { password: await hashPassword(args.password) });
    }

    const token = crypto.randomUUID();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    // Update last_active
    await ctx.db.patch(user._id, { last_active: Date.now() });

    return { token, userId: user._id };
  },
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx: any, args: any) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .unique();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// Helper to get user from session token
export async function getUserFromToken(ctx: any, token: string) {
  if (!token) return null;
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .unique();

  if (!session) return null;

  // Treat expired sessions as invalid. Cleanup happens in mutations
  // (e.g. signOut) since queries cannot write to the database.
  if (session.expiresAt < Date.now()) return null;

  return await ctx.db.get(session.userId);
}
