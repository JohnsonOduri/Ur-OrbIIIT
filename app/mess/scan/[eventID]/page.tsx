"use client";

import React from 'react';
import { QRScannerPage } from '../../QRScannerPage';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const id = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null;

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.replace('/login');
    return null;
  }

  // @ts-expect-error: QRScannerPage prop types differ; provide eventId for runtime usage
  return <QRScannerPage eventId={id || undefined} userEmail={user.email || ''} onNavigate={() => {}} />;
}
