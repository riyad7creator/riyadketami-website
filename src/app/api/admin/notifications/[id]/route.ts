import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import AdminNotification from '@/models/AdminNotification';
import { requireAdmin, serverError } from '@/lib/api-helpers';

/** PATCH /api/admin/notifications/[id] — mark single notification read */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    await dbConnect();
    const notification = await AdminNotification.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(notification.toObject());
  } catch (error) {
    return serverError('Failed to update notification', error);
  }
}

/** DELETE /api/admin/notifications/[id] — delete notification */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    await dbConnect();
    await AdminNotification.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Failed to delete notification', error);
  }
}
