import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Please provide username and password.' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
    if (!user) {
      return NextResponse.json({ message: 'Invalid username or password.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid username or password.' }, { status: 401 });
    }

    const token = await createToken({ userId: user._id.toString(), username: user.username });

    const response = NextResponse.json({ 
      message: 'Logged in successfully!',
      user: { username: user.username, stats: user.stats }
    }, { status: 200 });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login.' },
      { status: 500 }
    );
  }
}
