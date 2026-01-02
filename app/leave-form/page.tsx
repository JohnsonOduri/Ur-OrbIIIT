"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import { LeaveFormDashboard } from "./LeaveFormDashboard";
import { StudentLeaveForm } from "./StudentLeaveForm";
import { StudentLeaveStatus } from "./StudentLeaveStatus";
import { FacultyAdvisorDashboard } from "./FacultyAdvisorDashboard";
import { WardenDashboard } from "./WardenDashboard";
import type { UserRole } from "./types";

const FACULTY_EMAIL = "odurijohnson24bcs66@iiitkottayam.ac.in";
const WARDEN_EMAIL = "machaananya24bcd27@iiitkottayam.ac.in";

type LeaveView =
  | "leave-dashboard"
  | "leave-apply"
  | "leave-status"
  | "faculty-approvals"
  | "warden-approvals";

export default function LeaveFormPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [view, setView] = useState<LeaveView>("leave-dashboard");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const email = useMemo(() => (user?.email || "").toLowerCase(), [user]);
  const uid = useMemo(() => user?.uid || null, [user]);
  const userRole: UserRole = useMemo(() => {
    if (email === FACULTY_EMAIL) return "faculty";
    if (email === WARDEN_EMAIL) return "warden";
    return "student";
  }, [email]);

  useEffect(() => {
    if (view === "faculty-approvals" && userRole !== "faculty") {
      setView("leave-dashboard");
    }
    if (view === "warden-approvals" && userRole !== "warden") {
      setView("leave-dashboard");
    }
  }, [view, userRole]);

  const handleNavigate = (target: string) => {
    if (target === "faculty-approvals" && userRole !== "faculty") {
      toast.error("Faculty view is restricted to the assigned advisor");
      setView("leave-dashboard");
      return;
    }
    if (target === "warden-approvals" && userRole !== "warden") {
      toast.error("Warden view is restricted to the assigned warden");
      setView("leave-dashboard");
      return;
    }
    setView(target as LeaveView);
  };

  if (loading) return <div className="p-6 text-center text-sm">Loading...</div>;
  if (!user) return null;

  const reviewerName = user?.displayName || (userRole === "warden" ? "Warden" : "Faculty Advisor");

  return (
    <div className="mx-auto max-w-4xl pb-12">
      {view === "leave-dashboard" && (
        <LeaveFormDashboard userEmail={email} userUid={uid} userRole={userRole} onNavigate={handleNavigate} />
      )}
      {view === "leave-apply" && <StudentLeaveForm userEmail={email} onNavigate={handleNavigate} />}
      {view === "leave-status" && <StudentLeaveStatus userEmail={email} userUid={uid} onNavigate={handleNavigate} />}
      {view === "faculty-approvals" && userRole === "faculty" && (
        <FacultyAdvisorDashboard onNavigate={handleNavigate} reviewerName={reviewerName} reviewerEmail={email} />
      )}
      {view === "warden-approvals" && userRole === "warden" && (
        <WardenDashboard onNavigate={handleNavigate} reviewerName={reviewerName} reviewerEmail={email} />
      )}
    </div>
  );
}
