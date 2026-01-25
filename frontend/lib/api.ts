const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
const API_KEY = "kregg_live_test_123";

const SESSION_KEY = "kregg_chat_session_id";

export async function sendMessageStream(
  message: string,
  sessionId?: string,
  onToken?: (token: string) => void
) {
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
    const err = await response.text();
    console.error("Backend error:", err);
    throw new Error("Chat request failed");
  }

  const newSessionId = response.headers.get("x-session-id");
  if (newSessionId) {
    localStorage.setItem(SESSION_KEY, newSessionId);
  }

  const data = await response.json();

  if (typeof data.reply !== "string") {
    console.error("Unexpected response:", data);
    throw new Error("Invalid backend response");
  }

  // Simulate streaming for UI
  onToken?.(data.reply);
}
