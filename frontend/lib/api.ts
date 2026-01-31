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

  const replyText = (await response.text()).trim();

  if (!replyText) {
    throw new Error("Empty reply from backend");
  }

  onToken?.(replyText);
}
