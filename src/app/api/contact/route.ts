import { NextResponse } from 'next/server';
import { getResend, FROM_EMAIL, ADMIN_EMAIL, escHtml, emailShell } from '@/lib/resend';
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

    const { name, email, subject, message, budget } = result.data;

    const resend = getResend();
    if (resend) {
      const budgetRow = budget
        ? `<tr><td style="padding:8px 0;color:#9ca3af;">Budget</td><td style="padding:8px 0;color:#00ff66;">${escHtml(budget)}</td></tr>`
        : '';

      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        replyTo: email,
        subject: `[riyadketami.com] ${escHtml(subject)}`,
        html: emailShell('// new contact form submission', `
          <h2 style="color:#fff;margin:0 0 24px;font-size:20px;">${escHtml(subject)}</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#9ca3af;width:100px;">From</td><td style="padding:8px 0;color:#fff;">${escHtml(name)} &lt;${escHtml(email)}&gt;</td></tr>
            ${budgetRow}
          </table>
          <hr style="border:none;border-top:1px solid #1f2937;margin:20px 0;" />
          <p style="color:#d1d5db;white-space:pre-wrap;line-height:1.6;">${escHtml(message)}</p>
          <hr style="border:none;border-top:1px solid #1f2937;margin:20px 0;" />
          <p style="color:#6b7280;font-size:11px;">Reply directly to this email to reach ${escHtml(name)}.</p>
        `),
      }).catch((err) => {
        // Email delivery failure is non-fatal — the submission was valid
        console.error('[contact] email delivery failed', err);
      });
    }

    return NextResponse.json({ message: 'Message received' });
  } catch (error) {
    return serverError('Failed to process submission', error);
  }
}
