import { motion } from "motion/react";
import { Bot } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
}

export function MessageBubble({ content, isUser, timestamp }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-black" />
        </div>
      )}
      
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-zinc-800 text-white rounded-br-md"
              : "bg-zinc-900 text-gray-100 border-l-2 border-cyan-500 rounded-bl-md"
          }`}
        >
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
        {timestamp && (
          <span className="text-xs text-gray-500 px-2">{timestamp}</span>
        )}
      </div>
    </motion.div>
  );
}
