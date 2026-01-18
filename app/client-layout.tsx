"use client";

import Link from "next/link";
import { Home, User, Menu } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import { AuthProvider } from "@/context/AuthContext";
import { DarkModeProvider } from "@/context/DarkModeContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <SplashScreen />
        <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold">OrbIIIT</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/menu">
                <Menu className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>
        <main className="pb-20 max-w-md mx-auto">{children}</main>
        <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-card border-t border-border">
          <div className="flex items-center justify-around py-2">
            <Link href="/" className="flex flex-col items-center py-2 px-3">
              <Home className="h-4 w-4 mb-1" />
              <span className="text-xs">HOME</span>
            </Link>

            <Link href="/profile" className="flex flex-col items-center py-2 px-3">
              <User className="h-4 w-4 mb-1" />
              <span className="text-xs">YOU</span>
            </Link>
          </div>
        </nav>
      </AuthProvider>
    </DarkModeProvider>
  );
}
