// Copy this code into your Cloudflare Worker script

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Let the browser check whether it can send a chat request.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured." }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    try {
      const { messages } = await request.json();
      const hasOnlyChatMessages =
        Array.isArray(messages) &&
        messages.length > 0 &&
        messages.every(
          (message) =>
            message &&
            (message.role === "user" || message.role === "assistant") &&
            typeof message.content === "string" &&
            message.content.trim(),
        );

      if (!hasOnlyChatMessages) {
        return new Response(JSON.stringify({ error: "Valid conversation messages are required." }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          messages: [
            {
              role: "system",
              content:
                "You are L’Oréal’s beauty assistant. Use the full conversation history to understand follow-up questions naturally, without making the user repeat details. Remember information the user shares, such as their name, preferences, and earlier questions, and use it when relevant. Only answer questions about L’Oréal products or beauty topics such as skincare, makeup, haircare, fragrances, beauty routines, and recommendations. If a question is unrelated to L’Oréal or beauty, do not answer it; politely explain that you can help with L’Oréal products and beauty topics, then invite a related question. Do not invent product details. If you are unsure, say so and ask a clarifying question.",
            },
            ...messages,
          ],
          max_completion_tokens: 300,
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: corsHeaders,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }
};
