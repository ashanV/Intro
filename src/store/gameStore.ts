import { create } from 'zustand';
import { ITunesTrack } from '@/lib/itunes';

export type GameStatus = 'playing' | 'won' | 'lost';
export type Category = 'hiphop' | 'klasyki';

export interface Guess {
  isCorrect: boolean;
  isSkipped: boolean;
  track?: ITunesTrack;
  text?: string;
}

export const SEGMENTS = [0.1, 0.5, 2, 4, 8, 16];
export const MAX_GUESSES = 6;

// Reference date for calculating day number (#1 = this date)
const EPOCH = Date.UTC(2026, 2, 25); // Mar 25, 2026 = Day #1

export function getDayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateStrUTC = Date.UTC(y, m - 1, d);
  const diff = dateStrUTC - EPOCH;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function getDateString(date?: Date): string {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface GameState {
  dailySong: ITunesTrack | null;
  guesses: Guess[];
  status: GameStatus;
  currentSegmentIndex: number;
  isModalOpen: boolean;
  selectedDate: string; // "YYYY-MM-DD"
  category: Category;
  
  // Actions
  setDailySong: (song: ITunesTrack) => void;
  addGuess: (guess: Guess) => void;
  skipTurn: () => void;
  resetGame: () => void;
  setModalOpen: (open: boolean) => void;
  setSelectedDate: (date: string) => void;
  setCategory: (cat: Category) => void;
  loadGameState: (date: string, category: Category) => void;
}

export const useGameStore = create<GameState>((set) => ({
  dailySong: null,
  guesses: [],
  status: 'playing',
  currentSegmentIndex: 0,
  isModalOpen: false,
  selectedDate: getDateString(),
  category: 'hiphop',

  setDailySong: (song) => set({ dailySong: song }),

  addGuess: (guess) => set((state) => {
    if (state.status !== 'playing') return state;

    const newGuesses = [...state.guesses, guess];
    const isWin = guess.isCorrect;
    const isLoss = !isWin && newGuesses.length >= MAX_GUESSES;
    
    let newStatus: GameStatus = state.status;
    let newSegmentIndex = state.currentSegmentIndex;

    if (isWin) {
      newStatus = 'won';
    } else if (isLoss) {
      newStatus = 'lost';
      newSegmentIndex = SEGMENTS.length - 1;
    } else {
      newSegmentIndex = Math.min(state.currentSegmentIndex + 1, SEGMENTS.length - 1);
    }

    const newState = {
      guesses: newGuesses,
      status: newStatus,
      currentSegmentIndex: newSegmentIndex
    };

    if (typeof window !== 'undefined') {
      const key = state.category === 'hiphop' ? `cotozahit-state-${state.selectedDate}` : `cotozahit-state-klasyki-${state.selectedDate}`;
      localStorage.setItem(key, JSON.stringify(newState));
    }

    // If the game has just ended, let's say the modal needs to open
    return { ...newState, isModalOpen: newStatus !== 'playing' };
  }),

  skipTurn: () => set((state) => {
    if (state.status !== 'playing') return state;
    
    const newGuesses = [...state.guesses, { isCorrect: false, isSkipped: true, text: 'Skipped' }];
    const isLoss = newGuesses.length >= MAX_GUESSES;
    
    const newState = {
      guesses: newGuesses,
      status: (isLoss ? 'lost' : 'playing') as GameStatus,
      currentSegmentIndex: isLoss ? SEGMENTS.length - 1 : Math.min(state.currentSegmentIndex + 1, SEGMENTS.length - 1)
    };

    if (typeof window !== 'undefined') {
      const key = state.category === 'hiphop' ? `cotozahit-state-${state.selectedDate}` : `cotozahit-state-klasyki-${state.selectedDate}`;
      localStorage.setItem(key, JSON.stringify(newState));
    }

    return { ...newState, isModalOpen: isLoss };
  }),

  resetGame: () => set((state) => ({
    guesses: [],
    status: 'playing',
    currentSegmentIndex: 0,
    isModalOpen: false,
    selectedDate: state.selectedDate
  })),

  setSelectedDate: (date) => set({
    selectedDate: date,
    guesses: [],
    status: 'playing',
    currentSegmentIndex: 0,
    isModalOpen: false,
    dailySong: null
  }),

  setCategory: (cat) => set({
    category: cat,
    guesses: [],
    status: 'playing',
    currentSegmentIndex: 0,
    isModalOpen: false,
    dailySong: null
  }),

  loadGameState: (date, category) => set((state) => {
    if (typeof window === 'undefined') return state;
    
    try {
      const key = category === 'hiphop' ? `cotozahit-state-${date}` : `cotozahit-state-klasyki-${date}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          guesses: parsed.guesses || [],
          status: parsed.status || 'playing',
          currentSegmentIndex: parsed.currentSegmentIndex || 0,
          isModalOpen: parsed.status && parsed.status !== 'playing',
          selectedDate: date,
          category: category
        };
      }
    } catch (err) {}
    
    return {
      guesses: [],
      status: 'playing',
      currentSegmentIndex: 0,
      isModalOpen: false,
      selectedDate: date,
      category: category
    };
  }),

  setModalOpen: (open) => set({ isModalOpen: open })
}));
