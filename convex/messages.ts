import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Grab the most recent messages.
    const messages = await ctx.db.query("messages").order("desc").take(100);
    const messagesWithLikes = await Promise.all(
      messages.map(async (message) => {
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_messageId", (q) => q.eq("messageId", message._id))
          .collect();
        return { ...message, likes: likes.length };
      })
    );
    return messagesWithLikes.reverse();
  },
});

export const send = mutation({
  args: { body: v.string(), author: v.string() },
  handler: async (ctx, { body, author }) => {
    // Send a new message.
    await ctx.db.insert("messages", { body, author });

    // Schedule the chat action to run immediately
    if (body.startsWith("@gpt")) {
      ctx.scheduler.runAfter(0, api.openai.chat, {
        messageBody: body,
      });
    }
  },
});

export const like = mutation({
  args: { messageId: v.id("messages"), liker: v.string() },
  handler: async (ctx, { messageId, liker }) => {
    await ctx.db.insert("likes", { messageId, liker });
  },
});
