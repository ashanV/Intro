'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { ITunesTrack, searchTracks } from '@/lib/itunes';
import { useGameStore, Guess } from '@/store/gameStore';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  onGuess: (track: ITunesTrack) => void;
  onSkip: () => void;
  isShaking: boolean;
}

export default function SearchInput({ onGuess, onSkip, isShaking }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ITunesTrack[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      const tracks = await searchTracks(query);
      setResults(tracks);
      setIsOpen(true);
      setIsLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (track: ITunesTrack) => {
    onGuess(track);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", isShaking && "shake")}>
      <div className={cn(
        "flex bg-[#2A2A2A] rounded-sm overflow-hidden border border-transparent focus-within:border-white transition-colors",
        isShaking && "border-red-500 focus-within:border-red-500"
      )}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Znasz ten utwór?"
            className="w-full h-full bg-transparent py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none border-none ring-0"
          />
        </div>
        <button 
          onClick={onSkip}
          className="bg-white text-black font-bold uppercase text-sm tracking-wider px-6 py-3 hover:bg-gray-200 transition-colors flex-shrink-0"
        >
          Pomiń
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface rounded-lg shadow-xl overflow-hidden z-50 border border-gray-700 max-h-60 overflow-y-auto">
          {results.map((track) => (
            <button
              key={track.trackId}
              onClick={() => handleSelect(track)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors text-left"
            >
              <img 
                src={track.artworkUrl100} 
                alt={track.trackName} 
                className="w-10 h-10 rounded object-cover"
                loading="lazy"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-medium truncate">{track.trackName}</span>
                <span className="text-gray-400 text-sm truncate">{track.artistName}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
