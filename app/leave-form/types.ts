export type LeaveStage =
  | 'pending_faculty'
  | 'pending_warden'
  | 'approved'
  | 'rejected_faculty'
  | 'rejected_warden';

export type StatusTone = 'yellow' | 'green' | 'red' | 'blue';

export interface LeaveApprovalState {
  status: 'pending' | 'approved' | 'rejected';
  comments: string;
  actedAt?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface LeaveStudentProfile {
  name: string;
  rollNumber: string;
  mobile: string;
  course: string;
  semester: string;
  hostel: string;
  roomNumber: string;
  email: string;
}

export interface LeaveRequest {
  id: string;
  applicationId: string;
  studentProfile: LeaveStudentProfile;
  studentAddress: string;
  contactAddress: string;
  parentMobile: string;
  parentEmail: string;
  leavePurpose: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  totalDays: number;
  workingDays: number;
  dateApplied: string;
  status: LeaveStage;
  faculty: LeaveApprovalState;
  warden: LeaveApprovalState;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  // UID of the student who created the request (used for secure queries)
  studentUid?: string | null;
}

export type UserRole = 'student' | 'faculty' | 'warden';

export const STATUS_BADGES: Record<LeaveStage, { label: string; tone: StatusTone }> = {
  pending_faculty: { label: 'Pending at Faculty', tone: 'yellow' },
  pending_warden: { label: 'Pending at Warden', tone: 'blue' },
  approved: { label: 'Approved', tone: 'green' },
  rejected_faculty: { label: 'Rejected by Faculty', tone: 'red' },
  rejected_warden: { label: 'Rejected by Warden', tone: 'red' }
};
