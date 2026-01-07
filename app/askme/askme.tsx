"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MessageBubble } from "../../components/MessageBubble";
import { TypingIndicator } from "../../components/TypingIndicator";
import { QuickPromptChip } from "../../components/QuickPromptChip";
import { EmptyState } from "../../components/EmptyState";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

const quickPrompts = [
  "What is Monday's lunch menu?",
  "List all the holidays?",
  "When are the semester exams?",
  "Best places to visit near IIIT Kottayam?",
  
];

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API;

export default function AskMe() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slowNotice, setSlowNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;
    if (!BOT_API_URL) {
      setError("AskMe backend URL is not configured.");
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      content: text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setError(null);
    setIsTyping(true);

    // Prepare long-timeout and slow-start notice
    const controller = new AbortController();
    const LONG_TIMEOUT_MS = 60_000; // 60 seconds
    const timeoutId = setTimeout(() => controller.abort(), LONG_TIMEOUT_MS);
    const slowStartId = setTimeout(() => {
      setSlowNotice(
        "Warming up the backend… First response can take up to a minute."
      );
    }, 5_000);

    try {
      const startedAt = performance.now();
      console.log("[AskMe] Calling backend", { url: BOT_API_URL, text });
      const res = await fetch(BOT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      console.log(
        "[AskMe] Response received",
        { status: res.status, statusText: res.statusText, ms: Math.round(performance.now() - startedAt) }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "<no body>");
        console.warn("[AskMe] Non-OK response", { status: res.status, statusText: res.statusText, body: errText });
        throw new Error(`API error (${res.status} ${res.statusText})`);
      }

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: unknown) {
      const err = e as Error & { name?: string };
      console.error("[AskMe] Fetch error", { name: err?.name, message: err?.message });
      if (err?.name === "AbortError") {
        setError(
          "The server took too long to respond (timeout). Please try again in a moment."
        );
      } else {
        setError("AskMe request failed. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(slowStartId);
      setSlowNotice(null);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-900">
        <div className="flex items-center gap-4 px-4 py-3.5 max-w-2xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-zinc-900 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg">AskMe</h1>
            <p className="text-xs text-gray-400">
              Your campus AI assistant
            </p>
          </div>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 min-h-full flex flex-col">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  content={m.content}
                  isUser={m.isUser}
                  timestamp={m.timestamp}
                />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-40 left-4 right-4 max-w-2xl mx-auto"
          >
            <div className="bg-red-950 border border-red-800 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slow Start Notice */}
      <AnimatePresence>
        {slowNotice && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-56 left-4 right-4 max-w-2xl mx-auto"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm text-zinc-300">{slowNotice}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-zinc-900">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          <div className="flex gap-2 overflow-x-auto">
            {quickPrompts.map((p) => (
              <QuickPromptChip
                key={p}
                text={p}
                onClick={() => handleSendMessage(p)}
              />
            ))}
          </div>

          <div className="flex gap-2.5">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about mess, timetable, faculty, exams…"
              rows={1}
              className="flex-1 bg-zinc-900 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-5 h-5 text-black" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
