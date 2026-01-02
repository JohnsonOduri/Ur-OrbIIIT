"use client";

import "./globals.css";
import Link from "next/link";
import { Home, Calendar, Target, User, Bell, Menu } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import { AuthProvider } from "@/context/AuthContext";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
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
          </AuthProvider>
      </body>
    </html>
  );
}