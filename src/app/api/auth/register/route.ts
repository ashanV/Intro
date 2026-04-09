import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, password, confirmPassword, localStats } = await req.json();

    if (!username || !password || !confirmPassword) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
    
    if (existingUser) {
      return NextResponse.json({ message: 'Such username is already taken' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword,
      stats: localStats || undefined
    });

    await newUser.save();

    return NextResponse.json({ message: 'Account created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
