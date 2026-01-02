"use client";

import { useEffect, useState, useCallback } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { getUserByUid, createOrUpdateUser, setUserFcmToken } from "@/lib/firestore";
import { registerPushToken } from "@/lib/push";

const MAX_SESSION = 7 * 24 * 60 * 60 * 1000; // 7 days
const FCM_TOKEN_KEY = "orbiiit:fcmToken";
const FCM_PROMPT_KEY = "orbiiit:fcmPrompted";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("lastLogin");
    signOut(auth).finally(() => setUser(null));
  }, []);

  const ensurePushRegistration = useCallback(async (uid: string | null) => {
    if (typeof window === "undefined" || !uid) return;
    if (typeof Notification === "undefined") {
      console.info("[FCM] Notifications API unavailable in this environment");
      return;
    }

    console.info(`[FCM] Permission state: ${Notification.permission}`);

    if (Notification.permission === "default") {
      const alreadyPrompted = localStorage.getItem(FCM_PROMPT_KEY) === "1";
      if (alreadyPrompted) {
        console.info("[FCM] Permission default but prompt already shown; awaiting user action");
        return;
      }
      const result = await Notification.requestPermission();
      localStorage.setItem(FCM_PROMPT_KEY, "1");
      console.info(`[FCM] Permission request result: ${result}`);
      if (result !== "granted") {
        return;
      }
    } else if (Notification.permission === "denied") {
      console.info("[FCM] Notifications denied by user; skipping token registration");
      return;
    }

    const existingToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (existingToken) {
      console.info("[FCM] Using cached FCM token");
      try {
        await setUserFcmToken(uid, existingToken);
      } catch (err) {
        console.warn("[FCM] Failed to sync cached token", err);
      }
      return;
    }

    const token = await registerPushToken();
    if (!token) {
      console.warn("[FCM] Token generation returned null");
      return;
    }

    localStorage.setItem(FCM_TOKEN_KEY, token);
    try {
      await setUserFcmToken(uid, token);
      console.info("[FCM] Stored new FCM token for user");
    } catch (err) {
      console.warn("[FCM] Failed to save token to Firestore", err);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const lastLogin = Number(localStorage.getItem("lastLogin"));
        const now = Date.now();
        if (!lastLogin) {
          localStorage.setItem("lastLogin", now.toString());
          setUser(firebaseUser);
        } else if (now - lastLogin > MAX_SESSION) {
          logout();
        } else {
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [logout]);

  useEffect(() => {
    if (!user) return;
    ensurePushRegistration(user.uid);
  }, [user, ensurePushRegistration]);

  const signInWithGoogleOneTap = useCallback(async (idToken: string) => {
    setError(null);
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const loggedInUser = result.user;
      
      if (!loggedInUser.email?.endsWith("@iiitkottayam.ac.in")) {
        await signOut(auth);
        setUser(null);
        setError("Only college email accounts are allowed.");
        setLoading(false);
        return;
      }
      
      localStorage.setItem("lastLogin", Date.now().toString());
      setUser(loggedInUser);

      const email = loggedInUser.email || "";
      try {
        const existing = await getUserByUid(loggedInUser.uid);
        if (!existing) {
          // Redirect to profile setup page to collect profile info
          setLoading(false);
          router.replace("/profile-setup");
          return;
        }
        // Optionally sync basic info to Firestore
        await createOrUpdateUser(loggedInUser.uid, {
          email,
          name: loggedInUser.displayName || "",
          photoURL: loggedInUser.photoURL || "",
        });

        setError(null);
        setLoading(false);
        router.replace("/dashboard");
        ensurePushRegistration(loggedInUser.uid);
      } catch (dbErr: any) {
        console.error("Firestore check failed", dbErr);
        setError("Login succeeded but we couldn't verify your profile. Please try again later.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
      setLoading(false);
    }
  }, [router, ensurePushRegistration]);

  return { user, loading, error, signInWithGoogleOneTap, logout };
}
