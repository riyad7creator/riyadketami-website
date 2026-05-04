import { NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { zodFail, serverError } from '@/lib/api-helpers';

export async function POST(req: Request) {
  try {
    const rateLimitRes = rateLimit(req, 5, 60000);
    if (rateLimitRes) return rateLimitRes;

    const body = await req.json() as unknown;
    const result = contactFormSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    // TODO: wire to email provider (Resend/SendGrid) in step 4
    // Submission received — no-op until email is wired

    return NextResponse.json({ message: 'Message received' });
  } catch (error) {
    return serverError('Failed to send message', error);
  }
}
