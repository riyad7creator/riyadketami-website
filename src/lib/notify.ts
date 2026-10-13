import dbConnect from '@/lib/db/connect';
import AdminNotification from '@/models/AdminNotification';
import type { NotificationType } from '@/models/AdminNotification';

/**
 * Create an admin notification directly in the database.
 *
 * Public routes (contact, newsletter) used to POST to /api/admin/notifications
 * over HTTP, but every /api/admin route requires an admin session, so those
 * requests were rejected with 401 and no notification was ever created.
 * Never throws: a notification failure must not fail the visitor's request.
 */
export async function notifyAdmin(n: { type: NotificationType; title: string; body: string; link?: string }) {
  try {
    await dbConnect();
    await AdminNotification.create({
      ...n,
      title: n.title.slice(0, 120),
      body: n.body.slice(0, 1500),
    });
  } catch (err) {
    console.error('[notify] failed to create admin notification', err);
  }
}
