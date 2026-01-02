/* eslint-disable no-restricted-globals */

// --- 1. BASIC LIFECYCLE LOGS ---
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(self.clients.claim());
});

// --- 2. GENERIC PUSH (DEVTOOLS TEST) ---
self.addEventListener("push", (event) => {
  console.log("[SW] Generic push received");

  let parsed = null;
  let rawText = "";

  if (event.data) {
    rawText = event.data.text();
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      parsed = null;
    }
  }

  const looksLikeFirebasePayload = parsed && typeof parsed === "object" && (
    parsed.notification ||
    parsed.data ||
    parsed["firebase-messaging-msg-id"]
  );

  if (looksLikeFirebasePayload) {
    console.log("[SW] Ignoring generic push because Firebase already handles notification");
    return;
  }

  const title = typeof parsed?.title === "string" && parsed.title.trim().length
    ? parsed.title.trim()
    : "DevTools Push";
  const body = typeof parsed?.body === "string" && parsed.body.trim().length
    ? parsed.body.trim()
    : rawText || "Push works 🎉";

  const notify = async () => {
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      console.warn("[SW] Notification permission missing, skipping display");
      return;
    }
    await self.registration.showNotification(title, {
      body: body || "No body",
    });
  };

  event.waitUntil(notify());
});

// --- 3. FIREBASE (REAL PUSH) ---
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBrMMe17FujqjyGLq5DL4ICLPSweW2Uzz8",
  authDomain: "orbiiit-d2dae.firebaseapp.com",
  projectId: "orbiiit-d2dae",
  messagingSenderId: "877642778795",
  appId: "1:877642778795:web:10bbc652ca01584711cfee",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[SW] FCM background message", payload);

  const { title, body } = payload.notification || {};

  if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
    console.warn("[SW] Notification permission missing, skipping FCM notification");
    return;
  }

  self.registration
    .showNotification(title || "OrbIIIT", {
      body: body || "New update",
    })
    .catch((err) => console.warn("[SW] showNotification failed", err));
});
