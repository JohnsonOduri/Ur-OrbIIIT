"use client";

import React, { useEffect } from 'react';
import { MessEventDashboard } from '../MessEventDashboard';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return <MessEventDashboard userEmail={user.email || ''} onNavigate={() => {}} />;
}
