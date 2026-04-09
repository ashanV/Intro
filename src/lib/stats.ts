export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[]; // index 0-5 = attempts 1-6, index 6 = failed (X)
  // Daily history: key = "YYYY-MM-DD", value = "won" | "lost"
  dailyHistory: Record<string, 'won' | 'lost'>;
}

const STATS_KEY = 'Intro-stats';

const defaultStats: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: [0, 0, 0, 0, 0, 0, 0],
  dailyHistory: {}
};

export function getStats(): GameStats {
  if (typeof window === 'undefined') {
    return { ...defaultStats, distribution: [...defaultStats.distribution], dailyHistory: {} };
  }
  
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate old stats
      if (!parsed.distribution) {
        parsed.distribution = [0, 0, 0, 0, 0, 0, 0];
      }
      if (!parsed.dailyHistory) {
        parsed.dailyHistory = {};
      }
      return parsed;
    }
  } catch {}
  
  return { ...defaultStats, distribution: [...defaultStats.distribution], dailyHistory: {} };
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function recordGame(won: boolean, attemptNumber?: number, dateStr?: string, category: 'hiphop' | 'klasyki' = 'hiphop'): GameStats {
  const stats = getStats();
  const day = dateStr || getTodayString();
  const historyKey = category === 'hiphop' ? day : `${day}-klasyki`;
  
  stats.gamesPlayed += 1;
  
  if (won && attemptNumber !== undefined) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.distribution[attemptNumber - 1] += 1;
    stats.dailyHistory[historyKey] = 'won';
  } else {
    stats.currentStreak = 0;
    stats.distribution[6] += 1;
    stats.dailyHistory[historyKey] = 'lost';
  }

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));

  // Optional asynchronous background synchronization (only for logged in users)
  if (typeof window !== 'undefined') {
    fetch('/api/stats/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    }).catch(() => {}); // Ignoring errors for not logged in users
  }

  return stats;
}

export function exportStats(): string {
  const stats = getStats();
  return JSON.stringify(stats, null, 2);
}

export function importStats(jsonString: string): GameStats | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed.gamesPlayed !== 'number') return null;
    if (!parsed.distribution) parsed.distribution = [0, 0, 0, 0, 0, 0, 0];
    if (!parsed.dailyHistory) parsed.dailyHistory = {};
    localStorage.setItem(STATS_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return null;
  }
}
