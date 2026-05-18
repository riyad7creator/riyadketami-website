/**
 * Kit.com V4 API integration.
 * All calls are fire-and-forget — failures are logged but never surface to the user.
 */

const KIT_API_URL = 'https://api.kit.com/v4/subscribers';

interface KitSubscriberPayload {
  email_address: string;
  first_name?: string;
}

/**
 * Sync a subscriber to Kit.com.
 * Returns a Promise that resolves when the call completes or fails silently.
 * Designed to be fire-and-forgotten: call without await and let it run in background.
 */
export async function syncToKit(payload: KitSubscriberPayload): Promise<void> {
  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    console.warn('[kit] KIT_API_KEY is not set — skipping sync');
    return;
  }

  try {
    const res = await fetch(KIT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': apiKey,
      },
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
