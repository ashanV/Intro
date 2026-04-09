import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'No authorization' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    const incomingStats = await req.json();

    if (!incomingStats || typeof incomingStats.gamesPlayed !== 'number') {
      return NextResponse.json({ message: 'Invalid statistics format' }, { status: 400 });
    }

    await dbConnect();
    
    await User.findByIdAndUpdate(payload.userId, {
      $set: { stats: incomingStats }
    });

    return NextResponse.json({ message: 'Stats synchronized' }, { status: 200 });
  } catch (error) {
    console.error('Stats sync error:', error);
    return NextResponse.json({ message: 'An error occurred during synchronization' }, { status: 500 });
  }
}
