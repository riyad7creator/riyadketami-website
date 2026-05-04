import { NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const rateLimitRes = rateLimit(req, 5, 60000);
    if (rateLimitRes) return rateLimitRes;

    const body = await req.json() as unknown;
    const result = contactFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
    }

    const { name, email, subject, message, budget } = result.data;

    // TODO: wire to email provider (Resend/SendGrid) in step 4
    console.warn('Contact form submission:', { name, email, subject, budget, messageLength: message.length });

    return NextResponse.json({ message: 'Message received' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
