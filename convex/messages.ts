import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { getUserFromToken } from "./auth";

// --- User Functions ---

export const sendMessage = mutation({
  args: {
    userKey: v.string(),
    subject: v.string(),
    content: v.string(),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    const messageId = await ctx.db.insert("messages", {
      user_id: user._id,
      subject: args.subject,
      content: args.content,
      direction: "inbound", // User -> Admin
      status: "sent",
      attachments: args.attachments,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return messageId;
  },
});

export const listUserMessages = query({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.userKey);
    if (!user) throw new Error("Unauthorized");

    // Fetch all messages for this user (both inbound and outbound)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_created", (q) => q.eq("user_id", user._id))
      .order("desc")
      .collect();

    return messages;
  },
});

// --- Admin Functions ---

async function ensureAdmin(ctx: any, userKey: string) {
  const user = await getUserFromToken(ctx, userKey);
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

export const listAllMessages = query({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.userKey);

    // Fetch all messages. In a real app, this should be paginated.
    // We fetch users to join names
    const messages = await ctx.db.query("messages").order("desc").collect();
    
    // Manual join to get user details
    const messagesWithUsers = await Promise.all(messages.map(async (msg: any) => {
      const user = await ctx.db.get(msg.user_id);
      return {
        ...msg,
        user_name: user ? user.name : "Unknown User",
        user_email: user ? user.email : "Unknown Email",
      };
    }));

    return messagesWithUsers;
  },
});

export const listConversations = query({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.userKey);

    // Get all messages
    const messages = await ctx.db.query("messages").order("desc").collect();
    
    // Group by user_id
    const userGroups: Record<string, { lastMessage: any; count: number; unread: number }> = {};
    
    for (const msg of messages) {
      if (!userGroups[msg.user_id]) {
        userGroups[msg.user_id] = {
          lastMessage: msg,
          count: 0,
          unread: 0
        };
      }
      userGroups[msg.user_id].count++;
      if (msg.direction === "inbound" && msg.status === "sent") {
        userGroups[msg.user_id].unread++;
      }
    }

    // Convert to array and fetch user details
    const conversations = await Promise.all(
      Object.entries(userGroups).map(async ([userId, data]) => {
        const user = await ctx.db.get(userId as any);
        return {
          user_id: userId,
          user_name: user ? user.name : "Unknown User",
          user_email: user ? user.email : "Unknown Email",
          last_message: data.lastMessage,
          message_count: data.count,
          unread_count: data.unread,
        };
      })
    );

    return conversations.sort((a, b) => b.last_message.created_at - a.last_message.created_at);
  },
});

export const getConversation = query({
  args: {
    userKey: v.string(),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.userKey);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_created", (q) => q.eq("user_id", args.targetUserId))
      .order("asc") // Oldest first for chat view
      .collect();

    return messages;
  },
});

// Admin reply to USER (contextual to conversation, not just a specific message ID)
// But we still link it to a parent for threading if needed, or just append to user log.
// For the new UI, we just need to insert a message for that user.
export const sendAdminMessage = mutation({
  args: {
    userKey: v.string(),
    targetUserId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.userKey);

    await ctx.db.insert("messages", {
      user_id: args.targetUserId,
      subject: "Admin Message", // Generic subject for chat mode
      content: args.content,
      direction: "outbound",
      status: "sent",
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});

export const replyToMessage = mutation({
  args: {
    userKey: v.string(),
    originalMessageId: v.id("messages"),
    content: v.string(),
    status: v.string(), // e.g., "replied", "in_progress", "resolved"
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.userKey);

    const original = await ctx.db.get(args.originalMessageId);
    if (!original) throw new Error("Message not found");

    // Create the reply (Outbound)
    await ctx.db.insert("messages", {
      user_id: original.user_id, // Same user context
      subject: `Re: ${original.subject}`,
      content: args.content,
      direction: "outbound", // Admin -> User
      status: "sent",
      parent_id: original._id,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Update original message status
    await ctx.db.patch(original._id, {
      status: args.status,
      updated_at: Date.now(),
    });
  },
});

export const getMessageThread = query({
  args: {
    userKey: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.userKey);

    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    // Fetch replies where parent_id matches this message
    const replies = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parent_id", args.messageId))
      .collect();

    // Also fetch the parent if this message is a reply itself (though UI logic should handle this)
    // For now, let's assume we are viewing the original message + its replies.

    return {
      original: message,
      replies: replies.sort((a, b) => a.created_at - b.created_at),
    };
  },
});

export const updateStatus = mutation({
  args: {
    userKey: v.string(),
    messageId: v.id("messages"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.userKey);
    await ctx.db.patch(args.messageId, {
      status: args.status,
      updated_at: Date.now(),
    });
  },
});
