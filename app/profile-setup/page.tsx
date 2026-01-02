"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileSetup from "@/components/ProfileSetup";
import { useAuthContext } from "@/context/AuthContext";

export default function Page() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  return (
    <ProfileSetup
      onRegister={() => router.push('/dashboard')}
      onSwitchToLogin={() => router.push('/login')}
      isDarkMode={false}
      toggleDarkMode={() => {}}
    />
  );
}
