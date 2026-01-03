"use client";

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, Shield, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "../../components/ui/drawer";
import { LeaveRequest } from './types';
import { getPendingWardenLeaveRequests, updateLeaveRequestRecord } from '@/lib/firestore';

interface WardenDashboardProps {
  onNavigate: (page: string) => void;
  reviewerName: string;
  reviewerEmail: string;
}

export function WardenDashboard({ onNavigate, reviewerName, reviewerEmail }: WardenDashboardProps) {
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
      const data = await getPendingWardenLeaveRequests();
      setPendingRequests(data as LeaveRequest[]);
    } catch (error) {
      console.error('Failed to fetch warden queue', error);
      toast.error('Unable to load final approvals');
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
          warden: {
            ...selectedRequest.warden,
            status: 'approved',
            comments: remark.trim(),
            actedAt: now,
            name: reviewerName,
            email: reviewerEmail
          },
          status: 'approved',
          rejectionReason: ''
        });
        toast.success('Leave request fully approved');
      } else {
        await updateLeaveRequestRecord(selectedRequest.id, {
          warden: {
            ...selectedRequest.warden,
            status: 'rejected',
            comments: remark.trim(),
            actedAt: now,
            name: reviewerName,
            email: reviewerEmail
          },
          status: 'rejected_warden',
          rejectionReason: remark.trim()
        });
        toast.error('Leave request rejected');
      }
      closeDrawer();
      refresh();
    } catch (error) {
      console.error('Failed to update warden decision', error);
      toast.error('Could not update leave request');
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
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <h1 className="text-2xl font-bold">Warden Final Checks</h1>
            </div>
            <p className="text-xs text-muted-foreground">{reviewerEmail}</p>
          </div>
          <Badge variant="secondary" className="text-base">
            {pendingRequests.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 px-4">
        <Card className="border-indigo-100 bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <CardContent className="p-4 text-sm text-white dark:text-white">
            All requests here are faculty-approved. Your decision unlocks the student PDF.
          </CardContent>
        </Card>

        {loading && (
          <Card className="animate-pulse">
            <CardContent className="space-y-2 p-6">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
            </CardContent>
          </Card>
        )}

        {!loading && pendingRequests.length === 0 && (
          <Card className="p-10 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <p className="text-lg font-semibold">No pending approvals</p>
          </Card>
        )}

        {pendingRequests.map((request) => (
          <Card key={request.id} className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">{request.studentProfile.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {request.studentProfile.rollNumber} • Hostel {request.studentProfile.hostel}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-200">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold">Awaiting Final Approval</span>
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-semibold">Leave Window</p>
                <p className="text-muted-foreground">
                  {formatDate(request.fromDate)} ({request.fromTime || '--:--'}) → {formatDate(request.toDate)} ({request.toTime || '--:--'})
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="mr-3">Total: <strong>{request.totalDays}</strong> day{request.totalDays !== 1 ? 's' : ''}</span>
                  <span>Working: <strong>{request.workingDays}</strong></span>
                </p>
              </div>

              {request.faculty.comments && (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-sm">
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      Faculty Remarks
                      {request.faculty.name ? (
                        <span className="ml-2 text-xs text-muted-foreground">({request.faculty.name})</span>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground">{request.faculty.comments}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/40 p-4 text-sm sm:grid-cols-2">
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
                  <p className="text-xs text-muted-foreground">{request.parentEmail}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Student Phone</p>
                  <p>{request.studentProfile.mobile}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 gap-2" onClick={() => openDrawer(request, 'approve')}>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve & Release PDF
                </Button>
                <Button variant="destructive" className="flex-1 gap-2" onClick={() => openDrawer(request, 'reject')}>
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
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
            <DrawerTitle>{actionType === 'approve' ? 'Grant Final Approval' : 'Reject Leave Request'}</DrawerTitle>
            <p className="text-sm text-muted-foreground">Remarks are logged for hostel records and student visibility.</p>
          </DrawerHeader>
          {selectedRequest && (
            <div className="space-y-3 px-4 pb-4">
              <div className="rounded-lg bg-muted/60 p-3 text-sm">
                <p className="font-semibold">{selectedRequest.studentProfile.name}</p>
                <p className="text-muted-foreground text-xs">
                  Faculty cleared on {selectedRequest.faculty.actedAt ? formatDate(selectedRequest.faculty.actedAt) : '-'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Comments *</Label>
                <Textarea
                  rows={4}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Approval note / instructions for student' : 'Reason for rejection'}
                />
              </div>
            </div>
          )}
          <DrawerFooter>
            <Button variant="outline" onClick={closeDrawer} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleDecision} disabled={processing} className={actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}>
              {processing ? 'Saving...' : actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}