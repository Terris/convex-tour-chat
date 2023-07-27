"use node";
import { Configuration, OpenAIApi } from "openai";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Initialize the OpenAI client with the given API key
const apiKey = process.env.OPENAI_API_KEY!;
const openai = new OpenAIApi(new Configuration({ apiKey }));

export const chat = action({
  args: {
    messageBody: v.string(),
  },
  handler: async (ctx, { messageBody }) => {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          // Provide a 'system' message to give GPT context about how to respond
          role: "system",
          content:
            "You are a terse bot in a group chat responding to questions with 1-sentence answers.",
        },
        {
          // Pass on the chat user's message to GPT
          role: "user",
          content: messageBody,
        },
      ],
    });

    // Pull the message content out of the response
    const responseContent = response.data.choices[0].message?.content;

    // Pull the message content out of the response
    await ctx.runMutation(api.messages.send, {
      author: "ChatGPT",
      body: responseContent || "Sorry, I don't have an answer for that.",
    });
  },
});
