const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
const API_KEY = "kregg_live_test_123";

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
      "x-api-key": API_KEY,
      ...(sessionId ? { "x-session-id": sessionId } : {}),
    },
    body: JSON.stringify({
      message,
      tenant: "manual_test",
      session_id: sessionId ?? null,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Backend error:", err);
    throw new Error("Chat request failed");
  }

  // store rotated session id
  const newSessionId = response.headers.get("x-session-id");
  if (newSessionId) {
    localStorage.setItem(SESSION_KEY, newSessionId);
  }

  // 🔥 BACKEND RETURNS PLAIN TEXT
  const replyText = await response.text();

  // ✅ allow whitespace / newline responses
  if (replyText.trim().length === 0) {
      throw new Error("Empty reply from backend");
  }


  // simulate streaming for UI
  if (onToken) {
    onToken(replyText);
  }
}
