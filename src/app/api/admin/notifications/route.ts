import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import AdminNotification from '@/models/AdminNotification';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import type { NotificationType } from '@/models/AdminNotification';

/** GET /api/admin/notifications — list unread (max 20) */
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

    const unreadCount = all
      ? await AdminNotification.countDocuments({ read: false })
      : notifications.length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return serverError('Failed to fetch notifications', error);
  }
}

/** POST /api/admin/notifications — create notification (internal use) */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json() as { type: NotificationType; title: string; body: string; link?: string };
    const { type, title, body: bodyText, link } = body;

    if (!type || !title || !bodyText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification = await AdminNotification.create({ type, title, body: bodyText, link });
    return NextResponse.json(notification.toObject(), { status: 201 });
  } catch (error) {
    return serverError('Failed to create notification', error);
  }
}

/** PATCH /api/admin/notifications — mark all as read */
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
