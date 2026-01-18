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
import { getUserByUid, createOrUpdateUser } from "@/lib/firestore";

const MAX_SESSION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("lastLogin");
    signOut(auth).finally(() => setUser(null));
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
        router.replace("/");
      } catch (dbErr: any) {
        console.error("Firestore check failed", dbErr);
        setError("Login succeeded but we couldn't verify your profile. Please try again later.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
      setLoading(false);
    }
  }, [router]);

  return { user, loading, error, signInWithGoogleOneTap, logout };
}
