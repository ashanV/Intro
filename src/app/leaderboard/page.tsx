'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, AlertCircle, Flame } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface LeaderboardEntry {
  _id: string;
  username: string;
  stats: {
    gamesWon: number;
    gamesPlayed: number;
    currentStreak: number;
    maxStreak: number;
  };
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } else {
        setError('No access to the leaderboard');
      }
    } catch (err) {
      setError('No connection to the cloud');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <main className="min-h-screen flex flex-col items-center bg-[#121212] p-4 text-white">
      <Link href="/" className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-medium z-10">
        <ChevronLeft className="w-5 h-5" /> Wróć do gry
      </Link>
      
      <div className="w-full max-w-2xl mt-16 flex flex-col flex-1">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(29,185,84,0.15)]">
            <Trophy className="w-8 h-8 text-[#1DB954]" />
          </div>
          <h1 className="text-4xl font-black tracking-tight uppercase">Top 50 Graczy</h1>
          <p className="text-gray-400 font-medium mt-1 uppercase tracking-widest text-sm">Globalny Ranking Zwycięstw</p>
        </div>

        {/* List Content */}
        <div className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col mb-8">
          <div className="overflow-y-auto p-4 custom-scrollbar flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-t-[#1DB954] border-[#333] rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Ładowanie rankingu...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-red-400">
                <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                <p>{error}</p>
                <button onClick={fetchLeaderboard} className="mt-4 bg-[#222] px-6 py-2 rounded-lg hover:bg-[#333] text-white transition-colors font-bold uppercase text-sm tracking-wider">Spróbuj ponownie</button>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                Tablica wyników jest jeszcze pusta.<br/>Rozegrajcie kilka gier, by rywalizacja się rozpoczęła!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {leaderboard.map((entry, index) => {
                  const isMe = user?.username === entry.username;
                  const rank = index + 1;
                  
                  let rankColor = "text-gray-500";
                  if (rank === 1) rankColor = "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]";
                  if (rank === 2) rankColor = "text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]";
                  if (rank === 3) rankColor = "text-amber-600";

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={entry._id} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${
                        isMe 
                          ? 'bg-[#1DB954]/10 border-[#1DB954]/50 shadow-[0_0_15px_rgba(29,185,84,0.1)]' 
                          : 'bg-[#111] border-[#222] hover:bg-[#1a1a1a]'
                      } transition-colors gap-4`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`font-black w-8 text-center text-xl ${rankColor}`}>{rank}</span>
                        <div className="flex flex-col">
                          <span className={`font-bold text-lg leading-none mb-1 ${isMe ? 'text-[#1DB954]' : 'text-white'}`}>
                            {entry.username} {isMe && <span className="text-[10px] ml-2 align-middle bg-[#1DB954] text-black px-2 py-0.5 rounded-sm uppercase font-black">Ty</span>}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 self-start sm:self-auto ml-12 sm:ml-0">
                        {/* Wins */}
                        <div className="flex flex-col items-center min-w-[60px]">
                          <span className="text-white font-black text-xl">{entry.stats?.gamesWon || 0}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mt-1">Wygrane</span>
                        </div>
                        
                        {/* Games played */}
                        <div className="flex flex-col items-center min-w-[60px]">
                          <span className="text-gray-300 font-bold text-xl">{entry.stats?.gamesPlayed || 0}</span>
                          <span className="text-[10px] text-[#555] uppercase tracking-widest leading-none mt-1">Gry</span>
                        </div>

                        {/* Longest streak */}
                        <div className="flex flex-col items-center min-w-[60px]">
                          <span className="text-orange-400 font-black text-xl flex items-center gap-1">
                            {entry.stats?.maxStreak || 0} <Flame className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] text-orange-900 uppercase tracking-widest leading-none mt-1">Top Seria</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {!user && !isLoading && (
            <div className="p-4 bg-[#111] border-t border-[#333] text-center">
              <p className="text-sm text-gray-400">
                Nie jesteś widoczny w rankingu ponieważ grasz jako Gość. <br className="sm:hidden" />
                <Link href="/login" className="text-white font-bold hover:underline ml-1">Zaloguj się</Link>, aby dołączyć do rywalizacji!
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
