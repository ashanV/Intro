'use client';

import { useGameStore, MAX_GUESSES } from '@/store/gameStore';

export default function GameBoard() {
  const guesses = useGameStore(state => state.guesses);

  const slots = Array.from({ length: MAX_GUESSES });

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-2xl mx-auto mb-2">
      {slots.map((_, i) => {
        const guess = guesses[i];
        
        // Default, empty block style
        let bgColor = "bg-transparent border border-[#333]";
        let text = "";
        
        if (guess) {
          if (guess.isSkipped) {
            text = "POMINIĘTO";
            bgColor = "bg-[#333] border border-[#444] text-gray-400";
          } else if (guess.isCorrect) {
            text = `${guess.track?.artistName} - ${guess.track?.trackName}`;
            bgColor = "bg-[#1DB954] border border-[#1DB954] text-white font-medium";
          } else {
            text = `${guess.track?.artistName} - ${guess.track?.trackName}`;
            bgColor = "bg-red-500/20 border border-red-500/50 text-white";
          }
        }

        return (
          <div 
            key={i} 
            className={`w-full h-10 flex items-center justify-center px-4 rounded-sm ${bgColor} transition-colors min-h-[40px] shadow-sm`}
          >
            {guess && <span className="truncate text-sm tracking-wider">{text}</span>}
          </div>
        );
      })}
    </div>
  );
}
