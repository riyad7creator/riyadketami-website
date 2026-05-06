import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';

const schema = z.object({ email: z.string().email() });

export async function GET() {
  try {
    await dbConnect();
    const count = await Subscriber.countDocuments();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    await dbConnect();

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return NextResponse.json({ ok: true });
    }

    await Subscriber.create({ email });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
