import { useEffect, useRef, useState, useCallback } from 'react';

export function useAudio(url: string | undefined, maxDurationMs: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const maxDurationRef = useRef(maxDurationMs);
  const isPlayingRef = useRef(false);
  // Track where the audio stopped last time (the blockade it reached)
  const lastStopPositionMs = useRef(0);
  // Track the maxDuration at the time of last stop to detect segment changes
  const lastMaxDurationMs = useRef(maxDurationMs);

  useEffect(() => {
    maxDurationRef.current = maxDurationMs;
  }, [maxDurationMs]);

  // Setup audio element
  useEffect(() => {
    if (!url) return;

    const audio = new Audio(url);
    audio.preload = 'auto';

    const onCanPlay = () => setIsLoaded(true);

    audio.addEventListener('loadeddata', onCanPlay);
    audio.addEventListener('canplay', onCanPlay);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.removeEventListener('loadeddata', onCanPlay);
      audio.removeEventListener('canplay', onCanPlay);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [url]);
  
  // Mute synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);


  // Stable animation tick
  const tick = useCallback(() => {
    if (!audioRef.current || audioRef.current.paused) return;

    const currentMs = audioRef.current.currentTime * 1000;

    if (currentMs >= maxDurationRef.current) {
      // Reached segment limit — freeze progress and stop
      audioRef.current.pause();
      setProgress(maxDurationRef.current);
      lastStopPositionMs.current = maxDurationRef.current;
      lastMaxDurationMs.current = maxDurationRef.current;
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    setProgress(currentMs);
    requestRef.current = requestAnimationFrame(tick);
  }, []);

  // Start/stop animation loop
  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isPlaying, tick]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !isLoaded) return;

    if (isPlayingRef.current) {
      // User manually stops
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      audioRef.current.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      // Determine start position
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }

      const segmentChanged = maxDurationRef.current !== lastMaxDurationMs.current;

      if (segmentChanged && lastStopPositionMs.current > 0) {
        // After a skip: continue from where we stopped last time
        const startFromSec = lastStopPositionMs.current / 1000;
        audioRef.current.currentTime = startFromSec;
        setProgress(lastStopPositionMs.current);
      } else {
        // Same segment (replay) or first play: start from beginning
        audioRef.current.currentTime = 0;
        setProgress(0);
      }

      isPlayingRef.current = true;
      setIsPlaying(true);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError') {
            console.error("Audio play failed:", e);
          }
        });
      }
    }
  }, [isLoaded]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { isPlaying, progress, isLoaded, togglePlay, isMuted, toggleMute };
}
