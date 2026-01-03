"use client";

import React from 'react';
import { MessEventDashboard } from '../MessEventDashboard';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.replace('/login');
    return null;
  }

  return <MessEventDashboard userEmail={user.email || ''} onNavigate={() => {}} />;
}
