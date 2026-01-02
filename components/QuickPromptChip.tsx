import { motion } from "motion/react";

interface QuickPromptChipProps {
  text: string;
  onClick: () => void;
}

export function QuickPromptChip({ text, onClick }: QuickPromptChipProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex-shrink-0 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-gray-300 text-sm rounded-full border border-zinc-800 hover:border-cyan-500/50 transition-all duration-200"
    >
      {text}
    </motion.button>
  );
}
