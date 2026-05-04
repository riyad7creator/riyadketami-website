import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { teamMemberSchema } from '@/lib/validation';
import { requireAdmin, zodFail, serverError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const members = await User.find({ _id: { $ne: check.session.user.id } })
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json(members);
  } catch (error) {
    return serverError('Failed to fetch team', error);
  }
}

export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const body = await req.json() as unknown;
    const result = teamMemberSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    await dbConnect();

    const existing = await User.findOne({ email: result.data.email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 12);
    const newMember = await User.create({
      ...result.data,
      password: hashedPassword,
      createdBy: check.session.user.id,
      isActive: true,
    });

    return NextResponse.json(newMember.toObject(), { status: 201 });
  } catch (error) {
    return serverError('Failed to create team member', error);
  }
}
