import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'No authorization' }, { status: 401 });
  }

  try {
    const payload = await verifyAuth(token);
    await dbConnect();
    const user = await User.findById(payload.userId);
    
    return NextResponse.json({
      user: {
        userId: payload.userId,
        username: payload.username,
        stats: user?.stats
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
}
