"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { ArrowLeft, CalendarRange, Home, Send, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import type { LeaveRequest, LeaveStudentProfile } from './types';
import { createLeaveRequestRecord, generateLeaveApplicationId, getUserByUid } from '@/lib/firestore';
import { auth } from '@/lib/firebase';

interface StudentLeaveFormProps {
  userEmail: string;
  onNavigate: (page: string) => void;
}

export function StudentLeaveForm({ userEmail, onNavigate }: StudentLeaveFormProps) {
  const [studentProfile, setStudentProfile] = useState<LeaveStudentProfile>({
    name: '',
    rollNumber: '',
    mobile: '',
    course: '',
    semester: '',
    hostel: '',
    roomNumber: '',
    email: userEmail
  });

  const [formData, setFormData] = useState({
    studentAddress: '',
    contactAddress: '',
    parentMobile: '',
    parentEmail: '',
    leavePurpose: '',
    fromDate: '',
    fromTime: '',
    toDate: '',
    toTime: ''
  });
  const [useHomeAsContact, setUseHomeAsContact] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [applicationId, setApplicationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [derivedDays, setDerivedDays] = useState({ totalDays: 0, workingDays: 0 });

  const computeWorkingDays = useMemo(
    () => (fromDate: string, toDate: string) => {
      if (!fromDate || !toDate) return { totalDays: 0, workingDays: 0 };
      const start = new Date(fromDate);
      const end = new Date(toDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        return { totalDays: 0, workingDays: 0 };
      }
      let totalDays = 0;
      let workingDays = 0;
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        totalDays += 1;
        const day = dt.getDay();
        if (day !== 0 && day !== 6) workingDays += 1;
      }
      return { totalDays, workingDays };
    },
    []
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);

        const uid = auth.currentUser!.uid;
        const profile = await getUserByUid(uid);

        // Build a best-effort full roll number (year + major + roll suffix)
        const rawRoll = (profile?.roll as string) || (profile?.rollNumber as string) || '';
        const yearPart = (profile?.year as string) || (profile?.admissionYear as string) || '';
        const majorPart = ((profile?.major as string) || (profile?.course as string) || '').toUpperCase();
        let combinedRoll = rawRoll || '';
        // If rawRoll looks like a short suffix (e.g. '0066') and we have year+major, combine them
        if (rawRoll && rawRoll.length < 6 && yearPart && majorPart) {
          combinedRoll = `${yearPart}${majorPart}${rawRoll}`;
        }

        const mapped: LeaveStudentProfile = {
          name: (profile?.name as string) || '',
          rollNumber: combinedRoll,
          mobile: (profile?.phone as string) || (profile?.mobile as string) || '',
          course: majorPart,
          semester: (profile?.semester as string) || '',
          hostel: (profile?.hostel as string) || '',
          roomNumber: (profile?.room as string) || (profile?.roomNumber as string) || '',
          email: auth.currentUser!.email || ''
        };

        setStudentProfile((prev) => ({ ...prev, ...mapped }));

        if (!applicationId) {
          setApplicationId(generateLeaveApplicationId(mapped.rollNumber || 'TEMP'));
        }

      } catch (err) {
        console.error('profile fetch failed', err);
      } finally {
        setLoadingProfile(false);
      }

    };
    loadProfile();
  }, [userEmail, applicationId]);

  useEffect(() => {
    if (!applicationId && studentProfile.rollNumber) {
      setApplicationId(generateLeaveApplicationId(studentProfile.rollNumber));
    }
  }, [applicationId, studentProfile.rollNumber]);

  useEffect(() => {
    const calc = computeWorkingDays(formData.fromDate, formData.toDate);
    setDerivedDays(calc);
  }, [formData.fromDate, formData.toDate, computeWorkingDays]);

  // When user toggles 'use home address', copy studentAddress into contactAddress
  useEffect(() => {
    if (useHomeAsContact) {
      setFormData((prev) => ({ ...prev, contactAddress: prev.studentAddress }));
    }
  }, [useHomeAsContact]);

  // Keep contactAddress synced while toggle is on
  useEffect(() => {
    if (useHomeAsContact) {
      setFormData((prev) => ({ ...prev, contactAddress: prev.studentAddress }));
    }
  }, [formData.studentAddress, useHomeAsContact]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const requiredProfileFields: Array<keyof LeaveStudentProfile> = [
      'name',
      'rollNumber',
      'mobile',
      'course',
      'semester',
      'hostel',
      'roomNumber'
    ];

    requiredProfileFields.forEach((field) => {
      if (!String(studentProfile[field] || '').trim()) {
        nextErrors[field] = 'Required';
      }
    });

    if (!formData.studentAddress.trim()) nextErrors.studentAddress = 'Required';
    if (!formData.contactAddress.trim()) nextErrors.contactAddress = 'Required';
    if (!formData.parentMobile.trim()) nextErrors.parentMobile = 'Required';
    // parent mobile must be 10 digits
    if (formData.parentMobile && !/^\d{10}$/.test(formData.parentMobile)) {
      nextErrors.parentMobile = 'Enter a 10 digit phone number';
    }
    if (!formData.parentEmail.trim()) {
      nextErrors.parentEmail = "Father's email is required";
    } else if (!emailRegex.test(formData.parentEmail)) {
      nextErrors.parentEmail = 'Enter a valid email';
    }
    if (!formData.leavePurpose.trim()) nextErrors.leavePurpose = 'Purpose is required';
    if (!formData.fromDate) nextErrors.fromDate = 'Required';
    // fromDate must be today or future
    const todayStr = new Date().toISOString().slice(0, 10);
    if (formData.fromDate && new Date(formData.fromDate) < new Date(todayStr)) {
      nextErrors.fromDate = 'From date cannot be in the past';
    }
    if (!formData.fromTime) nextErrors.fromTime = 'Required';
    if (!formData.toDate) nextErrors.toDate = 'Required';
    if (!formData.toTime) nextErrors.toTime = 'Required';
    if (formData.fromDate && formData.toDate) {
      const from = new Date(formData.fromDate);
      const to = new Date(formData.toDate);
      if (to < from) nextErrors.toDate = 'To date must be after from date';
    }
    if (derivedDays.totalDays === 0) {
      nextErrors.toDate = 'Check the date range';
    }
    // student mobile validation (10 digits)
    if (studentProfile.mobile && !/^\d{10}$/.test(studentProfile.mobile)) {
      nextErrors.mobile = 'Enter a 10 digit mobile number';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const payload: Omit<
            LeaveRequest,
            'id' | 'faculty' | 'warden' | 'rejectionReason'
          > = {
            applicationId: applicationId || generateLeaveApplicationId(studentProfile.rollNumber),

            studentProfile: {
              ...studentProfile,
              email: auth.currentUser!.email!
            },

            studentAddress: formData.studentAddress.trim(),
            contactAddress: formData.contactAddress.trim(),
            parentMobile: formData.parentMobile.trim(),
            parentEmail: formData.parentEmail.trim().toLowerCase(),
            leavePurpose: formData.leavePurpose.trim(),

            fromDate: formData.fromDate,
            fromTime: formData.fromTime,
            toDate: formData.toDate,
            toTime: formData.toTime,

            totalDays: derivedDays.totalDays,
            workingDays: derivedDays.workingDays,

            status: "pending_faculty",

            dateApplied: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
      await createLeaveRequestRecord(payload);

      toast.success('Leave request submitted. Pending faculty approval.');
      onNavigate('leave-status');
    } catch (err) {
      console.error('leave submit failed', err);
      toast.error('Could not submit right now');
    } finally {
      setSubmitting(false);
    }
  };

  const renderProfileField = (
    key: keyof LeaveStudentProfile,
    label: string,
    placeholder: string,
    type: 'text' | 'tel' | 'email' = 'text'
  ) => {
    const value = (studentProfile[key] as string) || '';
    // allow editing of profile fields even if prefilled
    // make name and rollNumber unchangeable (readonly)
    const disabled = key === 'name' || key === 'rollNumber';
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          className={`${errors[key] ? 'border-red-500' : ''} ${disabled ? 'bg-muted' : ''}`}
          onChange={(e) => {
            if (disabled) return;
            const v = e.target.value;
            if (key === 'mobile') {
              const digits = v.replace(/\D/g, '').slice(0, 10);
              setStudentProfile((prev) => ({ ...prev, [key]: digits }));
            } else {
              setStudentProfile((prev) => ({ ...prev, [key]: v }));
            }
          }}
        />
        {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
      </div>
    );
  };

  return (
    <div className="p-4 pb-32 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => onNavigate('leave-dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Apply for Leave</h1>
          <p className="text-sm text-muted-foreground">Official IIIT Kottayam leave workflow</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="h-4 w-4" />Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderProfileField('name', 'Student Name', 'Enter your full name')}
              {renderProfileField('rollNumber', 'Roll Number', 'e.g. 2024BCS0066')}
              {renderProfileField('mobile', 'Mobile Number', '10 digit mobile', 'tel')}
              {renderProfileField('course', 'Course', 'e.g. BCS')}
              {renderProfileField('semester', 'Semester', 'e.g. 4')}
              {renderProfileField('hostel', 'Hostel', 'e.g. Manimala')}
              {renderProfileField('roomNumber', 'Room Number', 'e.g. 214')}
              <div className="space-y-2">
                <Label>Student Email</Label>
                <Input value={userEmail} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Application ID</Label>
                <Input value={applicationId || 'Generating...'} disabled className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Home className="h-4 w-4" />Contact & Guardian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Home Address *</span>
                <label className="inline-flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={useHomeAsContact}
                    onChange={(e) => setUseHomeAsContact(e.target.checked)}
                  />
                  Use as contact address
                </label>
              </Label>
              <Textarea
                value={formData.studentAddress}
                onChange={(e) => setFormData({ ...formData, studentAddress: e.target.value })}
                placeholder="Full home address"
                className={errors.studentAddress ? 'border-red-500' : ''}
              />
              {errors.studentAddress && <p className="text-xs text-red-500">{errors.studentAddress}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parent Phone *</Label>
                <Input
                  type="tel"
                  value={formData.parentMobile}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, parentMobile: digits });
                  }}
                  placeholder="10 digit phone"
                  className={errors.parentMobile ? 'border-red-500' : ''}
                />
                {errors.parentMobile && <p className="text-xs text-red-500">{errors.parentMobile}</p>}
              </div>
              <div className="space-y-2">
                <Label>Father's Email *</Label>
                <Input
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder="father@domain.com"
                  className={errors.parentEmail ? 'border-red-500' : ''}
                />
                {errors.parentEmail && <p className="text-xs text-red-500">{errors.parentEmail}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact Address During Leave *</Label>
              <Textarea
                value={formData.contactAddress}
                onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })}
                placeholder="Where you will stay while on leave"
                className={errors.contactAddress ? 'border-red-500' : ''}
              />
              {errors.contactAddress && <p className="text-xs text-red-500">{errors.contactAddress}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarRange className="h-4 w-4" />Leave Window</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date *</Label>
                <Input
                  type="date"
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className={errors.fromDate ? 'border-red-500' : ''}
                  min={new Date().toISOString().slice(0, 10)}
                />
                {errors.fromDate && <p className="text-xs text-red-500">{errors.fromDate}</p>}
              </div>
              <div className="space-y-2">
                <Label>From Time *</Label>
                <Input
                  type="time"
                  value={formData.fromTime}
                  onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
                  className={errors.fromTime ? 'border-red-500' : ''}
                />
                {errors.fromTime && <p className="text-xs text-red-500">{errors.fromTime}</p>}
              </div>
              <div className="space-y-2">
                <Label>To Date *</Label>
                <Input
                  type="date"
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className={errors.toDate ? 'border-red-500' : ''}
                  min={formData.fromDate || new Date().toISOString().slice(0, 10)}
                />
                {errors.toDate && <p className="text-xs text-red-500">{errors.toDate}</p>}
              </div>
              <div className="space-y-2">
                <Label>To Time *</Label>
                <Input
                  type="time"
                  value={formData.toTime}
                  onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
                  className={errors.toTime ? 'border-red-500' : ''}
                />
                {errors.toTime && <p className="text-xs text-red-500">{errors.toTime}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm rounded-lg bg-muted/60 p-3">
              <div>
                <p className="text-muted-foreground">Total Days</p>
                <p className="text-lg font-semibold">{derivedDays.totalDays || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Working Days</p>
                <p className="text-lg font-semibold">{derivedDays.workingDays || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purpose of Leave *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={formData.leavePurpose}
              onChange={(e) => setFormData({ ...formData, leavePurpose: e.target.value })}
              rows={5}
              placeholder="Describe the reason for leave"
              className={errors.leavePurpose ? 'border-red-500' : ''}
            />
            {errors.leavePurpose && <p className="text-xs text-red-500">{errors.leavePurpose}</p>}
          </CardContent>
        </Card>

        <div className="mt-4 flex flex-col items-end gap-3">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate('leave-dashboard')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={submitting || loadingProfile}>
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-right">
            Status will move to “Pending at Faculty” after submission.
          </p>
        </div>
      </form>
    </div>
  );
}