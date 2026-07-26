/**
 * Kit.com V4 API integration.
 * All calls are fire-and-forget — failures are logged but never surface to the user.
 */

const KIT_API_BASE = 'https://api.kit.com/v4';

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
  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    console.warn('[kit] KIT_API_KEY is not set — skipping sync');
    return;
  }

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
  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    console.warn('[kit] KIT_API_KEY is not set — skipping unsubscribe sync');
    return;
  }

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
