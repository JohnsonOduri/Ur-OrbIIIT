"use client";

import React from 'react';
import { EventDetailsPage } from '../../EventDetailsPage';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';

export default function Page() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? null;

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.replace('/login');
    return null;
  }

  if (!id) return <div>Invalid event</div>;
  
  return <EventDetailsPage eventId={id} userEmail={user.email || ''} onNavigate={() => {}} />;
}
