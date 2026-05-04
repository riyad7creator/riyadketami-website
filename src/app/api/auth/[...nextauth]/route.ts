import { handlers } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export const GET = handlers.GET;

export const POST = async (req: NextRequest) => {
  const rateLimitRes = rateLimit(req, 10, 60000);
  if (rateLimitRes) return rateLimitRes;
  return handlers.POST(req);
};
