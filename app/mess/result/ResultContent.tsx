"use client";

import React from 'react';
import { AttendanceResultPage, AttendanceResultPageProps } from '../AttendanceResultPage';
import { useRouter, useSearchParams } from 'next/navigation';

const decodeParam = (value: string | null): string => {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const decodeOptionalParam = (value: string | null): string | undefined => {
  const decoded = decodeParam(value);
  return decoded ? decoded : undefined;
};

export default function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();

  const status = (params.get('status') || 'error') as AttendanceResultPageProps['status'];
  const message = decodeParam(params.get('message'));
  const description = decodeParam(params.get('description'));
  const eventName = decodeOptionalParam(params.get('eventName'));
  const timestamp = decodeOptionalParam(params.get('timestamp'));

  return (
    <AttendanceResultPage
      status={status}
      message={message}
      description={description}
      eventName={eventName}
      timestamp={timestamp}
      onNavigate={() => router.push('/mess/events')}
    />
  );
}
