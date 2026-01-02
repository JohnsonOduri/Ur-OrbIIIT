"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { FileText, Users, Shield, PlusCircle, History, CheckCircle, Clock } from 'lucide-react';
import { UserRole } from './types';
import { getLeaveRequestsForStudent, getPendingFacultyLeaveRequests, getPendingWardenLeaveRequests } from '@/lib/firestore';

interface LeaveFormDashboardProps {
  userEmail: string;
  userUid?: string | null;
  userRole: UserRole;
  onNavigate: (page: string) => void;
}

export function LeaveFormDashboard({ userEmail, userUid, userRole, onNavigate }: LeaveFormDashboardProps) {
  const [stats, setStats] = useState({
    studentPending: 0,
    studentApproved: 0,
    facultyPending: 0,
    wardenPending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setStats({ studentPending: 0, studentApproved: 0, facultyPending: 0, wardenPending: 0 });
    const load = async () => {
      try {
        setLoading(true);
        if (userRole === 'student' && userUid) {
          const data = await getLeaveRequestsForStudent(userUid);
          if (!active) return;
          const pending = data.filter((req: any) => req.status === 'pending_faculty' || req.status === 'pending_warden').length;
          const approved = data.filter((req: any) => req.status === 'approved').length;
          setStats((prev) => ({ ...prev, studentPending: pending, studentApproved: approved }));
        } else if (userRole === 'faculty') {
          const data = await getPendingFacultyLeaveRequests();
          if (!active) return;
          setStats((prev) => ({ ...prev, facultyPending: data.length }));
        } else if (userRole === 'warden') {
          const data = await getPendingWardenLeaveRequests();
          if (!active) return;
          setStats((prev) => ({ ...prev, wardenPending: data.length }));
        }
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [userEmail, userRole, userUid]);

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">Student Leave Portal</h1>
        <p className="text-muted-foreground">Apply and track your leave requests</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4">
        <Button 
          onClick={() => onNavigate('leave-apply')}
          size="lg"
          className="gap-2 h-auto py-4"
          disabled={loading || (stats.studentPending || 0) > 0}
        >
          <PlusCircle className="h-5 w-5" />
          <div className="text-left">
            <div>Apply for Leave</div>
            <div className="text-xs opacity-80 font-normal">
              {((stats.studentPending || 0) > 0 && !loading)
                ? 'You have a pending request '
                : 'Submit a new leave request'
              }
            </div>
          </div>
        </Button>

        <Button 
          onClick={() => onNavigate('leave-status')}
          variant="outline"
          size="lg"
          className="gap-2 h-auto py-4"
        >
          <History className="h-5 w-5" />
          <div className="text-left">
            <div>View Leave Status</div>
            <div className="text-xs opacity-80 font-normal">Track your applications</div>
          </div>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
            <div className="text-2xl font-bold mb-1">{loading ? '—' : stats.studentPending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <div className="text-2xl font-bold mb-1">{loading ? '—' : stats.studentApproved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">How it works</h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>1. Submit your leave request with all required details</li>
            <li>2. Your Faculty Advisor will review and approve/reject</li>
            <li>3. If approved, the Warden will give final approval</li>
            <li>4. Once fully approved, download your official leave form</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );

  const renderFacultyDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold">Faculty Advisor Portal</h1>
        </div>
        <p className="text-muted-foreground">Review and approve student leave requests</p>
      </div>

      {/* Stats Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-8 text-center">
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {loading ? '—' : stats.facultyPending}
          </div>
          <p className="text-lg font-medium mb-1">Leave Requests Pending</p>
          <p className="text-sm text-muted-foreground">Awaiting your approval</p>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Button 
        onClick={() => onNavigate('faculty-approvals')}
        size="lg"
        className="w-full gap-2 h-auto py-4"
      >
        <FileText className="h-5 w-5" />
        <div className="text-left">
          <div>Review Pending Requests</div>
          <div className="text-xs opacity-80 font-normal">
            {stats.facultyPending > 0 
              ? `${stats.facultyPending} request${stats.facultyPending !== 1 ? 's' : ''} awaiting review`
              : 'All caught up!'
            }
          </div>
        </div>
      </Button>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>• Review leave requests from students under your advisement</p>
          <p>• Verify the validity and reason for leave</p>
          <p>• Approve or reject with appropriate remarks</p>
          <p>• Approved requests will be forwarded to the Warden</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderWardenDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-bold">Warden Portal</h1>
        </div>
        <p className="text-muted-foreground">Final approval for student leave requests</p>
      </div>

      {/* Stats Card */}
      <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
        <CardContent className="p-8 text-center">
          <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
            {loading ? '—' : stats.wardenPending}
          </div>
          <p className="text-lg font-medium mb-1">Final Approvals Pending</p>
          <p className="text-sm text-muted-foreground">Pre-approved by Faculty Advisors</p>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Button 
        onClick={() => onNavigate('warden-approvals')}
        size="lg"
        className="w-full gap-2 h-auto py-4 bg-indigo-600 hover:bg-indigo-700"
      >
        <Shield className="h-5 w-5" />
        <div className="text-left">
          <div>Review Final Approvals</div>
          <div className="text-xs opacity-80 font-normal">
            {stats.wardenPending > 0 
              ? `${stats.wardenPending} request${stats.wardenPending !== 1 ? 's' : ''} awaiting final approval`
              : 'All caught up!'
            }
          </div>
        </div>
      </Button>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>• Review leave requests pre-approved by Faculty Advisors</p>
          <p>• Verify accommodation and hostel-related concerns</p>
          <p>• Grant final approval or reject if necessary</p>
          <p>• Approved students can download official leave forms</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-4">
      {userRole === 'student' && renderStudentDashboard()}
      {userRole === 'faculty' && renderFacultyDashboard()}
      {userRole === 'warden' && renderWardenDashboard()}
    </div>
  );
}
