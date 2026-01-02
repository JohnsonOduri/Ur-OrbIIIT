"use client";
import { DarkModeProvider, useDarkMode } from "@/context/DarkModeContext";
import LoginPage from "@/components/LoginPage";

function LoginWithContext() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  return <LoginPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
}

export default function Page() {
  return (
    <DarkModeProvider>
      <LoginWithContext />
    </DarkModeProvider>
  );
}
