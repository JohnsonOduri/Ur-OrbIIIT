import { cert, getApp, getApps, initializeApp, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import type { LeaveRequest } from "@/app/leave-form/types";

let adminApp = getApps()[0];

if (!adminApp) {
  const credential = loadServiceAccount();
  adminApp = credential ? initializeApp({ credential: cert(credential) }) : initializeApp();
}

export const adminDb = getFirestore(adminApp);

export async function getLeaveRequestByIdAdmin(id: string): Promise<LeaveRequest | null> {
  if (!id) return null;
  const docSnap = await adminDb.collection("leave_requests").doc(id).get();
  if (!docSnap.exists) return null;
  const data = docSnap.data() as Omit<LeaveRequest, "id">;
  return { ...data, id: docSnap.id } as LeaveRequest;
}

function loadServiceAccount(): ServiceAccount | undefined {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
    }
    const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), "service-key.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      return JSON.parse(raw) as ServiceAccount;
    }
  } catch (error) {
    console.warn("Failed to load Firebase service account", error);
  }
  return undefined;
}
