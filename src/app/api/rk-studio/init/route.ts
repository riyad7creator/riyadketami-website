import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';

// One-time admin bootstrap. Disabled automatically once an admin exists.
// Requires SEED_SECRET header to prevent accidental use.
export async function POST(req: Request) {
  const secret = req.headers.get('x-seed-secret');
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    return NextResponse.json({ error: 'Admin already exists' }, { status: 409 });
  }

  const body = (await req.json()) as { email?: string; password?: string; name?: string };
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: 'email, password, name required' }, { status: 400 });
  }

  const hash = await bcrypt.hash(body.password, 12);
  const user = await User.create({
    name: body.name,
    email: body.email.toLowerCase(),
    password: hash,
    role: 'admin',
    isActive: true,
  });

  return NextResponse.json({ ok: true, id: user._id.toString() }, { status: 201 });
}
