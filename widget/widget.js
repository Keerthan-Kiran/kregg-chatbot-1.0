(function () {
  const API_BASE = "https://kregg-chatbot-1-0.onrender.com";
  const API_KEY = "kregg_live_test_123"; // same as backend DB
  const SESSION_KEY = "kregg_widget_session_id";

  async function sendMessage() {
    const inputEl = document.getElementById("kregg-input");
    const outputEl = document.getElementById("kregg-output");
    const message = inputEl.value.trim();

    if (!message) return;

    inputEl.value = "";
    outputEl.innerText = "Typing...";

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

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const newSessionId = response.headers.get("x-session-id");
      if (newSessionId) {
        localStorage.setItem(SESSION_KEY, newSessionId);
      }

      const data = await response.json();
      outputEl.innerText = data.reply || "No response received.";

    } catch (err) {
      console.error(err);
      outputEl.innerText =
        "Sorry, something went wrong. Please try again.";
    }
  }

  // Expose function globally
  window.sendKreggMessage = sendMessage;

  // Inject widget UI
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div style="
      position:fixed;
      bottom:20px;
      right:20px;
      width:260px;
      background:#fff;
      border:1px solid #ccc;
      border-radius:8px;
      padding:10px;
      font-family:Arial;
      z-index:9999;
    ">
      <div style="font-weight:bold;margin-bottom:6px;">KREGG AI</div>
      <input
        id="kregg-input"
        placeholder="Ask something..."
        style="width:100%;padding:6px;margin-bottom:6px;"
      />
      <button
        onclick="sendKreggMessage()"
        style="width:100%;padding:6px;background:#2563eb;color:#fff;border:none;border-radius:4px;"
      >
        Send
      </button>
      <div
        id="kregg-output"
        style="margin-top:8px;font-size:14px;min-height:20px;"
      ></div>
    </div>
    `
  );
})();
