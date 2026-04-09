'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStats, exportStats, importStats } from '@/lib/stats';

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];
const DAY_HEADERS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate?: (dateStr: string) => void;
}

export default function CalendarModal({ isOpen, onClose, onSelectDate }: CalendarModalProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [dailyHistory, setDailyHistory] = useState<Record<string, 'won' | 'lost'>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history when opening
  useEffect(() => {
    if (isOpen) {
      const stats = getStats();
      setDailyHistory(stats.dailyHistory);
    }
  }, [isOpen]);

  // ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const prevMonth = useCallback(() => {
    setViewMonth(prev => {
      if (prev === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(prev => {
      if (prev === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  // Build calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // getDay() returns 0=Sun, we want 0=Mon
  let startDow = firstDayOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Pad to complete rows
  while (cells.length % 7 !== 0) cells.push(null);

  const getDayString = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isToday = (day: number) => getDayString(day) === todayStr;

  const isBeforeEpoch = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    // EPOCH is Mar 25, 2026 (Day #1)
    const epoch = new Date(2026, 2, 25);
    return d < epoch;
  };

  const isFutureDay = (day: number) => {
    // Compare date-only (ignore time) so today is NOT treated as future
    if (viewYear > today.getFullYear()) return true;
    if (viewYear < today.getFullYear()) return false;
    if (viewMonth > today.getMonth()) return true;
    if (viewMonth < today.getMonth()) return false;
    return day > today.getDate();
  };

  const handleExport = () => {
    const data = exportStats();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotozahit-zapis-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import handler
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importStats(text);
      if (result) {
        setDailyHistory(result.dailyHistory);
        alert('Zapis wczytany pomyślnie!');
      } else {
        alert('Błąd wczytywania zapisu. Sprawdź plik.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: -20, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="bg-[#1a1a1a] rounded-2xl w-full max-w-md shadow-2xl border border-[#333] relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="text-[#1DB954] hover:text-[#1ed760] transition-colors font-bold text-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-white font-bold text-lg select-none">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h2>
              <button
                onClick={nextMonth}
                className="text-[#1DB954] hover:text-[#1ed760] transition-colors font-bold text-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-5 mb-1">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-gray-500 text-xs font-semibold py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 px-5 pb-4">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="h-14" />;
              }

              const dayStr = getDayString(day);
              const resultHiphop = dailyHistory[dayStr];
              const resultKlasyki = dailyHistory[`${dayStr}-klasyki`];
              const result = resultHiphop || resultKlasyki;
              const future = isFutureDay(day);
              const past = isBeforeEpoch(day);
              const todayHighlight = isToday(day);
              const disabled = future || past;

              return (
                <div
                  key={dayStr}
                  className={`flex flex-col items-center justify-center h-14 relative ${
                    !disabled ? 'cursor-pointer hover:bg-[#252525] rounded-lg transition-colors' : 'opacity-30'
                  }`}
                  onClick={() => {
                    if (!disabled && onSelectDate) {
                      onSelectDate(dayStr);
                    }
                  }}
                >
                  {/* Today circle */}
                  {todayHighlight && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full border-2 border-[#1DB954]" />
                    </div>
                  )}

                  <span
                    className={`text-sm font-bold z-10 ${
                      disabled
                        ? 'text-gray-600'
                        : result
                        ? 'text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    {day}
                  </span>

                  {/* Result dot */}
                  {!disabled && (
                    <div className="flex gap-1 mt-0.5 z-10">
                      {resultHiphop === 'won' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" title="Hip-Hop: Wygrana" />
                      ) : resultHiphop === 'lost' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Hip-Hop: Przegrana" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" title="Hip-Hop: Zagraj" />
                      )}

                      {resultKlasyki === 'won' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" title="Klasyki: Wygrana" />
                      ) : resultKlasyki === 'lost' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600" title="Klasyki: Przegrana" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" title="Klasyki: Zagraj" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-[#333] mx-5" />

          {/* Export / Import buttons */}
          <div className="flex gap-3 px-5 py-4">
            <button
              onClick={handleExport}
              className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-3 px-4 rounded-xl transition-colors text-xs uppercase tracking-wider"
            >
              Eksportuj zapis
            </button>
            <button
              onClick={handleImport}
              className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold py-3 px-4 rounded-xl transition-colors text-xs uppercase tracking-wider"
            >
              Wczytaj zapis
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
