'use client';

import { Play, Square, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

interface GameControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  disabled?: boolean;
}

export default function GameControls({ isPlaying, onTogglePlay, disabled }: GameControlsProps) {
  const status = useGameStore(state => state.status);
  const setModalOpen = useGameStore(state => state.setModalOpen);
  const isGameOver = status !== 'playing';

  const handleClick = () => {
    if (isGameOver) {
      setModalOpen(true);
    } else {
      onTogglePlay();
    }
  };

  return (
    <div className="flex justify-center mt-3 mb-0">
      <motion.button
        className="w-20 h-20 rounded-full bg-[#1DB954] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        onClick={handleClick}
        disabled={!isGameOver && disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isGameOver ? (
          <BarChart3 className="w-9 h-9 text-white" />
        ) : isPlaying ? (
          <Square className="w-8 h-8 fill-white text-white" />
        ) : (
          <Play className="w-10 h-10 ml-1 fill-white text-white" />
        )}
      </motion.button>
    </div>
  );
}
