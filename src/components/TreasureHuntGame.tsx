import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Volume2, Eye, Trophy, Clock, Star, RotateCcw, Home } from "lucide-react";
import {
  TREASURE_SCENES, TreasureScene, HiddenItem, Difficulty,
  getItemsForDifficulty, getDecoyCount, getTimeLimit,
} from "@/lib/treasureData";
import Confetti from "@/components/Confetti";

type GamePhase = "menu" | "scene-select" | "playing" | "won" | "lost";

interface PlacedEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  isTarget: boolean;
  found: boolean;
  itemId?: string;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speakHebrew(text: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "he-IL";
  u.rate = 0.85;
  u.pitch = 1.2;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export default function TreasureHuntGame({ onHome }: { onHome: () => void }) {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [scene, setScene] = useState<TreasureScene | null>(null);
  const [placed, setPlaced] = useState<PlacedEmoji[]>([]);
  const [targetItems, setTargetItems] = useState<HiddenItem[]>([]);
  const [currentClueIdx, setCurrentClueIdx] = useState(0);
  const [foundIds, setFoundIds] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wrongTap, setWrongTap] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const currentClue = targetItems[currentClueIdx] || null;

  // Place emojis on the board
  const setupGame = useCallback((sc: TreasureScene, diff: Difficulty) => {
    const itemCount = getItemsForDifficulty(sc, diff);
    const decoyCount = getDecoyCount(diff);
    const selectedItems = shuffleArray(sc.items).slice(0, itemCount);

    const allPlaced: PlacedEmoji[] = [];

    // Place target items
    selectedItems.forEach((item) => {
      allPlaced.push({
        id: `target-${item.id}`,
        emoji: item.emoji,
        x: randomBetween(8, 85),
        y: randomBetween(8, 80),
        size: diff === "easy" ? randomBetween(36, 48) : diff === "medium" ? randomBetween(28, 40) : randomBetween(22, 34),
        rotation: randomBetween(-25, 25),
        isTarget: true,
        found: false,
        itemId: item.id,
      });
    });

    // Place decoys from decorEmojis
    for (let i = 0; i < decoyCount; i++) {
      const emoji = sc.decorEmojis[i % sc.decorEmojis.length];
      allPlaced.push({
        id: `decoy-${i}`,
        emoji,
        x: randomBetween(3, 92),
        y: randomBetween(3, 90),
        size: randomBetween(20, 44),
        rotation: randomBetween(-30, 30),
        isTarget: false,
        found: false,
      });
    }

    setScene(sc);
    setDifficulty(diff);
    setTargetItems(selectedItems);
    setCurrentClueIdx(0);
    setFoundIds(new Set());
    setScore(0);
    setHintUsed(false);
    setTimeLeft(getTimeLimit(diff));
    setPlaced(shuffleArray(allPlaced));
    setPhase("playing");
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase("lost");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Speak clue on new target
  useEffect(() => {
    if (phase === "playing" && currentClue) {
      setTimeout(() => speakHebrew(currentClue.voiceClue), 400);
    }
  }, [phase, currentClueIdx, currentClue]);

  const handleTap = (p: PlacedEmoji) => {
    if (phase !== "playing" || !currentClue) return;

    if (p.isTarget && p.itemId === currentClue.id && !p.found) {
      // Correct!
      const newFound = new Set(foundIds);
      newFound.add(p.itemId!);
      setFoundIds(newFound);
      setScore((s) => s + (hintUsed ? 5 : 10));

      setPlaced((prev) => prev.map((pp) => pp.id === p.id ? { ...pp, found: true } : pp));

      // Play success sound
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain).connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = "sine";
        gain.gain.value = 0.15;
        osc.start();
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
      } catch {
        // Ignore audio failures on restricted browsers.
      }

      speakHebrew("כל הכבוד!");

      if (currentClueIdx + 1 >= targetItems.length) {
        // Won!
        setTimeout(() => {
          setPhase("won");
          setShowConfetti(true);
          speakHebrew("מצאת את כל המטמון! כל הכבוד!");
          setTimeout(() => setShowConfetti(false), 4000);
        }, 600);
      } else {
        setTimeout(() => setCurrentClueIdx((i) => i + 1), 800);
      }
    } else {
      // Wrong
      setWrongTap(p.id);
      setScore((s) => Math.max(0, s - 2));
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain).connect(ctx.destination);
        osc.frequency.value = 200;
        osc.type = "sawtooth";
        gain.gain.value = 0.08;
        osc.start();
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.stop(ctx.currentTime + 0.2);
      } catch {
        // Ignore audio failures on restricted browsers.
      }
      setTimeout(() => setWrongTap(null), 400);
    }
  };

  const handleHint = () => {
    if (!currentClue) return;
    setHintUsed(true);
    // Briefly highlight the target
    const targetPlaced = placed.find((p) => p.isTarget && p.itemId === currentClue.id);
    if (targetPlaced) {
      setWrongTap(null);
      // Flash the target
      const el = document.getElementById(`treasure-${targetPlaced.id}`);
      if (el) {
        el.style.transform = `scale(1.8)`;
        el.style.filter = "drop-shadow(0 0 15px gold)";
        setTimeout(() => {
          el.style.transform = "";
          el.style.filter = "";
        }, 1200);
      }
    }
  };

  const difficultyOptions: { id: Difficulty; label: string; emoji: string; desc: string; color: string }[] = [
    { id: "easy", label: "קל", emoji: "😊", desc: "3 פריטים, הרבה זמן", color: "from-green-400 to-emerald-500" },
    { id: "medium", label: "בינוני", emoji: "🤔", desc: "5 פריטים, פחות זמן", color: "from-amber-400 to-orange-500" },
    { id: "hard", label: "קשה", emoji: "😈", desc: "8 פריטים, מעט זמן", color: "from-red-400 to-rose-500" },
  ];

  // ──────── MENU ────────
  if (phase === "menu") {
    return (
      <div
        className="flex flex-col items-center min-h-screen gap-6 px-5 py-8 overflow-y-auto relative"
        dir="rtl"
        style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {["🗺️", "💎", "🏴‍☠️", "🔑", "🧭", "⭐", "🏆", "👑", "🔍", "🎯"].map((e, i) => (
            <span key={i} className="absolute select-none" style={{
              fontSize: `${24 + (i % 4) * 8}px`,
              left: `${(i * 9.7) % 90}%`,
              top: `${(i * 12.3 + 5) % 85}%`,
              opacity: 0.2,
              animation: `floatBg ${6 + i % 4}s ease-in-out ${i * 0.7}s infinite alternate`,
            }}>{e}</span>
          ))}
        </div>

        <div className="relative z-10 text-center mt-8 bounce-in">
          <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg">
            🗺️ מצא את המטמון 🗺️
          </h1>
          <p className="text-white/80 mt-3 text-lg font-medium">חפשו את הפריטים המוסתרים!</p>
        </div>

        <div className="relative z-10 w-full max-w-sm space-y-4 mt-4">
          <h2 className="text-xl font-bold text-white text-center">בחרו רמת קושי</h2>
          {difficultyOptions.map((d, i) => (
            <button
              key={d.id}
              onClick={() => { setDifficulty(d.id); setPhase("scene-select"); }}
              className={`w-full bg-gradient-to-r ${d.color} rounded-2xl p-5 flex items-center gap-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 bounce-in text-white`}
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <span className="text-4xl">{d.emoji}</span>
              <div className="text-right">
                <div className="font-bold text-lg">{d.label}</div>
                <div className="text-sm text-white/80">{d.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button onClick={onHome} className="relative z-10 mt-4 text-white/70 hover:text-white flex items-center gap-2 transition-colors">
          <Home className="w-4 h-4" />
          <span className="text-sm">חזרה לתפריט</span>
        </button>
      </div>
    );
  }

  // ──────── SCENE SELECT ────────
  if (phase === "scene-select") {
    return (
      <div
        className="flex flex-col items-center min-h-screen gap-6 px-5 py-8 overflow-y-auto relative"
        dir="rtl"
        style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" }}
      >
        <div className="relative z-10 text-center bounce-in">
          <h1 className="text-3xl font-black text-white drop-shadow-lg">🗺️ בחרו סצנה</h1>
          <p className="text-white/80 mt-1">רמה: {difficultyOptions.find(d => d.id === difficulty)?.label}</p>
        </div>

        <div className="relative z-10 w-full max-w-lg grid grid-cols-2 gap-4">
          {TREASURE_SCENES.map((sc, i) => (
            <button
              key={sc.id}
              onClick={() => setupGame(sc, difficulty)}
              className="rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all active:scale-95 bounce-in text-white min-h-[120px]"
              style={{
                background: sc.background,
                animationDelay: `${0.1 + i * 0.08}s`,
              }}
            >
              <span className="text-5xl drop-shadow-md">{sc.emoji}</span>
              <span className="font-bold text-sm drop-shadow">{sc.name}</span>
            </button>
          ))}
        </div>

        <button onClick={() => setPhase("menu")} className="relative z-10 mt-2 text-white/70 hover:text-white flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          <span className="text-sm">חזרה</span>
        </button>
      </div>
    );
  }

  // ──────── WON / LOST ────────
  if (phase === "won" || phase === "lost") {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-6 px-5 py-8 relative"
        dir="rtl"
        style={{ background: phase === "won"
          ? "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B6B 100%)"
          : "linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)"
        }}
      >
        {showConfetti && <Confetti active />}
        <div className="text-center bounce-in">
          <span className="text-7xl">{phase === "won" ? "🏆" : "⏰"}</span>
          <h1 className="text-3xl font-black text-white mt-4 drop-shadow-lg">
            {phase === "won" ? "מצאת את כל המטמון!" : "נגמר הזמן!"}
          </h1>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-white">
              <Star className="w-5 h-5 inline ml-1" /> {score} נקודות
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-white">
              🔍 {foundIds.size}/{targetItems.length} נמצאו
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 bounce-in" style={{ animationDelay: "0.3s" }}>
          <Button onClick={() => scene && setupGame(scene, difficulty)} variant="game-green" size="lg">
            <RotateCcw className="w-5 h-5 ml-1" /> שחק שוב
          </Button>
          <Button onClick={() => setPhase("menu")} variant="game-blue" size="lg">
            🗺️ סצנה אחרת
          </Button>
        </div>
        <button onClick={onHome} className="mt-4 text-white/70 hover:text-white flex items-center gap-2">
          <Home className="w-4 h-4" />
          <span className="text-sm">חזרה לתפריט</span>
        </button>
      </div>
    );
  }

  // ──────── PLAYING ────────
  const progressPct = targetItems.length > 0 ? (foundIds.size / targetItems.length) * 100 : 0;
  const timeColor = timeLeft <= 10 ? "text-red-400" : timeLeft <= 20 ? "text-amber-300" : "text-white";

  return (
    <div className="flex flex-col h-screen overflow-hidden relative" dir="rtl">
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-md text-white z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase("menu")} className="p-1.5 rounded-lg hover:bg-white/10 transition">
            <Home className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-game-yellow" />
            <span className="font-bold text-sm">{score}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className={`w-4 h-4 ${timeColor}`} />
          <span className={`font-bold text-sm tabular-nums ${timeColor}`}>{timeLeft}s</span>
        </div>
        <div className="text-xs font-medium">🔍 {foundIds.size}/{targetItems.length}</div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-black/20">
        <div className="h-full bg-accent transition-all duration-500 rounded-r-full" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Clue bar */}
      {currentClue && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white/90 backdrop-blur shadow-md z-10">
          <button
            onClick={() => speakHebrew(currentClue.voiceClue)}
            className="w-9 h-9 rounded-full bg-game-blue flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <div className="flex-1 text-right">
            <div className="font-bold text-sm text-foreground">{currentClue.visualClue}</div>
            <div className="text-xs text-muted-foreground">{currentClue.voiceClue}</div>
          </div>
          <button
            onClick={handleHint}
            className="w-9 h-9 rounded-full bg-game-orange flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
            title="רמז"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Game board */}
      <div
        ref={boardRef}
        className="flex-1 relative overflow-hidden cursor-pointer select-none"
        style={{ background: scene?.background || "#333" }}
      >
        {/* Placed emojis */}
        {placed.map((p) => (
          <button
            key={p.id}
            id={`treasure-${p.id}`}
            onClick={() => handleTap(p)}
            disabled={p.found}
            className={`absolute transition-all duration-300 select-none
              ${p.found ? "scale-0 opacity-0" : "hover:scale-125 active:scale-90"}
              ${wrongTap === p.id ? "animate-[wiggle_0.4s_ease-in-out]" : ""}
            `}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size}px`,
              transform: `rotate(${p.rotation}deg)`,
              filter: p.found ? "none" : "drop-shadow(1px 2px 3px rgba(0,0,0,0.3))",
              zIndex: p.isTarget ? 5 : 2,
            }}
          >
            {p.emoji}
          </button>
        ))}

        {/* Found animation */}
        {placed.filter(p => p.found).map(p => (
          <div
            key={`found-${p.id}`}
            className="absolute pointer-events-none"
            style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: 10 }}
          >
            <span className="text-3xl animate-[emojiFirework_0.8s_ease-out_forwards]">✨</span>
          </div>
        ))}
      </div>
    </div>
  );
}
