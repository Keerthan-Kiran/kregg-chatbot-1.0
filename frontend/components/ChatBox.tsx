"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { sendMessageStream } from "@/lib/api";

const SESSION_KEY = "kregg_chat_session_id";

type ChatMessage = {
  role: "user" | "bot" | "system";
  content: string;
  typing?: boolean;
};

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);

  /* Greeting (visible immediately) */
  useEffect(() => {
    setMessages([
      {
        role: "bot",
        content: "Hello! I'm the KREGG AI Assistant. How can I help you today?",
      },
    ]);
  }, []);

  /* Scroll ONLY after user interaction */
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "bot", content: "", typing: true },
    ]);

    try {
      await sendMessageStream(userMessage, undefined, (token) => {
        if (!token.trim()) return;

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated.length - 1;

          if (updated[last].typing) {
            updated[last] = { role: "bot", content: token };
          } else {
            updated[last].content += token;
          }
          return updated;
        });
      });
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "bot", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages (ONLY scrollbar) */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gray-50">
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            message={m.content}
            isUser={m.role === "user"}
            typing={m.typing}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t">
        <div className="flex items-end gap-2">
          <input
            className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            ➤
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Powered by KREGG AI
        </p>
      </div>
    </div>
  );
}
