'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useGameStore, SEGMENTS, getDayNumber, getDateString } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useAudio } from '@/hooks/useAudio';
import { ITunesTrack } from '@/lib/itunes';
import { DAILY_SONG } from '@/lib/mockDailySong';

import ProgressBar from '@/components/ProgressBar';
import GameControls from '@/components/GameControls';
import GameBoard from '@/components/GameBoard';
import SearchInput from '@/components/SearchInput';
import ResultModal from '@/components/ResultModal';
import CalendarModal from '@/components/CalendarModal';
import Skeleton from '@/components/Skeleton';

import { Coffee, Volume2, VolumeX, Calendar, Menu, Disc, ChevronLeft, ChevronRight, Lock, User, Trophy } from 'lucide-react';


export default function Home() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { user, checkAuth, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const {
    dailySong,
    setDailySong,
    currentSegmentIndex,
    addGuess,
    skipTurn,
    status,
    selectedDate,
    setSelectedDate,
    category,
    setCategory,
    loadGameState
  } = useGameStore();

  const maxDurationMs = SEGMENTS[currentSegmentIndex] * 1000;
  
  const { isPlaying, progress, isLoaded, togglePlay, isMuted, toggleMute } = useAudio(
    dailySong?.previewUrl,
    maxDurationMs
  );


  const dayNumber = getDayNumber(selectedDate);
  const todayStr = getDateString();
  const isToday = selectedDate === todayStr;

  // Navigate to previous/next day
  const goToPrevDay = useCallback(() => {
    if (dayNumber <= 1) return;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(getDateString(prev));
  }, [selectedDate, setSelectedDate, dayNumber]);

  const goToNextDay = useCallback(() => {
    if (isToday) return;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    const nextStr = getDateString(next);
    if (nextStr <= todayStr) {
      setSelectedDate(nextStr);
    }
  }, [selectedDate, isToday, todayStr, setSelectedDate]);

  // Handle day selection from calendar
  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    setIsCalendarOpen(false);
  }, [setSelectedDate]);

  // Initialize Game — re-runs when selectedDate or category changes
  useEffect(() => {
    setIsInitializing(true);
    
    // Load current state from localStorage for the specific category and day
    loadGameState(selectedDate, category);

    async function initGame() {
      try {
        const searchTerm = category === 'hiphop' ? 'rap' : '80s+90s+hits';
        const res = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=150`);
        const itunesData = await res.json();
        const validTracks = itunesData.results.filter((t: any) => t.previewUrl);

        if (validTracks.length > 0) {
          // Stabilizing the order of results (iTunes API sometimes returns a different order)
          validTracks.sort((a: any, b: any) => a.trackId - b.trackId);
          
          const dayNum = getDayNumber(selectedDate);
          
          // Shuffling using a large prime number (137) guarantees no repetitions 
          // until the cycle repeats (1 rotation of the list = about 150 days).
          const randomIndex = (dayNum * 137) % validTracks.length;
          
          const track = validTracks[randomIndex];

          if (track && track.previewUrl) {
            setDailySong({
              trackId: track.trackId,
              artistName: track.artistName,
              trackName: track.trackName,
              previewUrl: track.previewUrl,
              artworkUrl100: track.artworkUrl100.replace('100x100bb', '600x600bb')
            });
            setIsInitializing(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching daily song:', err);
      }
      
      setDailySong(DAILY_SONG);
      setIsInitializing(false);
    }
    
    initGame();
  }, [selectedDate, category, setDailySong, loadGameState]);

  const handleGuess = (track: ITunesTrack) => {
    if (!dailySong) return;

    const isIdMatch = String(track.trackId) === String(dailySong.trackId);
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isStringMatch = 
      normalize(track.trackName) === normalize(dailySong.trackName) && 
      normalize(track.artistName) === normalize(dailySong.artistName);

    const isCorrect = isIdMatch || isStringMatch;
    
    if (!isCorrect) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }

    addGuess({
      isCorrect,
      isSkipped: false,
      track
    });
  };

  if (isInitializing) {
    return (
      <main className="min-h-screen p-4 flex flex-col items-center justify-center max-w-2xl mx-auto pt-16">
        <Skeleton className="w-1/2 h-10 mb-8" />
        <Skeleton className="w-full h-8 mb-4 max-w-lg" />
        <Skeleton className="w-full h-12 mb-2 max-w-lg" />
        <Skeleton className="w-full h-12 mb-2 max-w-lg" />
        <Skeleton className="w-full h-12 mb-2 max-w-lg" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#121212] pb-4">
      
      {/* Top Navbar */}
      <nav className="w-full flex justify-between items-center px-2 py-2 sm:px-4 sm:py-2 lg:px-7">
        <div className="flex gap-4">
          <button 
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-white hover:bg-[#222] transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <Link 
            href="/leaderboard"
            title="Pokaż listę najlepszych graczy"
            className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-white hover:bg-[#222] hover:border-yellow-600 transition-colors"
          >
            <Trophy className="w-5 h-5 text-yellow-500" />
          </Link>
        </div>
        <div className="flex gap-4">
          {user ? (
            <button 
              onClick={logout} 
              title={`Wyloguj (${user.username})`}
              className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center text-black hover:scale-105 transition-transform"
            >
              <User className="w-5 h-5 fill-black" />
            </button>
          ) : (
            <Link 
              href="/login"
              title="Zaloguj się"
              className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-white hover:bg-[#222] transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>
          )}
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-white hover:bg-[#222] transition-colors"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Game Container */}
      <div className="flex-1 flex flex-col items-center w-full max-w-4xl mx-auto px-4 mt-0">
        
        {/* Header (Logo & Categories) */}
        <header className="flex flex-col items-center mb-1 text-center w-full">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight flex items-center drop-shadow-[0_0_15px_rgba(111,111,111,0.1)]">
            IN<Disc className="w-12 h-12 sm:w-14 sm:h-14 mx-[-2px] text-gray-300 animate-[spin_4s_linear_infinite]" />TRO
          </h1>
          <div className="flex items-center gap-3 mt-3 font-bold text-lg">
            <button 
              onClick={goToPrevDay} 
              className={`transition-colors ${dayNumber <= 1 ? 'text-gray-600 cursor-not-allowed' : 'hover:text-gray-300'}`}
              disabled={dayNumber <= 1}
            >
              <ChevronLeft className="w-5 h-5" />
            </button> 
            <span>#{dayNumber}</span>
            <button 
              onClick={goToNextDay} 
              className={`transition-colors ${isToday ? 'text-gray-600 cursor-not-allowed' : 'hover:text-gray-300'}`}
              disabled={isToday}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button 
              onClick={() => setCategory('hiphop')}
              className={`px-4 py-1.5 text-[10px] font-bold tracking-widest rounded-full uppercase transition-colors ${category === 'hiphop' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-[#1A1A1A] text-white border border-[#333] hover:bg-[#252525]'}`}
            >
              Hip-Hop
            </button>
            <button 
              onClick={() => setCategory('klasyki')}
              className={`px-4 py-1.5 text-[10px] font-bold tracking-widest rounded-full uppercase transition-colors ${category === 'klasyki' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-[#1A1A1A] text-white border border-[#333] hover:bg-[#252525]'}`}
            >
              Klasyki
            </button>
          </div>
        </header>

        <GameControls 
          isPlaying={isPlaying} 
          onTogglePlay={togglePlay} 
          disabled={!isLoaded || status !== 'playing'}
        />

        <div className="w-full max-w-2xl mx-auto">
          <ProgressBar 
            currentSegmentIndex={currentSegmentIndex} 
            playingDurationMs={progress}
            maxPlayedDurationMs={maxDurationMs}
          />
        </div>

        <GameBoard />

        <div className="w-full max-w-2xl mx-auto mt-2">
          {status === 'playing' ? (
             <SearchInput onGuess={handleGuess} onSkip={skipTurn} isShaking={isShaking} />
          ) : (
            <div className="text-center text-[#1DB954] font-bold text-2xl uppercase mt-4">
              {status === 'won' ? 'Zgadłeś mordo!' : 'Spróbuj ponownie jutro!'}
            </div>
          )}
        </div>
      </div>

      <ResultModal />
      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        onSelectDate={handleSelectDate}
      />
    </main>
  );
}
