import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import AdminNotification from '@/models/AdminNotification';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { NOTIFICATION_TYPES, type NotificationType } from '@/models/AdminNotification';

/** GET /api/admin/notifications: unread (max 20) or ?all=true (max 50), plus unreadCount and total */
export async function GET(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    const query = all ? {} : { read: false };
    const notifications = await AdminNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(all ? 50 : 20)
      .lean();

    const [unreadCount, total] = await Promise.all([
      AdminNotification.countDocuments({ read: false }),
      AdminNotification.countDocuments({}),
    ]);

    return NextResponse.json({ notifications, unreadCount, total });
  } catch (error) {
    return serverError('Failed to fetch notifications', error);
  }
}

/** POST /api/admin/notifications: create a notification by hand (admin only).
 *  Server code should call notifyAdmin() from @/lib/notify instead. */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await readJson<{ type?: unknown; title?: unknown; body?: unknown; link?: unknown }>(req);
    const type = body?.type;
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const bodyText = typeof body?.body === 'string' ? body.body.trim() : '';
    const link = typeof body?.link === 'string' && body.link ? body.link : undefined;

    if (!title || !bodyText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof type !== 'string' || !(NOTIFICATION_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ error: `type must be one of: ${NOTIFICATION_TYPES.join(', ')}` }, { status: 400 });
    }
    if (title.length > 120 || bodyText.length > 1500) {
      return NextResponse.json({ error: 'title max 120, body max 1500 characters' }, { status: 400 });
    }

    const notification = await AdminNotification.create({ type: type as NotificationType, title, body: bodyText, link });
    return NextResponse.json(notification.toObject(), { status: 201 });
  } catch (error) {
    return serverError('Failed to create notification', error);
  }
}

/** PATCH /api/admin/notifications?action=read-all: mark all as read */
export async function PATCH(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    if (searchParams.get('action') === 'read-all') {
      await AdminNotification.updateMany({ read: false }, { $set: { read: true } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return serverError('Failed to update notifications', error);
  }
}
