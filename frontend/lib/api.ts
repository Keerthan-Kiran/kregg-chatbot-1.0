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
    throw new Error("Chat request failed");
  }

  const newSessionId = response.headers.get("x-session-id");
  if (newSessionId) {
    localStorage.setItem(SESSION_KEY, newSessionId);
  }

  // ✅ DO NOT validate streamed text
  const replyText = await response.text();

  // ✅ Safely handle empty / delayed responses
  if (onToken && replyText) {
    let i = 0;
    const interval = setInterval(() => {
      onToken(replyText[i]);
      i++;
      if (i >= replyText.length) clearInterval(interval);
    }, 15);
  }
}
