"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [time, setTime] = useState<string>("");
  const [quote, setQuote] = useState<string>("");

  const quotes = useMemo(
    () => [
      "Small steps build big days.",
      "Focus on progress, not perfection.",
      "You have enough time for what matters.",
      "Move gently, think clearly, act calmly.",
      "Energy follows your attention.",
      "Do the next right thing, simply.",
      "Today is a good day to start.",
      "Quiet effort compounds quietly.",
      "You are ahead of where you were yesterday.",
      "Light the path, one task at a time.",
      "Consistency is a kindness to yourself.",
      "Clarity comes from action.",
      "Breathe, then begin.",
      "Aim for calm, then for done.",
      "Your pace is the right pace.",
      "Steady hands, clear mind.",
      "Simplify to move forward.",
      "Finish small; feel tall.",
      "Good things grow from focus.",
      "Choose the next kind action.",
    ],
    []
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setTime(formatted);
    };

    updateTime();
    const timer = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!quotes.length) return;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, [quotes]);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const firstName =
    user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  return (
    <main
      className="relative p-4 min-h-screen flex items-center justify-center bg-cover bg-center text-white"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

      <div className="relative w-full max-w-lg text-center space-y-4">

        <div className="text-6xl font-semibold tracking-tight leading-tight drop-shadow">
          {time}
        </div>
        <div className="text-2xl font-medium text-gray-100 drop-shadow-sm">
          {greeting}, {firstName}
        </div>
        <div className="text-base text-gray-200/90 drop-shadow-sm">
          {user.email}
        </div>
        <div className="mt-6 rounded-xl bg-white/5 border border-white/10 px-6 py-5 backdrop-blur-sm shadow-lg text-center space-y-2">
          <p className="text-lg font-medium text-gray-100">Today</p>
          <p className="text-sm text-gray-200/80">
            {quote || "Stay present. Start small."}
          </p>
        </div>
      </div>
    </main>
  );
}
