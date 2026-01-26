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
  /* ✅ SYSTEM MESSAGE */
  if (isSystem) {
    return (
      <div className="text-center text-xs text-gray-400 my-3">
        {message}
      </div>
    );
  }

  /* ✅ TYPING INDICATOR */
  if (typing) {
    return (
      <div className="flex items-start gap-2 animate-fade-in">
        {/* Bot avatar */}
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
          AI
        </div>

        <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl shadow-sm flex gap-1">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    );
  }

  /* ✅ NORMAL MESSAGE */
  return (
    <div
      className={`flex w-full gap-2 animate-slide-up ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
          AI
        </div>
      )}

      <div
        className={`max-w-[75%] px-4 py-2 text-sm whitespace-pre-wrap rounded-2xl shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
