/**
 * Kit.com V4 API integration.
 * Failures are logged but never surface to the user.
 */

const KIT_API_BASE = 'https://api.kit.com/v4';

/**
 * Resend is the sending engine now; the Kit copy is optional and off unless
 * KIT_SYNC_ENABLED=true (with KIT_API_KEY). Keeping two lists in sync only adds
 * drift and a second place to erase data from.
 */
function kitKey(): string | null {
  if (process.env.KIT_SYNC_ENABLED !== 'true') return null;
  return process.env.KIT_API_KEY || null;
}

interface KitSubscriberPayload {
  email_address: string;
  first_name?: string;
}

function kitHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Kit-Api-Key': apiKey,
  };
}

/**
 * Sync a subscriber to Kit.com (create or reactivate).
 * Designed to be fire-and-forgotten: call without await and let it run in background.
 */
export async function syncToKit(payload: KitSubscriberPayload): Promise<void> {
  const apiKey = kitKey();
  if (!apiKey) return;

  try {
    const res = await fetch(`${KIT_API_BASE}/subscribers`, {
      method: 'POST',
      headers: kitHeaders(apiKey),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[kit] Sync failed (${res.status}):`, text);
    }
  } catch (err) {
    console.error('[kit] Sync error:', err);
  }
}

/**
 * Mirror a local unsubscribe to Kit so the two lists can't drift apart:
 * look the subscriber up by email, then unsubscribe them by id.
 * Fire-and-forget like syncToKit — a failure only logs.
 */
export async function unsubscribeFromKit(email: string): Promise<void> {
  const apiKey = kitKey();
  if (!apiKey) return;

  try {
    const lookup = await fetch(
      `${KIT_API_BASE}/subscribers?email_address=${encodeURIComponent(email.toLowerCase())}`,
      { headers: kitHeaders(apiKey) }
    );
    if (!lookup.ok) {
      console.error(`[kit] Unsubscribe lookup failed (${lookup.status})`);
      return;
    }

    const data = (await lookup.json()) as { subscribers?: Array<{ id: number }> };
    const id = data.subscribers?.[0]?.id;
    if (!id) return; // never synced to Kit — nothing to do

    const res = await fetch(`${KIT_API_BASE}/subscribers/${id}/unsubscribe`, {
      method: 'POST',
      headers: kitHeaders(apiKey),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[kit] Unsubscribe failed (${res.status}):`, text);
    }
  } catch (err) {
    console.error('[kit] Unsubscribe error:', err);
  }
}
