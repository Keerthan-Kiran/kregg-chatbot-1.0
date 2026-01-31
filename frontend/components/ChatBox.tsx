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
  const sessionIdRef = useRef<string | null>(null);

  /* Load session */
  useEffect(() => {
    sessionIdRef.current = localStorage.getItem(SESSION_KEY);
  }, []);

  /* Initial greeting */
  useEffect(() => {
    setMessages([
      {
        role: "bot",
        content: "Hello! I'm the KREGG AI Assistant. How can I help you today?",
      },
    ]);
  }, []);

  /* Auto-scroll after first render */
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
      { role: "bot", content: "" , typing: true },
    ]);

    try {
      await sendMessageStream(
        userMessage,
        sessionIdRef.current ?? undefined,
        (token) => {
          if (!token) return;

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;

            if (updated[lastIndex]?.typing) {
              updated[lastIndex] = {
                role: "bot",
                content: token,
                typing: false,
              };
            } else {
              updated[lastIndex].content += token;
            }

            return updated;
          });
        }
      );
    } catch {
      setMessages((prev) => {
        const cleaned = prev.filter((m) => !m.typing);
        return [
          ...cleaned,
          {
            role: "bot",
            content: "Sorry, something went wrong. Please try again.",
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    /* 🔒 iframe-safe full height */
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-4 bg-gray-50">
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

      {/* Input (LOCKED BOTTOM) */}
      <div className="shrink-0 bg-white border-t">
        <div className="p-3">
          <div className="flex items-end gap-2">
            <input
              className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />

            <button
              onClick={handleSend}
              disabled={loading}
              className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              ➤
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-400 mt-2">
            Powered by KREGG AI
          </p>
        </div>
      </div>
    </div>
  );
}
