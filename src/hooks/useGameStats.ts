import { useState, useEffect, useCallback } from "react";

// ── Types ──
export interface GameResult {
  cardSet: string;
  pairCount: number;
  moves: number;
  time: number;
  accuracy: number;      // matched / moves (%)
  streak: number;        // max consecutive matches
  date: string;          // ISO
  mode: "classic" | "challenge" | "training" | "two-player";
}

export interface Achievement {
  id: string;
  icon: string;
  label: string;
  description: string;
  condition: (stats: AggregateStats, results: GameResult[]) => boolean;
}

export interface AggregateStats {
  totalGames: number;
  totalMoves: number;
  totalMatches: number;
  totalTime: number;
  perfectGames: number;      // moves === pairCount
  bestStreak: number;
  uniqueSetsPlayed: number;
  gamesWonUnder30s: number;
  gamesWonUnder60s: number;
  dailyStreak: number;       // consecutive days played
}

// ── All Achievements ──
export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first-win", icon: "🎯", label: "ניצחון ראשון", description: "סיימו משחק ראשון", condition: (s) => s.totalGames >= 1 },
  { id: "five-wins", icon: "🏅", label: "מתחילים להבין", description: "5 משחקים שהושלמו", condition: (s) => s.totalGames >= 5 },
  { id: "ten-wins", icon: "🥇", label: "מקצוען", description: "10 משחקים שהושלמו", condition: (s) => s.totalGames >= 10 },
  { id: "twenty-five-wins", icon: "👑", label: "מלך הזיכרון", description: "25 משחקים שהושלמו", condition: (s) => s.totalGames >= 25 },
  { id: "fifty-wins", icon: "💎", label: "אגדה חיה", description: "50 משחקים שהושלמו", condition: (s) => s.totalGames >= 50 },
  { id: "perfect-game", icon: "⭐", label: "מושלם!", description: "סיימו משחק ללא טעות אחת", condition: (s) => s.perfectGames >= 1 },
  { id: "three-perfect", icon: "🌟", label: "כוכב זהב", description: "3 משחקים מושלמים", condition: (s) => s.perfectGames >= 3 },
  { id: "speed-demon-30", icon: "⚡", label: "בזק!", description: "סיימו משחק תוך 30 שניות", condition: (s) => s.gamesWonUnder30s >= 1 },
  { id: "speed-demon-60", icon: "🏎️", label: "מהיר!", description: "סיימו משחק תוך דקה", condition: (s) => s.gamesWonUnder60s >= 1 },
  { id: "streak-3", icon: "🔥", label: "רצף חם", description: "3 זוגות ברצף ללא טעות", condition: (s) => s.bestStreak >= 3 },
  { id: "streak-5", icon: "💥", label: "על אש!", description: "5 זוגות ברצף ללא טעות", condition: (s) => s.bestStreak >= 5 },
  { id: "streak-8", icon: "🌪️", label: "בלתי ניתן לעצירה", description: "8 זוגות ברצף", condition: (s) => s.bestStreak >= 8 },
  { id: "explorer-3", icon: "🗺️", label: "חוקר", description: "שיחקו ב-3 סטי קלפים שונים", condition: (s) => s.uniqueSetsPlayed >= 3 },
  { id: "explorer-8", icon: "🌍", label: "מגלה עולמות", description: "שיחקו ב-8 סטי קלפים שונים", condition: (s) => s.uniqueSetsPlayed >= 8 },
  { id: "explorer-15", icon: "🚀", label: "אסטרונאוט", description: "שיחקו ב-15 סטי קלפים שונים", condition: (s) => s.uniqueSetsPlayed >= 15 },
  { id: "daily-3", icon: "📅", label: "שגרה יומית", description: "שיחקו 3 ימים ברצף", condition: (s) => s.dailyStreak >= 3 },
  { id: "daily-7", icon: "🗓️", label: "שבוע מלא", description: "שיחקו 7 ימים ברצף", condition: (s) => s.dailyStreak >= 7 },
  { id: "big-board", icon: "🧩", label: "לוח גדול", description: "סיימו משחק עם 8+ זוגות", condition: (_, r) => r.some(g => g.pairCount >= 8) },
  { id: "marathon", icon: "🏃", label: "מרתון", description: "שיחקו סה״כ 100+ זוגות", condition: (s) => s.totalMatches >= 100 },
];

const STORAGE_KEY = "memory-game-results";
const ACHIEVEMENTS_KEY = "memory-game-achievements";

function loadResults(): GameResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveResults(results: GameResult[]) {
  // Keep last 200 results
  const trimmed = results.slice(-200);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function loadUnlocked(): string[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveUnlocked(ids: string[]) {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids));
}

function computeStats(results: GameResult[]): AggregateStats {
  const uniqueSets = new Set(results.map(r => r.cardSet));
  let bestStreak = 0;
  let perfectGames = 0;
  let gamesWonUnder30s = 0;
  let gamesWonUnder60s = 0;
  let totalMoves = 0;
  let totalMatches = 0;
  let totalTime = 0;

  for (const r of results) {
    totalMoves += r.moves;
    totalMatches += r.pairCount;
    totalTime += r.time;
    if (r.streak > bestStreak) bestStreak = r.streak;
    if (r.moves === r.pairCount) perfectGames++;
    if (r.time <= 30) gamesWonUnder30s++;
    if (r.time <= 60) gamesWonUnder60s++;
  }

  // Daily streak
  const today = new Date().toISOString().split("T")[0];
  const playDates = [...new Set(results.map(r => r.date.split("T")[0]))].sort().reverse();
  let dailyStreak = 0;
  let checkDate = new Date(today);
  for (const dateStr of playDates) {
    const expected = checkDate.toISOString().split("T")[0];
    if (dateStr === expected) {
      dailyStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr < expected) {
      break;
    }
  }

  return {
    totalGames: results.length,
    totalMoves,
    totalMatches,
    totalTime,
    perfectGames,
    bestStreak,
    uniqueSetsPlayed: uniqueSets.size,
    gamesWonUnder30s,
    gamesWonUnder60s,
    dailyStreak,
  };
}

export function useGameStats() {
  const [results, setResults] = useState<GameResult[]>(loadResults);
  const [unlockedIds, setUnlockedIds] = useState<string[]>(loadUnlocked);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const stats = computeStats(results);

  const recordGame = useCallback((result: Omit<GameResult, "date" | "accuracy">) => {
    const full: GameResult = {
      ...result,
      accuracy: result.moves > 0 ? Math.round((result.pairCount / result.moves) * 100) : 0,
      date: new Date().toISOString(),
    };
    const updated = [...results, full];
    setResults(updated);
    saveResults(updated);

    // Check for new achievements
    const newStats = computeStats(updated);
    for (const ach of ALL_ACHIEVEMENTS) {
      if (!unlockedIds.includes(ach.id) && ach.condition(newStats, updated)) {
        const newUnlocked = [...unlockedIds, ach.id];
        setUnlockedIds(newUnlocked);
        saveUnlocked(newUnlocked);
        setNewAchievement(ach);
        setTimeout(() => setNewAchievement(null), 4000);
        break; // show one at a time
      }
    }
  }, [results, unlockedIds]);

  const getSetStats = useCallback((cardSet: string, pairCount: number) => {
    const setResults = results.filter(r => r.cardSet === cardSet && r.pairCount === pairCount);
    if (setResults.length === 0) return null;
    const bestTime = Math.min(...setResults.map(r => r.time));
    const bestMoves = Math.min(...setResults.map(r => r.moves));
    const avgAccuracy = Math.round(setResults.reduce((sum, r) => sum + r.accuracy, 0) / setResults.length);
    return { gamesPlayed: setResults.length, bestTime, bestMoves, avgAccuracy };
  }, [results]);

  const dismissAchievement = useCallback(() => setNewAchievement(null), []);

  return {
    stats,
    results,
    unlockedIds,
    newAchievement,
    recordGame,
    getSetStats,
    dismissAchievement,
    allAchievements: ALL_ACHIEVEMENTS,
  };
}
