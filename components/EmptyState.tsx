import { motion } from "motion/react";
import { Sparkles, Calendar, UtensilsCrossed, GraduationCap } from "lucide-react";

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full px-6 py-12"
    >
      <div className="relative mb-6">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center"
        >
          <Sparkles className="w-10 h-10 text-black" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-cyan-500 blur-xl"
        />
      </div>

      <h2 className="text-xl text-white mb-2">Ask anything about campus</h2>
      <p className="text-gray-400 text-center text-sm mb-8 max-w-xs">
        Get instant answers about mess menus, schedules, faculty, events, and more
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {[
          { icon: UtensilsCrossed, label: "Mess Menu" },
          { icon: Calendar, label: "Calendar" },
          { icon: GraduationCap, label: "Academics" },
          { icon: Sparkles, label: "Campus Info" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
          >
            <Icon className="w-6 h-6 text-cyan-500" />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
