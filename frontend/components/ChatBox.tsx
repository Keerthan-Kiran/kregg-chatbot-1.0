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
  const typingRemovedRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);
    typingRemovedRef.current = false;

    // ✅ User message + typing indicator
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
          if (!token.trim()) return; // ✅ IGNORE EMPTY CHUNKS

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;

            if (!updated[lastIndex] || updated[lastIndex].role !== "bot") {
                return prev;
            }

            // ✅ FIRST REAL TOKEN → REMOVE TYPING
            if (updated[lastIndex].typing) {
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
      const newSessionId = localStorage.getItem(SESSION_KEY);

      if (oldSessionId && newSessionId && oldSessionId !== newSessionId) {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "Session expired. Starting a new conversation.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        if (updated[lastIndex]?.role === "bot") {
          updated[lastIndex] = {
            role: "bot",
            content: "Sorry, something went wrong. Please try again.",
          };
        }

        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] w-full max-w-md mx-auto border rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white font-semibold">
        <span>KREGG AI Chatbot</span>
        <button
          onClick={() => {
            localStorage.removeItem(SESSION_KEY);
            setMessages([]);
          }}
          className="text-xs bg-red-500 px-3 py-1 rounded-md"
        >
          Reset
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
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
      <div className="border-t p-3 flex gap-2">
        <textarea
          className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm"
          placeholder="Type your message..."
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 text-white px-4 rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
