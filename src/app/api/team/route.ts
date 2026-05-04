import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { teamMemberSchema } from '@/lib/validation';

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const members = await User.find({ _id: { $ne: session.user.id } })
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as unknown;
    const result = teamMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({ email: result.data.email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 12);
    const newMember = await User.create({
      ...result.data,
      password: hashedPassword,
      createdBy: session.user.id,
      isActive: true,
    });

    const memberObj = newMember.toObject() as unknown as Record<string, unknown>;
    delete memberObj['password'];
    return NextResponse.json(memberObj, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
