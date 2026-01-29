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

      const data = await response.json();

      typingEl.remove();
      appendMessage(
        data.reply || "Sorry, I couldn't generate a response.",
        "bot"
      );
    } catch (err) {
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
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #2563eb;
        color: #fff;
        border: none;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,.25);
        z-index: 9999;
      }

      #kregg-chat-window {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 360px;
        height: 520px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0,0,0,.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 9999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont;
      }

      .kregg-header {
        background: #000;
        color: #fff;
        padding: 14px;
        font-weight: 600;
        font-size: 14px;
      }

      .kregg-status {
        font-size: 11px;
        color: #22c55e;
      }

      #kregg-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        background: #f9fafb;
      }

      .kregg-msg {
        max-width: 80%;
        padding: 10px 14px;
        margin-bottom: 12px;
        font-size: 14px;
        border-radius: 18px;
        line-height: 1.4;
      }

      .kregg-bot {
        background: #fff;
        color: #111;
        border: 1px solid #e5e7eb;
      }

      .kregg-user {
        background: #2563eb;
        color: #fff;
        margin-left: auto;
      }

      .kregg-input {
        display: flex;
        padding: 12px;
        border-top: 1px solid #e5e7eb;
      }

      .kregg-input input {
        flex: 1;
        padding: 10px 14px;
        border-radius: 999px;
        border: none;
        background: #f3f4f6;
        outline: none;
      }

      .kregg-input button {
        margin-left: 8px;
        border: none;
        background: #2563eb;
        color: #fff;
        border-radius: 999px;
        width: 40px;
        cursor: pointer;
      }

      .kregg-footer {
        font-size: 10px;
        text-align: center;
        color: #9ca3af;
        padding-bottom: 8px;
      }
    </style>
    `
  );

  // Inject HTML
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <button id="kregg-toggle" onclick="(${toggleWidget.toString()})()">💬</button>

    <div id="kregg-chat-window">
      <div class="kregg-header">
        KREGG AI Assistant
        <div class="kregg-status">● Online</div>
      </div>

      <div id="kregg-messages"></div>

      <div class="kregg-input">
        <input id="kregg-input" placeholder="Type your message..." />
        <button onclick="sendKreggMessage()">➤</button>
      </div>

      <div class="kregg-footer">Powered by KREGG AI</div>
    </div>
    `
  );

  // Initial greeting

})();
