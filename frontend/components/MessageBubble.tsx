type Props = {
  message: string;
  isUser: boolean;
  isSystem?: boolean;
  typing?: boolean;
};

export default function MessageBubble({
  message,
  isUser,
  isSystem,
  typing,
}: Props) {
  // ✅ SYSTEM MESSAGE
  if (isSystem) {
    return (
      <div className="text-center text-xs text-gray-500 my-2">
        {message}
      </div>
    );
  }

  // ✅ TYPING INDICATOR (NO BLUR — NO OPACITY)
  if (typing) {
    return (
      <div className="flex justify-start">
        <div className="bg-gray-200 px-4 py-2 rounded-2xl flex gap-1">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    );
  }

  // ✅ NORMAL MESSAGE
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-200 text-gray-900 rounded-bl-md"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
