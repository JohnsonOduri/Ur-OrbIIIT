"use client";

import { useRouter } from "next/navigation";
import { ProfilePage } from "@/components/ProfilePage";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect } from "react";
import { useDarkMode } from "@/context/DarkModeContext";

export default function Page() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const { isDarkMode, toggleDarkMode } = useDarkMode(); // ✅ always runs

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <ProfilePage
      onLogout={() => router.push("/login")}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
    />
  );
}
