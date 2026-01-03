"use client";

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "../../components/ui/drawer";
import { LeaveRequest } from './types';
import { getPendingFacultyLeaveRequests, updateLeaveRequestRecord } from '@/lib/firestore';

interface FacultyAdvisorDashboardProps {
  onNavigate: (page: string) => void;
  reviewerName: string;
  reviewerEmail: string;
}

export function FacultyAdvisorDashboard({ onNavigate, reviewerName, reviewerEmail }: FacultyAdvisorDashboardProps) {
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [remark, setRemark] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await getPendingFacultyLeaveRequests();
      setPendingRequests(data as LeaveRequest[]);
    } catch (error) {
      console.error('Failed to fetch pending requests', error);
      toast.error('Unable to load pending leave requests');
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setRemark('');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (processing) return;
    setDrawerOpen(false);
    setSelectedRequest(null);
    setActionType(null);
    setRemark('');
  };

  const handleDecision = async () => {
    if (!selectedRequest || !actionType) return;
    if (!remark.trim()) {
      toast.error('Comments are mandatory for audit logs');
      return;
    }
    try {
      setProcessing(true);
      const now = new Date().toISOString();
      if (actionType === 'approve') {
        await updateLeaveRequestRecord(selectedRequest.id, {
          faculty: {
            ...selectedRequest.faculty,
            status: 'approved',
            comments: remark.trim(),
            actedAt: now,
            name: reviewerName,
            email: reviewerEmail
          },
          status: 'pending_warden',
          rejectionReason: ''
        });
        toast.success('Forwarded to Warden');
      } else {
        await updateLeaveRequestRecord(selectedRequest.id, {
          faculty: {
            ...selectedRequest.faculty,
            status: 'rejected',
            comments: remark.trim(),
            actedAt: now,
            name: reviewerName,
            email: reviewerEmail
          },
          status: 'rejected_faculty',
          rejectionReason: remark.trim()
        });
        toast.error('Leave request rejected');
      }
      closeDrawer();
      refresh();
    } catch (error) {
      console.error('Failed to update leave request', error);
      toast.error('Could not update leave request. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background/95 to-transparent px-4 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('leave-dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <p className="text-xs uppercase text-muted-foreground">Faculty Advisor</p>
            <h1 className="text-2xl font-bold">Pending Approvals</h1>
            <p className="text-xs text-muted-foreground">{reviewerEmail}</p>
          </div>
          <Badge variant="secondary" className="text-base">
            {pendingRequests.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 px-4">
        {loading && (
          <Card className="animate-pulse">
            <CardContent className="space-y-2 p-6">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </CardContent>
          </Card>
        )}

        {!loading && pendingRequests.length === 0 && (
          <Card className="p-10 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <p className="text-lg font-semibold">All clear!</p>
            <p className="text-sm text-muted-foreground">No leave requests are waiting for you right now.</p>
          </Card>
        )}

        {pendingRequests.map((request) => (
          <Card key={request.id} className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">{request.studentProfile.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {request.studentProfile.rollNumber} • {request.studentProfile.course}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-300">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold">Awaiting Review</span>
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-semibold">Purpose</p>
                <p className="text-muted-foreground">{request.leavePurpose}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(request.fromDate)} → {formatDate(request.toDate)}</span>
                    <span>Out: {request.fromTime || '--:--'}</span>
                    <span>In: {request.toTime || '--:--'}</span>
                    <span className="ml-2">•</span>
                    <span>Total: <strong className="ml-1">{request.totalDays}</strong> day{request.totalDays !== 1 ? 's' : ''}</span>
                    <span>Working: <strong className="ml-1">{request.workingDays}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/40 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Hostel</p>
                  <p>{request.studentProfile.hostel} • Room {request.studentProfile.roomNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Parent Contact</p>
                  <p>{request.parentMobile}</p>
                  <p className="text-xs text-muted-foreground">{request.parentEmail}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Home Address</p>
                  <p>{request.studentAddress}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Contact During Leave</p>
                  <p>{request.contactAddress}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 gap-2" onClick={() => openDrawer(request, 'approve')}>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => openDrawer(request, 'reject')}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>

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
        ))}
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDrawer();
          } else {
            setDrawerOpen(true);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}</DrawerTitle>
            <p className="text-sm text-muted-foreground">Your remarks will be visible to the student and stored in the final PDF.</p>
          </DrawerHeader>
          {selectedRequest && (
            <div className="space-y-3 px-4 pb-4">
              <div className="rounded-lg bg-muted/60 p-3 text-sm">
                <p className="font-semibold">{selectedRequest.studentProfile.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDate(selectedRequest.fromDate)} → {formatDate(selectedRequest.toDate)} ({selectedRequest.totalDays} days)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Comments *</Label>
                <Textarea
                  rows={4}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Reason for approval / instructions to student' : 'Reason for rejection'}
                />
              </div>
            </div>
          )}
              <div className="px-4 pb-6">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button variant="outline" onClick={closeDrawer} disabled={processing} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                onClick={handleDecision}
                disabled={processing || (actionType === 'approve' && !remark.trim())}
                className={`w-full sm:w-auto ${actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                {processing ? 'Saving...' : actionType === 'approve' ? 'Forward to Warden' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}