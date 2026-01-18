"use client";

import GoogleOneTap from "@/components/GoogleOneTap";
import { Button } from "./ui/button";
import { Sun, Moon } from "lucide-react";
import { useEffect } from "react";

interface LoginPageProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function LoginPage({ isDarkMode, toggleDarkMode }: LoginPageProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Branding */}
        <div className="text-center mb-10">
    <h1 className="text-4xl font-bold mb-2">Welcome to ORBIIIT</h1>
    <br />
    <p className="text-sm text-muted-foreground mt-1">
      Only valid <span className="font-mono">@iiitkottayam.ac.in</span> emails are accepted.
      Tap on Continue with Google to Login, wait for it to be initiated
    </p>
  </div>


      {/* Google One Tap Login */}
      <div className="w-full max-w-sm">
        <GoogleOneTap clientId={clientId} />
      </div>
    </div>
  );
}
