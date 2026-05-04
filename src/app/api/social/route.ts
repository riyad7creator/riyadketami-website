import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import SocialAccount from '@/models/SocialAccount';
import { socialAccountSchema } from '@/lib/validation';
import { requireAdmin, zodFail, serverError } from '@/lib/api-helpers';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';

    if (isAdmin) {
      const check = await requireAdmin();
      if (!check.ok) return check.response;
    }

    const query = isAdmin ? {} : { visible: true };
    const accounts = await SocialAccount.find(query).sort({ order: 1 });
    return NextResponse.json(accounts);
  } catch (error) {
    return serverError('Failed to fetch social accounts', error);
  }
}

export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await req.json() as unknown;
    const result = socialAccountSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    const account = await SocialAccount.findOneAndUpdate(
      { platform: result.data.platform },
      { ...result.data, last_updated: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(account);
  } catch (error) {
    return serverError('Failed to save social account', error);
  }
}

export async function DELETE(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    await dbConnect();
    const account = await SocialAccount.findByIdAndDelete(id);

    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    return NextResponse.json({ message: 'Account deleted' });
  } catch (error) {
    return serverError('Failed to delete account', error);
  }
}
