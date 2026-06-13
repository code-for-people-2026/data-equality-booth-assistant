import type { ChatMessage as ChatMessageType } from "@/lib/chat/conversation";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const label = message.role === "user" ? "你" : "摊位助手";

  return (
    <article className={`message message-${message.role}`}>
      <div className="message-label">{label}</div>
      <div className="message-content">{message.content}</div>
    </article>
  );
}
