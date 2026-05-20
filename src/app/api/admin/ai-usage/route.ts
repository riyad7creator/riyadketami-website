import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import AIUsage from '@/models/AIUsage';
import { requireAdmin, serverError } from '@/lib/api-helpers';

/** GET /api/admin/ai-usage — monthly aggregation */
export async function GET() {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthly, byModel] = await Promise.all([
      AIUsage.aggregate<{ totalPrompt: number; totalCompletion: number; totalCost: number; count: number }>([
        { $match: { createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            totalPrompt: { $sum: '$promptTokens' },
            totalCompletion: { $sum: '$completionTokens' },
            totalCost: { $sum: '$costUsd' },
            count: { $sum: 1 },
          },
        },
      ]),
      AIUsage.aggregate<{ _id: string; calls: number; cost: number }>([
        { $match: { createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: '$modelName',
            calls: { $sum: 1 },
            cost: { $sum: '$costUsd' },
          },
        },
        { $sort: { cost: -1 } },
      ]),
    ]);

    const totals = monthly[0] ?? { totalPrompt: 0, totalCompletion: 0, totalCost: 0, count: 0 };
    return NextResponse.json({ ...totals, byModel, monthStart });
  } catch (error) {
    return serverError('Failed to fetch AI usage', error);
  }
}
