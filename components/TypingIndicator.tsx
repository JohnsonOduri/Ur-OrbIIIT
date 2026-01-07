import { motion } from "motion/react";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 mb-4"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
        <Bot className="w-5 h-5 text-black" />
      </div>
      
      <div className="bg-zinc-900 border-l-2 border-cyan-500 px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-cyan-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
