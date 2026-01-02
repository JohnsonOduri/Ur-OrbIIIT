const INTERNAL_API_BASE = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL?.replace(/\/$/, '') || '';
const INTERNAL_API_KEY = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_KEY;

async function post(path: string, payload: unknown) {
  if (!INTERNAL_API_BASE || !INTERNAL_API_KEY) {
    console.warn('[notify-client] missing service config; skipping call');
    return;
  }

  try {
    await fetch(`${INTERNAL_API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': INTERNAL_API_KEY,
      },
      body: JSON.stringify(payload ?? {}),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[notify-client] call failed', error);
  }
}

export function notifyStudentLeaveCreated(payload: Record<string, any>) {
  post('/events/leave/student-created', payload);
}

export function notifyFacultyDecision(payload: Record<string, any>) {
  post('/events/leave/faculty-decision', payload);
}

export function notifyWardenDecision(payload: Record<string, any>) {
  post('/events/leave/warden-decision', payload);
}

export function notifyCommunityPost(payload: Record<string, any>) {
  post('/events/community/new-post', payload);
}
