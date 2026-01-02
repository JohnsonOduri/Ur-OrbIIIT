"use client";

// Extend Window type to include Google Identity Services API
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (res: { credential?: string }) => void; [key: string]: any }) => void;
          prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
        };
      };
    };
  }
}

type GoogleMomentType = "display" | "skipped" | "dismissed";

type GooglePromptNotification = {
  getMomentType?: () => GoogleMomentType | undefined;
};

import { useEffect, useRef, useCallback } from "react";
import { useAuthContext } from "@/context/AuthContext";


interface GoogleOneTapProps {
  clientId: string;
}

export default function GoogleOneTap({ clientId }: GoogleOneTapProps) {
  const { user, loading, signInWithGoogleOneTap } = useAuthContext();
  const initialized = useRef(false);
  const prompted = useRef(false);
  const promptInProgress = useRef(false);
  const retryTimer = useRef<number | null>(null);
  const scriptEl = useRef<HTMLScriptElement | null>(null);

  const handleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (response.credential) {
        await signInWithGoogleOneTap(response.credential);
      }
    },
    [signInWithGoogleOneTap]
  );

  const showPrompt = useCallback(() => {
    if (!window.google?.accounts?.id) return;
    // only prompt when the tab is visible to avoid cross-tab/visibility conflicts
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    // If a prompt has already been shown or is in progress, skip
    if (prompted.current || promptInProgress.current) return;

    const doPrompt = () => {
      try {
        promptInProgress.current = true;
        window.google!.accounts.id.prompt((notification?: GooglePromptNotification) => {
          promptInProgress.current = false;
          if (!notification) return;

          const momentType = notification.getMomentType?.();
          switch (momentType) {
            case "display":
              console.log("[One Tap] Prompt shown");
              prompted.current = true;
              break;
            case "skipped":
              console.log("[One Tap] Prompt skipped");
              prompted.current = false;
              break;
            case "dismissed":
              console.log("[One Tap] Prompt dismissed");
              prompted.current = false;
              break;
            default:
              console.log("[One Tap] Moment status unavailable");
              prompted.current = false;
              break;
          }
        });
      } catch (err: unknown) {
        promptInProgress.current = false;
        const msg = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err);
        console.warn('[One Tap] prompt error', err);
        // If GSI/FedCM reports multiple outstanding navigator.credentials.get, schedule a retry
        if (typeof msg === 'string' && msg.includes('Only one navigator.credentials.get request may be outstanding')) {
          // reset flagged state and retry after short backoff
          prompted.current = false;
          if (retryTimer.current) window.clearTimeout(retryTimer.current);
          retryTimer.current = window.setTimeout(() => {
            retryTimer.current = null;
            try {
              doPrompt();
            } catch (e) {
              console.warn('[One Tap] retry failed', e);
            }
          }, 1500);
        }
      }
    };

    doPrompt();
  }, []);

  useEffect(() => {
    if (user || loading || initialized.current) return;

    const load = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        use_fedcm_for_prompt: true, // leave true if testing FedCM
        ux_mode: "popup",
        context: "signin",
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      initialized.current = true;
    };

    // Add script if not present
    if (!document.getElementById("gsi_script")) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = "gsi_script";
      script.onload = load;
      document.head.appendChild(script);
      scriptEl.current = script;
    } else {
      load();
    }

    return () => {
      initialized.current = false;
      prompted.current = false;
      if (scriptEl.current) {
        document.head.removeChild(scriptEl.current);
      }
      if (retryTimer.current) {
        window.clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
    };
  }, [clientId, user, loading, handleCredential, showPrompt]);

  if (user || loading) return null;

  return (
    <div className="flex flex-col items-center mt-4">
      <button
        type="button"
        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 shadow flex items-center gap-2 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        onClick={() => {
          if (!prompted.current) {
            showPrompt();
          }
        }}
      >
        {/* Google Logo */}
        Continue with Google
      </button>
    </div>
  );
}
