import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const revalidate = 60; // Cache for 1 minute

export async function GET() {
  try {
    await dbConnect();
    
    // Get players sorted by wins (from highest) 
    // and in case of a tie, by the number of games played (fewer is better).
    const topUsers = await User.find()
      .sort({ 'stats.gamesWon': -1, 'stats.gamesPlayed': 1 })
      .limit(50)
      .select('username stats.gamesWon stats.gamesPlayed stats.currentStreak stats.maxStreak')
      .lean();

    return NextResponse.json({ leaderboard: topUsers }, { status: 200 });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ message: 'Error fetching leaderboard' }, { status: 500 });
  }
}
