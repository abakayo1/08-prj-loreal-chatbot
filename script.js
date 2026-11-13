/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendButton = document.getElementById("sendBtn");

// This Worker securely forwards chat requests without exposing the API key.
const workerUrl = "https://loreal-worker.bakayokom84.workers.dev/";

// Keep the conversation so the assistant can remember earlier messages.
const conversationHistory = [];

// Add a message to the chat and scroll down to show it.
function showMessage(text, className) {
  const messageElement = document.createElement("div");
  messageElement.className = `msg ${className}`;
  messageElement.textContent = text;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Turn **bold** Markdown into real bold text without inserting HTML strings.
function showAssistantMessage(text) {
  const messageElement = document.createElement("div");
  messageElement.className = "msg ai";

  const boldPattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldPattern.exec(text)) !== null) {
    messageElement.appendChild(
      document.createTextNode(text.slice(lastIndex, match.index)),
    );

    const boldText = document.createElement("strong");
    boldText.textContent = match[1];
    messageElement.appendChild(boldText);
    lastIndex = boldPattern.lastIndex;
  }

  messageElement.appendChild(document.createTextNode(text.slice(lastIndex)));
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Show the welcome message as the assistant's first chat bubble.
showMessage("👋 Hello! How can I help you today?", "ai");

// Send the conversation to the Worker and return the assistant's reply.
async function sendChatRequest(messages) {
  // Older deployed Worker code may only read userMessage, so include the
  // conversation as a transcript as well as sending structured messages.
  const conversationTranscript = messages
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n");

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userMessage: conversationTranscript,
      messages,
    }),
  });

  const responseText = await response.text();
  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`The Worker returned an unexpected response (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.error || `Request failed (${response.status}).`);
  }

  const reply = data.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error("The response did not include a chatbot reply.");
  }

  return reply;
}

// Capture the user's input, request a reply, and display both messages.
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const messageText = userInput.value.trim();
  if (!messageText) {
    return;
  }

  // Show only the latest question and its reply; keep conversationHistory for context.
  chatWindow.replaceChildren();
  showMessage(`You: ${messageText}`, "user");
  userInput.value = "";
  conversationHistory.push({ role: "user", content: messageText });
  userInput.disabled = true;
  sendButton.disabled = true;

  try {
    const reply = await sendChatRequest(conversationHistory);
    conversationHistory.push({ role: "assistant", content: reply });
    showAssistantMessage(reply);
  } catch (error) {
    // Do not keep a message in history if the request did not get a reply.
    conversationHistory.pop();
    console.error("Chat request failed:", error);
    showMessage(`Sorry, I couldn't get a reply. ${error.message}`, "ai");
  } finally {
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
});
