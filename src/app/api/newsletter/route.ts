import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getResend, FROM_EMAIL, emailShell } from '@/lib/resend';
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

    // Fire-and-forget welcome email — non-fatal, must not block the 201 response
    const resend = getResend();
    if (resend) {
      const p = resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Welcome — you're in. 👋",
        html: emailShell('// welcome to the list', `
          <h2 style="color:#fff;margin:0 0 16px;font-size:22px;">You're in. Welcome.</h2>
          <p style="color:#9ca3af;line-height:1.7;margin:0 0 16px;">Every week I send one sharp email: AI strategies, business tactics, and creator insights. No filler, no fluff.</p>
          <p style="color:#9ca3af;line-height:1.7;margin:0 0 24px;">If you ever want to work together — <a href="https://riyadketami.com/en/contact" style="color:#00ff66;text-decoration:none;">reach out here</a>.</p>
          <p style="color:#6b7280;font-size:12px;margin:0;">— Riyad<br/>riyadketami.com</p>
        `),
      });
      p.catch(() => {}); // prevent UnhandledPromiseRejection; failure is non-fatal
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
