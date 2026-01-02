// lib/firestore.ts
import { getFirestore, collection, doc, getDoc, setDoc, query, serverTimestamp, where, getDocs, addDoc, deleteDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";
import app, { auth } from "./firebase";
import type { LeaveRequest, LeaveStudentProfile } from "@/app/leave-form/types";

const db = getFirestore(app);

export const usersCollection = collection(db, "users");
const leaveRequestsCollection = collection(db, "leave_requests");
export const FACULTY_APPROVER_EMAIL = "odurijohnson24bcs66@iiitkottayam.ac.in";
export const WARDEN_APPROVER_EMAIL = "machaananya24bcd27@iiitkottayam.ac.in";

const normalizeEmail = (email: string | null | undefined) => (email || "").trim().toLowerCase();

const computeWorkingDays = (fromDate: string, toDate: string) => {
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
    if (day !== 0 && day !== 6) {
      workingDays += 1;
    }
  }
  return { totalDays, workingDays };
};

export function generateLeaveApplicationId(rollNumber?: string | null) {
  const trimmed = (rollNumber || "GEN").replace(/\s+/g, "").toUpperCase();
  const suffix = Math.floor(10000 + Math.random() * 90000);
  return `IIITK-LF-${trimmed}-${suffix}`;
}
export async function getUserByUid(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function createLeaveRequestRecord(input: {
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
  totalDays?: number;
  workingDays?: number;
  dateApplied: string;
}): Promise<LeaveRequest> {
  const { totalDays, workingDays } = computeWorkingDays(input.fromDate, input.toDate);
  const base: Omit<LeaveRequest, "id"> = {
  ...input,
  totalDays: input.totalDays ?? totalDays,
  workingDays: input.workingDays ?? workingDays,

  status: "pending_faculty",
  // default approval state objects
  faculty: { status: 'pending', comments: '', actedAt: null, name: null, email: FACULTY_APPROVER_EMAIL },
  warden: { status: 'pending', comments: '', actedAt: null, name: null, email: WARDEN_APPROVER_EMAIL },
  rejectionReason: '',
  // store the creating user's uid for secure queries
  studentUid: auth.currentUser ? auth.currentUser.uid : null,

  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};


  const ref = await addDoc(leaveRequestsCollection, base);
  return { id: ref.id, ...base };
}

export async function updateLeaveRequestRecord(id: string, updates: Partial<LeaveRequest>) {
  if (!id) throw new Error("id required");
  const d = doc(db, "leave_requests", id);
  await setDoc(d, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
  const snap = await getDoc(d);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<LeaveRequest, "id">;
  return { ...data, id: snap.id } as LeaveRequest;
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequest | null> {
  if (!id) return null;
  const d = doc(db, "leave_requests", id);
  const snap = await getDoc(d);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<LeaveRequest, "id">;
  return { ...data, id: snap.id } as LeaveRequest;
}

export async function getLeaveRequestsForStudent(uid: string): Promise<LeaveRequest[]> {
  if (!uid) return [];
  const q = query(leaveRequestsCollection, where("studentUid", "==", uid));
  const snap = await getDocs(q);
  const out: LeaveRequest[] = [];
  snap.forEach((d) => {
    out.push({ ...(d.data() as Omit<LeaveRequest, 'id'>), id: d.id });
  });
  return out.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function getPendingFacultyLeaveRequests(): Promise<LeaveRequest[]> {
  const q = query(leaveRequestsCollection, where("status", "==", "pending_faculty"));
  const snap = await getDocs(q);
  const out: LeaveRequest[] = [];
  snap.forEach((d) => out.push({ ...(d.data() as Omit<LeaveRequest, 'id'>), id: d.id }));
  return out.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
}

export async function getPendingWardenLeaveRequests(): Promise<LeaveRequest[]> {
  const q = query(leaveRequestsCollection, where("status", "==", "pending_warden"));
  const snap = await getDocs(q);
  const out: LeaveRequest[] = [];
  snap.forEach((d) => {
    const data = d.data() as Omit<LeaveRequest, 'id'>;
    out.push({ ...data, id: d.id });
  });
  return out.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
}

export async function getUserByEmail(email: string): Promise<Record<string, unknown> | null> {
  if (!email) return null;
  const q = query(usersCollection, where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) };
}

export async function getUserByUsername(username: string): Promise<Record<string, unknown> | null> {
  if (!username) return null;
  const normalized = (username || '').toString().trim().toLowerCase();
  const q = query(usersCollection, where("orbiiid", "==", normalized));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) };
}

export async function getUserById(uid: string): Promise<Record<string, unknown> | null> {
  if (!uid) return null;
  const d = doc(db, "users", uid);
  const snap = await getDoc(d);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Record<string, unknown>) };
}

export async function createOrUpdateUser(uid: string, data: Record<string, unknown>) {
  if (!uid) throw new Error("uid required");
  const d = doc(db, "users", uid);
  await setDoc(d, data, { merge: true });
  return { id: uid, ...data };
}

// User tasks: stored in a top-level collection 'user_tasks' with fields: owner (uid), title, date (YYYY-MM-DD), time (HH:MM), slot (optional), createdAt
const userTasksCollection = collection(db, 'user_tasks');

export async function addUserTask(uid: string, task: { title: string; date?: string; time?: string; slot?: string }) {
  if (!uid) throw new Error('uid required');
  const docRef = await addDoc(userTasksCollection, {
    owner: uid,
    title: task.title,
    date: task.date || null,
    time: task.time || null,
    slot: task.slot || null,
    completed: false,
    createdAt: new Date().toISOString(),
    // expire in 7 days by default
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  return { id: docRef.id, owner: uid, title: task.title, date: task.date, time: task.time, slot: task.slot };
}

export async function updateUserTask(uid: string, taskId: string, updates: Record<string, any>) {
  if (!uid) throw new Error('uid required');
  if (!taskId) throw new Error('taskId required');
  const d = doc(db, 'user_tasks', taskId);
  await setDoc(d, updates, { merge: true });
  const snap = await getDoc(d);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Record<string, any>) };
}

export async function getUserTasksForRange(uid: string, startDateISO: string, endDateISO: string) {
  if (!uid) return [];
  const q = query(userTasksCollection, where('owner', '==', uid));
  const snap = await getDocs(q);
  const out: any[] = [];
  snap.forEach(s => {
    const data = s.data();
    const date = data.date || null;
    if (!date) return;
    if (date >= startDateISO && date <= endDateISO) {
      out.push({ id: s.id, ...(data as Record<string, any>) });
    }
  });
  // sort by time (nulls first)
  out.sort((a,b)=>{
    if (!a.time && b.time) return -1;
    if (a.time && !b.time) return 1;
    if (!a.time && !b.time) return 0;
    return String(a.time).localeCompare(String(b.time));
  });
  return out;
}

export async function deleteUserTasksBefore(uid: string, beforeDateISO: string) {
  if (!uid) return 0;
  const q = query(userTasksCollection, where('owner', '==', uid));
  const snap = await getDocs(q);
  let removed = 0;
  const promises: Promise<void>[] = [];
  snap.forEach(s => {
    const data = s.data();
    const date = data.date || null;
    const expiresAt = data.expiresAt || null;
    // Convert cutoff to Date
    const cutoff = new Date(beforeDateISO);
    if (expiresAt) {
      try {
        const ex = new Date(String(expiresAt));
        if (ex < cutoff) {
          promises.push(deleteDoc(doc(db, 'user_tasks', s.id)));
          removed++;
        }
        return;
      } catch (e) {
        // fallthrough to date check
      }
    }
    if (date && date < beforeDateISO) {
      promises.push(deleteDoc(doc(db, 'user_tasks', s.id)));
      removed++;
    }
  });
  await Promise.all(promises);
  return removed;
}

// --- New helpers for per-user courses and FCM token ---

const userCoursesCollection = collection(db, 'user_courses');
const userMetaCollection = collection(db, 'user_meta');

// --- attendance collection helpers ---
const attendanceCollection = collection(db, 'attendance');

/**
 * Get the attendance document for a user (single doc per user).
 * Returns null if none exists.
 */
export type AttendanceDoc = { id: string; courses: any[] };

export async function getUserAttendanceDoc(uid: string): Promise<AttendanceDoc | null> {
  if (!uid) return null;
  const q = query(attendanceCollection, where('owner', '==', uid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data() as Record<string, any>;
  return { id: d.id, courses: Array.isArray(data.courses) ? data.courses : [] };
}

export async function ensureUserAttendanceDoc(uid: string): Promise<AttendanceDoc> {
  if (!uid) throw new Error('uid required');
  const existing = await getUserAttendanceDoc(uid);
  if (existing) return existing;
  const ref = await addDoc(attendanceCollection, { owner: uid, courses: [] });
  const created = await getDoc(doc(db, 'attendance', ref.id));
  const data = created.data() as Record<string, any>;
  return { id: created.id, courses: Array.isArray(data.courses) ? data.courses : [] };
}


/**
 * Upsert (absolute set) a course entry in a user's attendance doc.
 * Creates doc if missing. Course code normalized to UPPERCASE.
 */
export async function upsertUserAttendanceCourseAbsolute(uid: string, code: string, attended: number, total: number) {
  if (!uid) throw new Error('uid required');
  if (!code) throw new Error('code required');
  const docRec = await ensureUserAttendanceDoc(uid);
  const courses = Array.isArray(docRec.courses) ? docRec.courses.slice() : [];
  const k = String(code).toUpperCase();
  const idx = courses.findIndex((c: any) => String(c.code || '').toUpperCase() === k);
  if (idx >= 0) {
    courses[idx] = { ...courses[idx], code: k, attended: Number(attended || 0), total: Number(total || 0) };
  } else {
    courses.push({ code: k, attended: Number(attended || 0), total: Number(total || 0) });
  }
  await setDoc(doc(db, 'attendance', docRec.id), { courses }, { merge: true });
  return { id: docRec.id, courses };
}

/**
 * Increment attendance counts for a course in the user's attendance doc.
 * attendedInc and totalInc can be positive/negative integers (use 1 for marking).
 * Ensures values are non-negative.
 */
export async function incrementUserAttendanceCourse(uid: string, code: string, attendedInc = 0, totalInc = 0) {
  if (!uid) throw new Error('uid required');
  if (!code) throw new Error('code required');
  const docRec = await ensureUserAttendanceDoc(uid);
  const courses = Array.isArray(docRec.courses) ? docRec.courses.slice() : [];
  const k = String(code).toUpperCase();
  const idx = courses.findIndex((c: any) => String(c.code || '').toUpperCase() === k);
  if (idx >= 0) {
    const cur = courses[idx];
    const newAtt = Math.max(0, Number(cur.attended || 0) + Number(attendedInc || 0));
    const newTot = Math.max(0, Number(cur.total || 0) + Number(totalInc || 0));
    courses[idx] = { ...cur, code: k, attended: newAtt, total: newTot };
  } else {
    // create new entry if missing
    const newAtt = Math.max(0, Number(attendedInc || 0));
    const newTot = Math.max(0, Number(totalInc || 0));
    courses.push({ code: k, attended: newAtt, total: newTot });
  }
  await setDoc(doc(db, 'attendance', docRec.id), { courses }, { merge: true });
  return { id: docRec.id, courses };
}

/**
 * Delete a course entry from a user's attendance doc.
 */
export async function deleteUserAttendanceCourse(uid: string, code: string) {
  if (!uid) throw new Error('uid required');
  if (!code) throw new Error('code required');
  const docRec = await getUserAttendanceDoc(uid);
  if (!docRec) return 0;
  const courses = Array.isArray(docRec.courses) ? docRec.courses.slice() : [];
  const k = String(code).toUpperCase();
  const filtered = courses.filter((c: any) => String(c.code || '').toUpperCase() !== k);
  if (filtered.length === courses.length) return 0;
  await setDoc(doc(db, 'attendance', docRec.id), { courses: filtered }, { merge: true });
  return 1;
}

/**
 * Get user-saved courses (each doc has: owner, code, name, attended, total)
 */
export async function getUserCourses(uid: string) {
  if (!uid) return [];
  const q = query(userCoursesCollection, where('owner', '==', uid));
  const snap = await getDocs(q);
  const out: any[] = [];
  snap.forEach(d => out.push({ ...(d.data() as Record<string, any>), id: d.id }));
  // sort by code/name
  out.sort((a,b) => String(a.code || '').localeCompare(String(b.code || '')));
  return out;
}

/**
 * Upsert a course for a user by (owner, code).
 * course: { code, name, attended, total }
 */
export async function addOrUpdateUserCourse(uid: string, course: { code: string; name?: string; attended?: number; total?: number; }) {
  if (!uid) throw new Error('uid required');
  const q = query(userCoursesCollection, where('owner', '==', uid), where('code', '==', course.code));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    await setDoc(doc(db, 'user_courses', d.id), { ...course }, { merge: true });
    const updated = await getDoc(doc(db, 'user_courses', d.id));
    return { id: updated.id, ...(updated.data() as Record<string, any>) };
  } else {
    const ref = await addDoc(userCoursesCollection, { owner: uid, ...course });
    const created = await getDoc(doc(db, 'user_courses', ref.id));
    return { id: created.id, ...(created.data() as Record<string, any>) };
  }
}

/**
 * Delete a user's course by owner and course code.
 * Returns number of deleted documents (0 or 1).
 */
export async function deleteUserCourse(uid: string, code: string) {
  if (!uid) throw new Error('uid required');
  if (!code) throw new Error('code required');
  const q = query(userCoursesCollection, where('owner', '==', uid), where('code', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) return 0;
  const ops: Promise<void>[] = [];
  snap.forEach(d => {
    ops.push(deleteDoc(doc(db, 'user_courses', d.id)));
  });
  await Promise.all(ops);
  return snap.size;
}

/**
 * Save a user's FCM push token in a simple doc.
 */
export async function setUserFcmToken(uid: string, token: string) {
  if (!uid) throw new Error('uid required');
  const q = query(userMetaCollection, where('owner', '==', uid));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    await setDoc(doc(db, 'user_meta', d.id), { fcmToken: token }, { merge: true });
    const updated = await getDoc(doc(db, 'user_meta', d.id));
    return { id: updated.id, ...(updated.data() as Record<string, any>) };
  } else {
    const ref = await addDoc(userMetaCollection, { owner: uid, fcmToken: token });
    const created = await getDoc(doc(db, 'user_meta', ref.id));
    return { id: created.id, ...(created.data() as Record<string, any>) };
  }
}

// --- New helpers for mess ratings ---
const messRatingsCollection = collection(db, 'mess_ratings');

// --- mess events + attendance ---
const messEventsCollection = collection(db, 'mess_events');
const messEventAttendanceCollection = collection(db, 'mess_event_attendance');

export interface MessEventRecord {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  qrCode: string;
  attendeeCount: number;
}

export async function createMessEvent(data: {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
    }) {
  if (!auth.currentUser) {
    throw new Error("Not authenticated");
  }

    const payload = {
      name: data.name,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      qrCode: crypto.randomUUID(),          // REQUIRED
      attendeeCount: 0,
      createdAt: serverTimestamp(),         // 🔴 REQUIRED BY RULES
  };

  const ref = await addDoc(collection(db, "mess_events"), payload);

  const snap = await getDoc(doc(db, "mess_events", ref.id));
  return { id: snap.id, ...(snap.data() as any) };
}

export async function listMessEvents(): Promise<MessEventRecord[]> {
  const snap = await getDocs(messEventsCollection);
  const out: MessEventRecord[] = [];
  snap.forEach(d => out.push({ ...(d.data() as any), id: d.id } as MessEventRecord));
  return out.sort((a,b)=>a.date.localeCompare(b.date));
}

/**
 * Subscribe to realtime changes in `mess_events` collection.
 * Calls `callback` with the current array of `MessEventRecord` on every update.
 * Returns an unsubscribe function.
 */
export function subscribeToMessEvents(callback: (events: MessEventRecord[]) => void) {
  const q = query(messEventsCollection);
  const unsub = onSnapshot(q, (snap) => {
    const out: MessEventRecord[] = [];
    snap.forEach(d => out.push({ ...(d.data() as any), id: d.id } as MessEventRecord));
    callback(out.sort((a,b)=>a.date.localeCompare(b.date)));
  }, (err) => {
    console.error('subscribeToMessEvents error', err);
    callback([]);
  });
  return unsub;
}

export async function getMessEventById(id: string): Promise<MessEventRecord | null> {
  if (!id) return null;
  const snap = await getDoc(doc(db, 'mess_events', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as MessEventRecord;
}

export async function regenerateMessEventQr(id: string) {
  const newQr = `event-${Date.now()}`;
  await setDoc(doc(db, 'mess_events', id), { qrCode: newQr }, { merge: true });
  const updated = await getMessEventById(id);
  return updated;
}

export async function hasUserAttendedEvent(uid: string, eventId: string) {
  const q = query(
    messEventAttendanceCollection,
    where("userId", "==", uid),
    where("eventId", "==", eventId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function getUserAttendanceRecord(uid: string, eventId: string) {
  const q = query(
    messEventAttendanceCollection,
    where("userId", "==", uid),
    where("eventId", "==", eventId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...(d.data() as Record<string, any>), id: d.id };
}


export async function markAttendanceForEvent(
  uid: string | null,
  email: string | null,
  eventId: string
) {
  if (!uid) throw new Error("Auth required");
  if (!eventId) throw new Error("eventId required");

  const payload = {
    userId: uid,
    email: email ?? null,
    eventId,
    attendedAt: serverTimestamp(), // 🔴 timestamp, not string
  };

  const ref = await addDoc(messEventAttendanceCollection, payload);
  // increment attendeeCount on the event document (atomic)
  try {
    await updateDoc(doc(db, 'mess_events', eventId), { attendeeCount: increment(1) });
  } catch (e) {
    // non-fatal — if update fails, attendance doc still exists; log and continue
    console.error('failed to increment attendeeCount', e);
  }

  return { id: ref.id, timestamp: new Date().toISOString() };
}
/**
 * Add or update a user's rating for a given day & meal.
 * If uid provided, upsert (owner, day, meal) record. If no uid, add anonymous record.
 * rating: number (1-5)
 */
export async function addOrUpdateMessRating(uid: string | null, day: string, meal: string, rating: number) {
  if (!day) throw new Error('day required');
  if (!meal) throw new Error('meal required');
  const normalizedDay = String(day).toUpperCase();
  const normalizedMeal = String(meal).trim();
  const r = Number(rating) || 0;
  if (uid) {
    const q = query(messRatingsCollection, where('owner', '==', uid), where('day', '==', normalizedDay), where('meal', '==', normalizedMeal));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      await setDoc(doc(db, 'mess_ratings', d.id), { rating: r, updatedAt: new Date().toISOString() }, { merge: true });
      const updated = await getDoc(doc(db, 'mess_ratings', d.id));
      return { id: updated.id, ...(updated.data() as Record<string, any>) };
    } else {
      const ref = await addDoc(messRatingsCollection, { owner: uid, day: normalizedDay, meal: normalizedMeal, rating: r, createdAt: new Date().toISOString() });
      const created = await getDoc(doc(db, 'mess_ratings', ref.id));
      return { id: created.id, ...(created.data() as Record<string, any>) };
    }
  } else {
    // anonymous - just add a record
    const ref = await addDoc(messRatingsCollection, { owner: null, day: normalizedDay, meal: normalizedMeal, rating: r, createdAt: new Date().toISOString() });
    const created = await getDoc(doc(db, 'mess_ratings', ref.id));
    return { id: created.id, ...(created.data() as Record<string, any>) };
  }
}

/**
 * Get aggregated ratings for a given day.
 * Returns mapping: { [mealName]: { avg: number; count: number; relative: number } }
 * relative: comparative score among meals that day scaled 0..5 (higher means better than peers).
 */
export async function getAggregatedRatingsForDay(day: string) {
  if (!day) return {};
  const normalizedDay = String(day).toUpperCase();
  const q = query(messRatingsCollection, where('day', '==', normalizedDay));
  const snap = await getDocs(q);
  const map: Record<string, { sum: number, count: number }> = {};
  snap.forEach(d => {
    const data = d.data() as Record<string, any>;
    const meal = String(data.meal || 'Unknown').trim();
    const r = Number(data.rating || 0);
    if (!map[meal]) map[meal] = { sum: 0, count: 0 };
    map[meal].sum += r;
    map[meal].count += 1;
  });
  // compute avg per meal
  const temp: Record<string, { avg: number; count: number }> = {};
  Object.keys(map).forEach(meal => {
    const { sum, count } = map[meal];
    temp[meal] = { avg: count ? +(sum / count).toFixed(2) : 0, count };
  });
  // compute min/max across meals to derive relative scores
  const avgs = Object.values(temp).map(x => x.avg);
  const minAvg = avgs.length ? Math.min(...avgs) : 0;
  const maxAvg = avgs.length ? Math.max(...avgs) : 0;
  const out: Record<string, { avg: number; count: number; relative: number }> = {};
  Object.keys(temp).forEach(meal => {
    const { avg, count } = temp[meal];
    let relative = 0;
    if (maxAvg === minAvg) {
      // all meals equal -> use absolute avg as relative fallback
      relative = avg;
    } else {
      // scale avg in [minAvg..maxAvg] to [0..5]
      relative = +(((avg - minAvg) / (maxAvg - minAvg)) * 5).toFixed(2);
    }
    out[meal] = { avg, count, relative };
  });
  return out;
}

export default db;