# Project 8: L'Oréal Chatbot

L’Oréal is exploring the power of AI, and your job is to showcase what's possible. Your task is to build a chatbot that helps users discover and understand L’Oréal’s extensive range of products—makeup, skincare, haircare, and fragrances—as well as provide personalized routines and recommendations.

## 🚀 Launch via GitHub Codespaces

1. In the GitHub repo, click the **Code** button and select **Open with Codespaces → New codespace**.
2. Once your codespace is ready, open the `index.html` file via the live preview.

## ☁️ Cloudflare Note

The browser sends the conversation as both a `userMessage` transcript and a structured `messages` array to `https://loreal-worker.bakayokom84.workers.dev/`, not directly to OpenAI. This lets older Worker deployments that only read `userMessage` see earlier turns; the updated Worker uses the structured messages. The Worker securely holds the `OPENAI_API_KEY` secret, adds the assistant's L’Oréal and beauty-topic instructions, and sends the conversation to OpenAI. Conversation history is kept in browser memory until the page is refreshed.

Never put an API key in `script.js` or any other file served by the website.

Enjoy building your L’Oréal beauty assistant! 💄
