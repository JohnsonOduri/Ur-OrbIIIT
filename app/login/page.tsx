"use client";
import { DarkModeProvider, useDarkMode } from "@/context/DarkModeContext";
import LoginPage from "@/components/LoginPage";

export default function Page() {

  const { isDarkMode, toggleDarkMode } = useDarkMode();
  return <DarkModeProvider><LoginPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} /></DarkModeProvider>;
}
