import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/connect';
import SocialAccount from '@/models/SocialAccount';
import { socialAccountSchema } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';

    if (isAdmin) {
      const session = await auth();
      if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const query = isAdmin ? {} : { visible: true };
    const accounts = await SocialAccount.find(query).sort({ order: 1 });
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch social accounts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json() as unknown;
    const result = socialAccountSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
    }

    const existing = await SocialAccount.findOne({ platform: result.data.platform });
    let account;
    if (existing) {
      Object.assign(existing, { ...result.data, last_updated: new Date() });
      account = await existing.save();
    } else {
      account = await SocialAccount.create({ ...result.data, last_updated: new Date() });
    }

    return NextResponse.json(account, { status: 200 });
  } catch (error) {
    console.error('Error upserting social account:', error);
    return NextResponse.json({ error: 'Failed to save social account' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    console.error('Error deleting social account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
