import { create } from 'zustand';
import { GameStats, importStats } from '@/lib/stats';

interface User {
  username: string;
  stats?: GameStats;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => {
    // When logging in, we load the user's statistics from the server to the browser
    if (user?.stats) {
      importStats(JSON.stringify(user.stats));
    }
    set({ user });
  },
  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        // On refresh, we also verify the stats state (e.g. another browser played)
        if (data.user?.stats) {
          importStats(JSON.stringify(data.user.stats));
        }
        set({ user: data.user, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ user: null });
    } catch (e) {
      console.error('Logout error', e);
    }
  }
}));
