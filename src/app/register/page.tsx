'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { getStats } from '@/lib/stats';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const localStats = getStats();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, confirmPassword, localStats })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'An error occurred during registration');
      }
    } catch (err) {
      setError('No connection to the server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#121212] p-4 text-white">
      <Link href="/" className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-medium">
        <ChevronLeft className="w-5 h-5" /> Wróć
      </Link>
      
      <div className="w-full max-w-sm bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Stwórz konto</h1>
          <p className="text-gray-400 text-sm mt-2 text-center">Dołącz by zapisywać wyniki!</p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4 text-center border border-red-500/30">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 text-green-400 text-sm p-3 rounded-lg mb-4 text-center border border-green-500/30">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" htmlFor="username">
              Nazwa użytkownika
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors"
              placeholder="Twój nick"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" htmlFor="password">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" htmlFor="confirmPassword">
              Powtórz hasło
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || password !== confirmPassword || password.length < 6}
            className="w-full bg-[#1DB954] text-black font-bold py-3 rounded-full mt-4 hover:bg-[#1ed760] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ładowanie...' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Zarejestrowany? <Link href="/login" className="text-white font-bold hover:underline">Zaloguj się</Link>
        </p>
      </div>
    </main>
  );
}
