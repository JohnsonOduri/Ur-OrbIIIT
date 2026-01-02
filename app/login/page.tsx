"use client";
import { useDarkMode } from "@/context/DarkModeContext";
import LoginPage from "@/components/LoginPage";

export default function Page() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  return <LoginPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
}
