import app from "./firebase";

const SW_PATH = "/firebase-messaging-sw.js";
let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

async function ensureMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;

  if (swRegistrationPromise) {
    return swRegistrationPromise;
  }

  swRegistrationPromise = (async () => {
    const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (existing) {
      console.info(`[FCM] Using existing service worker: ${existing.scope}`);
      return existing;
    }

    console.info("[FCM] Registering firebase-messaging service worker");
    const registration = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    await navigator.serviceWorker.ready;
    console.info("[FCM] Service worker ready");
    return registration;
  })().catch((err) => {
    console.warn("[FCM] Service worker registration failed", err);
    swRegistrationPromise = null;
    throw err;
  });

  return swRegistrationPromise;
}

export async function registerPushToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    if (!("serviceWorker" in navigator)) {
      console.info("[FCM] Service workers not supported; skipping token registration");
      return null;
    }
    if (!window.isSecureContext) {
      console.info("[FCM] Push requires HTTPS; skipping token registration");
      return null;
    }

    const messagingModule = await import("firebase/messaging");
    const { isSupported, getMessaging, getToken } = messagingModule;
    const supported = await isSupported();
    if (!supported) {
      console.info("[FCM] Firebase Messaging not supported in this browser");
      return null;
    }

    if (typeof Notification === "undefined") {
      console.info("[FCM] Notifications API unavailable; skipping token registration");
      return null;
    }

    if (Notification.permission !== "granted") {
      console.info(`[FCM] Permission is ${Notification.permission}; token request aborted`);
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("[FCM] Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY; cannot fetch token");
      return null;
    }

    const registration = await ensureMessagingServiceWorker();
    if (!registration) {
      console.warn("[FCM] No service worker registration available for messaging");
      return null;
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.info("[FCM] Obtained device token");
    } else {
      console.warn("[FCM] getToken returned empty value");
    }

    return token || null;
  } catch (err) {
    console.warn("[FCM] registerPushToken failed", err);
    return null;
  }
}
