'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore, getDayNumber } from '@/store/gameStore';
import { X, Share2, Flame } from 'lucide-react';
import { getStats, recordGame, GameStats } from '@/lib/stats';

// YouTube icon as inline SVG
function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

// Spotify icon as inline SVG (lucide doesn't have one)
function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

// Format large numbers: 36500000 -> "36.5M", 1200000 -> "1.2M"
function formatStreamCount(count: number): string {
  if (count >= 1_000_000_000) {
    return (count / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
}

// Generate deterministic mock stream counts based on trackId
function getMockStreamCounts(trackId: number) {
  // Create pseudo-random but deterministic values based on trackId
  const seed1 = Math.abs(Math.sin(trackId * 127.1) * 43758.5453);
  const seed2 = Math.abs(Math.sin(trackId * 269.5) * 43758.5453);
  
  const ytViews = Math.floor((seed1 % 1) * 180_000_000) + 5_000_000;
  const spotifyStreams = Math.floor((seed2 % 1) * 150_000_000) + 3_000_000;
  
  return { ytViews, spotifyStreams };
}

// Distribution bar chart labels
const DISTRIBUTION_LABELS = ['1', '2', '3', '4', '5', '6', 'X'];

export default function ResultModal() {
  const { status, dailySong, guesses, isModalOpen, setModalOpen, selectedDate, category } = useGameStore();
  const isGameOver = status !== 'playing';
  const [countdown, setCountdown] = useState('');
  const [stats, setStats] = useState<GameStats>({ gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0, distribution: [0,0,0,0,0,0,0], dailyHistory: {} });
  const hasRecorded = useRef(false);

  // Reset hasRecorded when date changes
  useEffect(() => {
    hasRecorded.current = false;
  }, [selectedDate]);

  // Record game result and load stats when game ends
  useEffect(() => {
    if (isGameOver && !hasRecorded.current) {
      hasRecorded.current = true;
      const guessCount = guesses.findIndex(g => g.isCorrect) + 1;
      const won = status === 'won';
      const newStats = recordGame(won, won ? guessCount : undefined, selectedDate, category);
      setStats(newStats);
      setModalOpen(true);
    } else if (!isGameOver) {
      setStats(getStats());
    }
  }, [isGameOver, status, setModalOpen, guesses, selectedDate, category]);

  // Confetti on win
  useEffect(() => {
    if (status === 'won') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#FFFFFF', '#27272A']
      });
    }
  }, [status]);

  // Countdown timer to midnight
  useEffect(() => {
    if (!isGameOver) return;

    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isGameOver]);

  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  // Share handler
  const handleShare = () => {
    const guessCount = guesses.length;
    const didWin = status === 'won';
    const squares = guesses.map(g => {
      if (g.isSkipped) return '⬛';
      if (g.isCorrect) return '🟩';
      return '🟥';
    }).join('');

    const dayNumber = getDayNumber(selectedDate);
    const text = `🎵 CoToZaHit #${dayNumber}\n${didWin ? `Zgadłem w ${guessCount}/6` : 'Nie zgadłem 😢'}\n${squares}\nhttps://cotozahit.pl`;

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Skopiowano do schowka!');
    }
  };

  if (!isGameOver || !dailySong || !isModalOpen) return null;

  const guessCount = guesses.findIndex(g => g.isCorrect) + 1;
  const didWin = status === 'won';
  const streamCounts = getMockStreamCounts(dailySong.trackId);
  const maxDistribution = Math.max(...stats.distribution, 1);

  // Determine which bar is the "current player's" result
  const currentAttemptIndex = didWin ? (guessCount - 1) : 6;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={closeModal}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-[#1a1a1a] p-6 text-center rounded-2xl max-w-sm w-full shadow-2xl border border-[#333] relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* X close button */}
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold mb-1" style={{ color: didWin ? '#1DB954' : '#ef4444' }}>
            {didWin ? 'UDAŁO SIĘ! 🎉' : 'NIESTETY...'}
          </h2>
          <p className="text-gray-400 mb-4 text-sm">
            {didWin ? `Zgadłeś w ${guessCount} próbie` : 'Piosenka na dzisiaj to:'}
          </p>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-6 bg-[#111] rounded-full py-3 px-6 mb-5 border border-[#333]">
            <div className="text-center">
              <p className="text-xl font-black text-white">{stats.gamesPlayed}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Zagrane</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-white">{stats.gamesWon}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Wygrane</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <p className="text-xl font-black text-white flex items-center gap-1">
                {stats.currentStreak} <Flame className="w-4 h-4 text-orange-400" />
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Seria</p>
            </div>
          </div>

          {/* Song cover */}
          <div className="relative aspect-square w-40 h-40 mx-auto rounded-lg overflow-hidden mb-4 shadow-xl">
            <img 
              src={dailySong.artworkUrl100} 
              alt={dailySong.trackName} 
              className="object-cover w-full h-full"
            />
          </div>

          {/* Song info */}
          <h3 className="text-lg font-bold text-white mb-0.5">{dailySong.trackName}</h3>
          <p className="text-gray-400 font-medium text-sm mb-3">{dailySong.artistName}</p>

          {/* Stream counts */}
          <div className="flex items-center justify-center gap-6 mb-5">
            <div className="flex items-center gap-1.5">
              <YouTubeIcon className="w-5 h-5 text-red-500" />
              <span className="text-white font-bold text-sm">{formatStreamCount(streamCounts.ytViews)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <SpotifyIcon className="w-5 h-5 text-[#1DB954]" />
              <span className="text-white font-bold text-sm">{formatStreamCount(streamCounts.spotifyStreams)}</span>
            </div>
          </div>

          {/* Guess distribution chart */}
          <div className="bg-[#111] rounded-xl py-4 px-4 mb-5 border border-[#333]">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-medium">
              Tego dnia wyniki wyglądały tak:
            </p>
            <div className="space-y-1.5">
              {DISTRIBUTION_LABELS.map((label, index) => {
                const value = stats.distribution[index];
                const barWidth = Math.max((value / maxDistribution) * 100, 4);
                const isCurrentAttempt = index === currentAttemptIndex;
                
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`text-sm font-bold w-4 text-right shrink-0 ${label === 'X' ? 'text-red-400' : 'text-gray-300'}`}>
                      {label}
                    </span>
                    <div className="flex-1 flex items-center">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
                        className={`h-6 rounded-sm flex items-center justify-end pr-2 ${
                          isCurrentAttempt 
                            ? (didWin ? 'bg-[#1DB954]' : 'bg-red-500')
                            : 'bg-[#333]'
                        }`}
                      >
                        <span className="text-xs font-bold text-white leading-none">
                          {value}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Countdown timer */}
          <div className="bg-[#111] rounded-lg py-3 px-4 mb-5 border border-[#333]">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Następna piosenka za</p>
            <p className="text-white text-2xl font-mono font-bold tracking-widest">{countdown}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={closeModal}
              className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm uppercase tracking-wider"
            >
              Dalej
            </button>
            <button 
              onClick={handleShare}
              className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Udostępnij
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
