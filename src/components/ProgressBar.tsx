'use client';

import { SEGMENTS } from '@/store/gameStore';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentSegmentIndex: number;
  playingDurationMs: number;
  maxPlayedDurationMs: number;
}

export default function ProgressBar({ currentSegmentIndex, playingDurationMs, maxPlayedDurationMs }: ProgressBarProps) {
  const TOTAL_DURATION_S = SEGMENTS[SEGMENTS.length - 1];

  const effectiveDurationMs = Math.max(playingDurationMs, 0);
  
  const segmentWidths = SEGMENTS.map((s, i) => {
    const prev = i === 0 ? 0 : SEGMENTS[i - 1];
    return ((s - prev) / TOTAL_DURATION_S) * 100;
  });

  const secondsPlaying = (effectiveDurationMs / 1000).toFixed(1);

  return (
    <div className="w-full mt-0 mb-2">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-bold text-white">{secondsPlaying} sekundy</span>
      </div>
      
      <div className="flex w-full h-3 gap-1">
        {segmentWidths.map((width, i) => {
          const startS = i === 0 ? 0 : SEGMENTS[i - 1];
          const endS = SEGMENTS[i];
          const segmentDurationS = endS - startS;
          
          const currentS = effectiveDurationMs / 1000;
          let fillPercentage = 0;
          
          if (currentS >= endS) {
            fillPercentage = 100;
          } else if (currentS > startS) {
            fillPercentage = ((currentS - startS) / segmentDurationS) * 100;
          }

          const isUnlocked = i <= currentSegmentIndex;
          
          return (
            <div 
              key={i} 
              className={cn(
                "h-full rounded-full overflow-hidden relative",
                isUnlocked ? "bg-[#555]" : "bg-[#1a1a1a]"
              )}
              style={{ width: `${width}%` }}
            >
              {fillPercentage > 0 && (
                <div 
                  className="h-full bg-[#1DB954] rounded-full"
                  style={{ width: `${fillPercentage}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
