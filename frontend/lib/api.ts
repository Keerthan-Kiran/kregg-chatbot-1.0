const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
const API_KEY = "kregg_live_test_123";

export async function sendMessageStream(
  message: string,
  sessionId?: string,
  onToken?: (token: string) => void
) {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...(sessionId ? { "x-session-id": sessionId } : {}),
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(err);
    throw new Error("Chat failed");
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  const newSessionId = res.headers.get("x-session-id");
  if (newSessionId) {
    localStorage.setItem("kregg_chat_session_id", newSessionId);
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onToken?.(decoder.decode(value));
  }
}
