import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Message } from "@/lib/api";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (!isUser) {
    return (
      <div className="text-sm leading-relaxed text-foreground py-1">
        {message.content}
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
        {message.content}
      </div>
    </div>
  );
}
