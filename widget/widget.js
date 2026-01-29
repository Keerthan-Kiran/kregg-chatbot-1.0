(function () {
  const API_BASE = "https://kregg-chatbot-1-0.onrender.com";
  const API_KEY = "kregg_live_test_123";
  const SESSION_KEY = "kregg_widget_session_id";

  let isOpen = false;
  let hasGreeted = false;

  function toggleWidget() {
    isOpen = !isOpen;
    const chatWindow = document.getElementById("kregg-chat-window");
    chatWindow.style.display = isOpen ? "flex" : "none";

    // Greeting triggers on first open
    if (isOpen && !hasGreeted) {
      hasGreeted = true;
      appendMessage(
        "Hello! I'm the KREGG AI Assistant. How can I help you today?",
        "bot"
      );
    }
  }

  function appendMessage(text, role) {
    const messagesEl = document.getElementById("kregg-messages");

    const bubble = document.createElement("div");
    bubble.className =
      role === "user"
        ? "kregg-msg kregg-user"
        : "kregg-msg kregg-bot";

    bubble.innerText = text;
    messagesEl.appendChild(bubble);

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    const inputEl = document.getElementById("kregg-input");
    const message = inputEl.value.trim();
    if (!message) return;

    inputEl.value = "";
    appendMessage(message, "user");

    const typingEl = document.createElement("div");
    typingEl.className = "kregg-msg kregg-bot";
    typingEl.innerText = "Typing...";
    document.getElementById("kregg-messages").appendChild(typingEl);

    try {
      const sessionId = localStorage.getItem(SESSION_KEY);

      // Call the endpoint (supports backend text/plain response)
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
          ...(sessionId ? { "x-session-id": sessionId } : {}),
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error("Request failed");

      const newSessionId = response.headers.get("x-session-id");
      if (newSessionId) {
        localStorage.setItem(SESSION_KEY, newSessionId);
      }

      // Backend returns plain text (stream or whole), NOT JSON
      const replyText = await response.text();

      typingEl.remove();
      appendMessage(
        replyText || "Sorry, I couldn't generate a response.",
        "bot"
      );
    } catch (err) {
      console.error(err);
      typingEl.remove();
      appendMessage(
        "Sorry, something went wrong. Please try again.",
        "bot"
      );
    }
  }

  window.sendKreggMessage = sendMessage;

  // Inject styles
  document.head.insertAdjacentHTML(
    "beforeend",
    `
    <style>
      #kregg-toggle {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #2563eb;
        color: #fff;
        border: none;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        z-index: 9999;
        transition: transform 0.2s;
      }
      #kregg-toggle:hover {
        transform: scale(1.05);
      }

      #kregg-chat-window {
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 380px;
        height: 600px;
        max-height: 80vh; /* Ensure it fits on smaller screens */
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 12px 32px rgba(0,0,0,.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 9999;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        border: 1px solid #e5e7eb;
      }

      .kregg-header {
        background: #111827;
        color: #fff;
        padding: 16px;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .kregg-status {
        font-size: 12px;
        color: #4ade80;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .kregg-status::before {
        content: "";
        display: block;
        width: 8px;
        height: 8px;
        background: #4ade80;
        border-radius: 50%;
      }

      #kregg-messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        background: #f9fafb;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .kregg-msg {
        max-width: 85%;
        padding: 12px 16px;
        font-size: 14px;
        border-radius: 16px;
        line-height: 1.5;
        word-wrap: break-word;
      }

      .kregg-bot {
        background: #fff;
        color: #1f2937;
        border: 1px solid #e5e7eb;
        border-bottom-left-radius: 4px;
        align-self: flex-start; /* Ensure it sticks to left */
      }

      .kregg-user {
        background: #2563eb;
        color: #fff;
        border-bottom-right-radius: 4px;
        align-self: flex-end; /* Ensure it sticks to right */
        margin-left: auto; /* Fallback */
      }

      .kregg-input {
        display: flex;
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        background: #fff;
      }

      .kregg-input input {
        flex: 1;
        padding: 12px 16px;
        border-radius: 999px;
        border: 1px solid #e5e7eb;
        background: #f9fafb;
        outline: none;
        transition: border-color 0.2s;
      }
      .kregg-input input:focus {
        border-color: #2563eb;
        background: #fff;
      }

      .kregg-input button {
        margin-left: 10px;
        border: none;
        background: #2563eb;
        color: #fff;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: background 0.2s;
      }
      .kregg-input button:hover {
        background: #1d4ed8;
      }

      .kregg-footer {
        font-size: 11px;
        text-align: center;
        color: #9ca3af;
        padding-bottom: 12px;
        background: #fff;
      }
    </style>
    `
  );

  // Inject HTML
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <button id="kregg-toggle" onclick="(${toggleWidget.toString()})()">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    </button>

    <div id="kregg-chat-window">
      <div class="kregg-header">
        <span>KREGG AI Assistant</span>
        <div class="kregg-status">Online</div>
      </div>

      <div id="kregg-messages"></div>

      <div class="kregg-input">
        <input id="kregg-input" placeholder="Type your message..." onkeydown="if(event.key==='Enter') sendKreggMessage()" />
        <button onclick="sendKreggMessage()">➤</button>
      </div>

      <div class="kregg-footer">Powered by KREGG AI</div>
    </div>
    `
  );
})();
