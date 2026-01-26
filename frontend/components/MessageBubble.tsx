type Props = {
  message: string;
  isUser: boolean;
  typing?: boolean;
};

export default function MessageBubble({ message, isUser, typing }: Props) {
  if (typing) {
    return (
      <div className="flex gap-2 animate-fade-in">
        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
          AI
        </div>
        <div className="bg-white border px-4 py-2 rounded-2xl flex gap-1 shadow-sm">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white border text-gray-800 rounded-bl-md"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
