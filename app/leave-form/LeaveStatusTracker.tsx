"use client";

import React from 'react';
import { LeaveApprovalState, LeaveStage } from './types';

interface LeaveStatusTrackerProps {
  status: LeaveStage;
  submittedAt: string;
  faculty: LeaveApprovalState;
  warden: LeaveApprovalState;
}

type StepState = 'completed' | 'pending' | 'rejected' | 'idle';

const stepStyles: Record<StepState, { text: string; dot: string; animate?: boolean }> = {
  completed: { text: 'text-green-600 dark:text-green-300', dot: 'bg-green-500' },
  pending: { text: 'text-yellow-600 dark:text-yellow-300', dot: 'bg-yellow-500', animate: true },
  rejected: { text: 'text-red-600 dark:text-red-300', dot: 'bg-red-500' },
  idle: { text: 'text-muted-foreground', dot: 'bg-gray-400' }
};

const resolveStepState = (
  step: 'submitted' | 'faculty' | 'warden' | 'complete',
  status: LeaveStage,
  faculty: LeaveApprovalState,
  warden: LeaveApprovalState
): StepState => {
  if (step === 'submitted') return 'completed';
  if (step === 'faculty') {
    if (faculty.status === 'approved') return 'completed';
    if (faculty.status === 'rejected' || status === 'rejected_faculty') return 'rejected';
    return 'pending';
  }
  if (step === 'warden') {
    if (status === 'pending_faculty' || faculty.status !== 'approved') return 'idle';
    if (warden.status === 'approved') return 'completed';
    if (warden.status === 'rejected' || status === 'rejected_warden') return 'rejected';
    return 'pending';
  }
  if (step === 'complete') {
    if (status === 'approved') return 'completed';
    if (status === 'rejected_faculty' || status === 'rejected_warden') return 'rejected';
    return 'pending';
  }
  return 'idle';
};

export function LeaveStatusTracker({ status, submittedAt, faculty, warden }: LeaveStatusTrackerProps) {
  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const steps = [
    {
      id: 'submitted',
      label: 'Submitted',
      description: `Filed on ${formatDate(submittedAt)}`
    },
    {
      id: 'faculty',
      label: 'Faculty Advisor',
      description:
        faculty.status === 'approved'
          ? `Approved on ${formatDate(faculty.actedAt)}`
          : faculty.status === 'rejected'
            ? 'Rejected'
            : 'Pending review'
    },
    {
      id: 'warden',
      label: 'Warden',
      description:
        faculty.status !== 'approved'
          ? 'Waiting for faculty clearance'
          : warden.status === 'approved'
            ? `Approved on ${formatDate(warden.actedAt)}`
            : warden.status === 'rejected'
              ? 'Rejected'
              : 'Pending review'
    },
    {
      id: 'complete',
      label: 'Final Status',
      description:
        status === 'approved'
          ? 'Ready for PDF download'
          : status.startsWith('rejected')
            ? 'Rejected'
            : 'Awaiting final approvals'
    }
  ];

  return (
    <div className="relative pl-5">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
      <div className="space-y-6">
        {steps.map((step) => {
          const state = resolveStepState(step.id as any, status, faculty, warden) as StepState;
          const style = stepStyles[state];
          return (
            <div key={step.id} className="relative flex gap-3">
              <div>
                <span className={`flex items-center gap-2 ${style.text}`}>
                  <span className={`w-2 h-2 ${style.dot} rounded-full ${style.animate ? 'animate-pulse' : ''}`}></span>
                  <span className="text-sm font-semibold">{step.label}</span>
                </span>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
