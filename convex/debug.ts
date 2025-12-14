import { query } from "./_generated/server";

export const listEmails = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({ email: u.email, role: u.role }));
  },
});
