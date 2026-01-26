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

  /* ✅ Enterprise greeting (visible on open) */
  useEffect(() => {
    setMessages([
      {
        role: "bot",
        content:
          "Hello! I'm the KREGG AI Assistant. How can I help you today?",
      },
    ]);
  }, []);

  /* ✅ Scroll ONLY after first user interaction */
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

    const oldSessionId = localStorage.getItem(SESSION_KEY);

    try {
      await sendMessageStream(
        userMessage,
        oldSessionId || undefined,
        (token) => {
          if (!token.trim()) return;

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;

            if (updated[lastIndex]?.typing) {
              updated[lastIndex] = {
                role: "bot",
                content: token,
              };
            } else {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + token,
              };
            }

            return updated;
          });
        }
      );
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[560px] w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Messages (ONLY scrollable area) */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gray-50">
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            message={m.content}
            isUser={m.role === "user"}
            isSystem={m.role === "system"}
            typing={m.typing}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
          >
            ➤
          </button>
        </div>

        <div className="text-center mt-2">
          <span className="text-[10px] text-gray-400">
            Powered by KREGG AI
          </span>
        </div>
      </div>
    </div>
  );
}
