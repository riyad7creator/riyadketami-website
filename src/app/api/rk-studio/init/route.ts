import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';

// One-time admin bootstrap + password reset, protected by SEED_SECRET header.
export async function POST(req: Request) {
  const secret = req.headers.get('x-seed-secret');
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json()) as { email?: string; password?: string; name?: string };
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: 'email, password, name required' }, { status: 400 });
  }

  await dbConnect();

  const hash = await bcrypt.hash(body.password, 12);

  // Upsert: create if missing, reset password if exists
  const user = await User.findOneAndUpdate(
    { email: body.email.toLowerCase() },
    {
      $set: {
        name: body.name,
        password: hash,
        role: 'admin',
        isActive: true,
        loginAttempts: 0,
      },
      $unset: { lockUntil: 1 },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true, id: user._id.toString() }, { status: 200 });
}
