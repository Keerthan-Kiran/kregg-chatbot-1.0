const API_BASE = "http://127.0.0.1:8000";
const API_KEY = "kregg_live_test_123"; // 🔑 same key as DB

const SESSION_KEY = "kregg_chat_session_id";

export async function sendMessageStream(
  message: string,
  sessionId?: string,
  onToken?: (token: string) => void
) {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY, // ✅ AUTH FIX
    },
    body: JSON.stringify({
      message,
      tenant: "manual_test", // value ignored by backend (auth decides)
      session_id: sessionId ?? null,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Stream failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let newSessionId = response.headers.get("x-session-id");
  if (newSessionId) {
    localStorage.setItem(SESSION_KEY, newSessionId);
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    if (onToken) onToken(chunk);
  }
}
