import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { teamMemberSchema } from '@/lib/validation';
import { requireAdmin, zodFail, serverError, readJson } from '@/lib/api-helpers';

export async function GET() {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    // Include the signed-in user — hiding yourself from the team list made
    // accounts unmanageable and looked like a bug from the admin's seat.
    const members = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    // isSelf lets the UI hide the remove button on the signed-in account
    const selfId = check.session.user.id;
    return NextResponse.json(members.map((m) => ({ ...m.toObject(), isSelf: String(m._id) === selfId })));
  } catch (error) {
    return serverError('Failed to fetch team', error);
  }
}

export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const body = await readJson(req) as unknown;
    const result = teamMemberSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    await dbConnect();

    const email = result.data.email.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 12);
    const newMember = await User.create({
      ...result.data,
      email,
      role: 'admin',
      password: hashedPassword,
      createdBy: check.session.user.id,
      isActive: true,
    });

    return NextResponse.json(newMember.toObject(), { status: 201 });
  } catch (error) {
    return serverError('Failed to create team member', error);
  }
}

export async function DELETE(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const id = new URL(req.url).searchParams.get('id') ?? '';
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid member id' }, { status: 400 });
    }
    if (id === check.session.user.id) {
      return NextResponse.json({ error: "You can't remove your own account" }, { status: 400 });
    }

    await dbConnect();
    const member = await User.findById(id);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // Never lock everyone out: keep at least one active admin
    if (member.role === 'admin') {
      const admins = await User.countDocuments({ role: 'admin', isActive: true });
      if (admins <= 1) {
        return NextResponse.json({ error: "Can't remove the last admin" }, { status: 400 });
      }
    }

    await member.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Failed to remove team member', error);
  }
}
