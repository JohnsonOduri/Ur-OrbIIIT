"use client";

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Download, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { LeaveStatusTracker } from './LeaveStatusTracker';
import { LeaveRequest, STATUS_BADGES } from './types';
import { getLeaveRequestsForStudent } from '@/lib/firestore';

interface StudentLeaveStatusProps {
  userEmail: string;
  userUid?: string | null;
  onNavigate: (page: string) => void;
}

const badgeToneClass: Record<string, string> = {
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
};

export function StudentLeaveStatus({ userEmail, userUid, onNavigate }: StudentLeaveStatusProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, userUid]);

  const refresh = async () => {
    // prefer uid-based query; fall back to email (not ideal, but kept for backward compatibility)
    if (!userUid && !userEmail) return;
    try {
      setLoading(true);
      const data = userUid ? await getLeaveRequestsForStudent(userUid) : await getLeaveRequestsForStudent(userEmail!.toLowerCase());
      setLeaveRequests(data as LeaveRequest[]);
    } catch (error) {
      console.error('Failed to load leave requests', error);
      toast.error('Unable to fetch leave timeline');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const downloadPDF = async (request: LeaveRequest) => {
    if (request.status !== 'approved') return;
    try {
      setDownloadingId(request.id);
      const res = await fetch('/api/leave-form/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id })
      });
      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let bodyText = '';
        try {
          if (contentType.includes('application/json')) {
            const json = await res.json();
            bodyText = JSON.stringify(json);
          } else {
            bodyText = await res.text();
          }
        } catch (e) {
          bodyText = '<unreadable response body>';
        }
        console.error('PDF route responded with error', res.status, bodyText);
        throw new Error('PDF generation failed: ' + bodyText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Leave_${request.studentProfile.rollNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Leave form downloaded');
    } catch (error) {
      console.error('PDF download failed', error);
      toast.error('Unable to download PDF right now');
    } finally {
      setDownloadingId(null);
    }
  };

  const compactStyles: Record<string, { text: string; dot: string; animate?: boolean }> = {
    pending_faculty: { text: 'text-yellow-600 dark:text-yellow-300', dot: 'bg-yellow-500', animate: true },
    pending_warden: { text: 'text-blue-600 dark:text-blue-300', dot: 'bg-blue-500', animate: true },
    approved: { text: 'text-green-600 dark:text-green-300', dot: 'bg-green-500' },
    rejected_faculty: { text: 'text-red-600 dark:text-red-300', dot: 'bg-red-500' },
    rejected_warden: { text: 'text-red-600 dark:text-red-300', dot: 'bg-red-500' }
  };

  const renderCompactBadge = (status: string, label: string) => {
    const s = compactStyles[status] || { text: 'text-muted-foreground', dot: 'bg-gray-400' };
    return (
      <span className={`flex items-center gap-1 ${s.text}`}>
        <span className={`w-2 h-2 ${s.dot} rounded-full ${s.animate ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-semibold">{label}</span>
      </span>
    );
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background/95 to-transparent px-4 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('leave-dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Track approvals live</p>
            <h1 className="text-2xl font-bold">Leave Status</h1>
          </div>
          <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-4">
        {loading && (
          <Card className="animate-pulse">
            <CardContent className="space-y-4 p-6">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </CardContent>
          </Card>
        )}

        {!loading && leaveRequests.length === 0 && (
          <Card className="p-10 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold">No leave records yet</p>
            <p className="text-sm text-muted-foreground">
              Submit a leave form to see the approval tracker here.
            </p>
            <Button className="mt-4" onClick={() => onNavigate('leave-apply')}>
              Apply for Leave
            </Button>
          </Card>
        )}

        {leaveRequests.map((request) => {
          const statusConfig = STATUS_BADGES[request.status] || { label: 'Pending', tone: 'yellow' as const };
          return (
            <Card key={request.id} className="shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <CardTitle className="text-base sm:text-lg">
                              {request.leavePurpose || 'Leave Request'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(request.fromDate)} → {formatDate(request.toDate)}
                            </p>
                          </div>
                          {/* Render a compact dot+text badge for all statuses (matches Mess Live style) */}
                          {renderCompactBadge(request.status, statusConfig.label)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <LeaveStatusTracker
                  status={request.status}
                  submittedAt={request.dateApplied}
                  faculty={request.faculty}
                  warden={request.warden}
                />

                <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Application ID</p>
                    <p className="font-semibold">{request.applicationId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Leave Window</p>
                    <p>{formatDate(request.fromDate)} {request.fromTime || ''} → {formatDate(request.toDate)} {request.toTime || ''}</p>
                    <p className="text-xs text-muted-foreground">{request.totalDays} days • {request.workingDays} working days</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Home Address</p>
                    <p>{request.studentAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Contact During Leave</p>
                    <p>{request.contactAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Parent Contact</p>
                    <p>{request.parentMobile}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Father's Email</p>
                    <p>{request.parentEmail}</p>
                  </div>
                </div>

                {request.faculty.comments && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium">Faculty Advisor Remark</p>
                      <p className="text-muted-foreground">{request.faculty.comments}</p>
                    </CardContent>
                  </Card>
                )}
                {request.warden.comments && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium">Warden Remark</p>
                      <p className="text-muted-foreground">{request.warden.comments}</p>
                    </CardContent>
                  </Card>
                )}

                {request.status === 'approved' ? (
                  <Button
                    onClick={() => downloadPDF(request)}
                    className="w-full gap-2"
                    disabled={downloadingId === request.id}
                  >
                    <Download className="h-4 w-4" />
                    {downloadingId === request.id ? 'Preparing PDF...' : 'Download Leave Form'}
                  </Button>
                ) : request.status.startsWith('rejected') ? (
                  <Card className="border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30">
                    <CardContent className="p-4 text-sm">
                      <p className="font-semibold text-red-700 dark:text-red-200">Request Rejected</p>
                      <p className="text-red-600 dark:text-red-300">
                        {request.rejectionReason || request.faculty.comments || request.warden.comments || 'Please contact the reviewer for details.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    We will notify you once the next reviewer updates the status.
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Submitted on {new Date(request.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
