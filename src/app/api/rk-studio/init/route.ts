import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';
import { readJson, serverError, zodFail } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(100),
  password: z.string().min(12, 'Password must be at least 12 characters').max(200),
  name: z.string().trim().min(1).max(60),
});

function secretMatches(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * One-time admin bootstrap + password reset, protected by SEED_SECRET header.
 * Disabled (404) unless ALLOW_SEED=1 is set for the deployment; turn it off
 * again once the admin exists.
 */
export async function POST(req: Request) {
  if (process.env.ALLOW_SEED !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const limited = await rateLimit(req, 3, 60 * 60 * 1000, 'seed');
  if (limited) return limited;

  const expected = process.env.SEED_SECRET ?? '';
  const secret = req.headers.get('x-seed-secret') ?? '';
  if (expected.length < 32 || !secret || !secretMatches(secret, expected)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const parsed = bodySchema.safeParse(await readJson(req));
    if (!parsed.success) return zodFail(parsed.error);
    const { email, password, name } = parsed.data;

    await dbConnect();

    const hash = await bcrypt.hash(password, 12);

    // Upsert: create if missing, reset password if exists
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
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
  } catch (error) {
    return serverError('Seed failed', error);
  }
}
