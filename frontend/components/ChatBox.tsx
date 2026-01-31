"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { sendMessageStream } from "@/lib/api";

type ChatMessage = {
  role: "user" | "bot";
  content: string;
  typing?: boolean;
};

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);

  /* ✅ Greeting – ALWAYS visible */
  useEffect(() => {
    if (!hasGreetedRef.current) {
      hasGreetedRef.current = true;
      setMessages([
        {
          role: "bot",
          content: "Hello! I'm the KREGG AI Assistant. How can I help you today?",
        },
      ]);
    }
  }, []);

  /* ✅ Scroll AFTER render */
  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
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
      await sendMessageStream(userMessage, undefined, (reply) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "bot",
            content: reply,
          };
          return updated;
        });
      });
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
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Messages (ONLY scrollbar) */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gray-50"
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m.content} isUser={m.role === "user"} typing={m.typing} />
        ))}
      </div>

      {/* Input */}
      <div className="border-t bg-white p-3">
        <div className="flex gap-2">
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
            className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
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
