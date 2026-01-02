"use client";

import { useRouter } from "next/navigation";
import { MenuPage } from "@/components/MenuPage";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <MenuPage
      onNavigate={(page: string) => {
        // map legacy/internal menu id 'leave-dashboard' to the actual route '/leave-form'
        const route = page === 'leave-dashboard' ? 'leave-form' : page;
        router.push(`/${route}`);
      }}
    />
  );
}
