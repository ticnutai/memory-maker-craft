import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw, Home, PartyPopper, Sparkles } from "lucide-react";

const BINGO_ITEMS = [
  "אוהב שוקולד 🍫", "נולד בקיץ ☀️", "יש לו חיית מחמד 🐕", "אוהב לשחות 🏊",
  "יודע לרכוב על אופניים 🚲", "אוהב מוזיקה 🎵", "קורא ספרים 📚", "אוהב פיצה 🍕",
  "יודע לבשל 👨‍🍳", "היה בחו\"ל ✈️", "אוהב צבע כחול 💙", "יש לו אחים 👫",
  "אוהב גלידה 🍦", "יודע לצייר 🎨", "נולד בחורף ❄️", "אוהב ספורט ⚽",
  "אוהב לצפות בסרטים 🎬", "יודע לשחק שחמט ♟️", "אוהב פרחים 🌸", "יש לו משקפיים 👓",
  "אוהב לרקוד 💃", "אוהב לולים 🎡", "יודע שפה נוספת 🗣️", "אוהב חתולים 🐱",
  "נולד באביב 🌷", "אוהב לטייל 🥾", "יודע לשיר 🎤", "אוהב סושי 🍣",
  "יש לו תחביב מיוחד ⭐", "אוהב שמש 🌞", "נולד בסתיו 🍂", "אוהב מתמטיקה 🔢",
];

interface FamilyBingoProps {
  onHome: () => void;
}

export default function FamilyBingo({ onHome }: FamilyBingoProps) {
  const [board, setBoard] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [size, setSize] = useState(5);
  const [started, setStarted] = useState(false);
  const [bingo, setBingo] = useState(false);

  const generate = useCallback((gridSize: number) => {
    const shuffled = [...BINGO_ITEMS].sort(() => Math.random() - 0.5);
    const total = gridSize * gridSize;
    const items = shuffled.slice(0, total);
    const center = Math.floor(total / 2);
    items[center] = "⭐ חופשי! ⭐";
    setBoard(items);
    setChecked(new Set([center]));
    setSize(gridSize);
    setStarted(true);
    setBingo(false);
  }, []);

  const toggleCell = (idx: number) => {
    const center = Math.floor((size * size) / 2);
    if (idx === center) return;
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      // Check bingo
      checkBingo(next);
      return next;
    });
  };

  const checkBingo = (cells: Set<number>) => {
    // Check rows
    for (let r = 0; r < size; r++) {
      let row = true;
      for (let c = 0; c < size; c++) {
        if (!cells.has(r * size + c)) { row = false; break; }
      }
      if (row) { setBingo(true); return; }
    }
    // Check columns
    for (let c = 0; c < size; c++) {
      let col = true;
      for (let r = 0; r < size; r++) {
        if (!cells.has(r * size + c)) { col = false; break; }
      }
      if (col) { setBingo(true); return; }
    }
    // Diagonals
    let d1 = true, d2 = true;
    for (let i = 0; i < size; i++) {
      if (!cells.has(i * size + i)) d1 = false;
      if (!cells.has(i * size + (size - 1 - i))) d2 = false;
    }
    if (d1 || d2) { setBingo(true); return; }
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-16" dir="rtl">
        <div className="text-6xl mb-4 bounce-in">🎯</div>
        <h1 className="text-2xl font-black text-foreground mb-2">בינגו משפחתי</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
          מצאו בני משפחה שמתאימים לתיאור וסמנו!<br/>
          שורה / עמודה / אלכסון = בינגו! 🎉
        </p>
        <div className="flex gap-2 mb-4">
          {[4, 5].map(s => (
            <Button key={s} onClick={() => generate(s)}
              variant={size === s ? "default" : "outline"}
              className="rounded-xl text-sm">
              {s}×{s}
            </Button>
          ))}
        </div>
        <Button variant="ghost" onClick={onHome} className="mt-4 gap-2">
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
      </div>
    );
  }

  if (bingo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4" dir="rtl">
        <div className="bg-card rounded-3xl p-8 border-2 border-muted shadow-xl max-w-sm w-full text-center bounce-in">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-black mb-2 text-primary">בינגו!</h2>
          <p className="text-sm text-muted-foreground mb-4">כל הכבוד! עשיתם שורה!</p>
          <div className="flex gap-2">
            <Button onClick={() => generate(size)} className="flex-1 rounded-xl gap-2">
              <RotateCcw className="w-4 h-4" /> כרטיס חדש
            </Button>
            <Button variant="ghost" onClick={onHome} className="flex-1 rounded-xl gap-2">
              <Home className="w-4 h-4" /> דף הבית
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const cellSize = Math.min(80, (Math.min(420, window.innerWidth - 24)) / size);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" dir="rtl">
      <h2 className="text-lg font-black mb-1">🎯 בינגו משפחתי</h2>
      <p className="text-xs text-muted-foreground mb-3">לחצו על משבצת כשמצאתם מישהו שמתאים!</p>

      <div
        className="grid gap-1 bg-muted/30 rounded-xl border-2 border-muted p-1.5"
        style={{ gridTemplateColumns: `repeat(${size}, ${cellSize}px)` }}
      >
        {board.map((item, idx) => {
          const isChecked = checked.has(idx);
          const isCenter = idx === Math.floor((size * size) / 2);
          return (
            <button
              key={idx}
              onClick={() => toggleCell(idx)}
              className={`rounded-lg flex items-center justify-center text-center p-1 transition-all active:scale-90 font-bold ${
                isCenter ? "bg-yellow-200 text-yellow-800 cursor-default" :
                isChecked ? "bg-green-200 text-green-800 shadow-sm" :
                "bg-card hover:bg-muted text-foreground"
              }`}
              style={{ width: cellSize, height: cellSize, fontSize: Math.max(8, cellSize / 8) }}
            >
              <span className="leading-tight">{item}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="ghost" size="sm" onClick={() => generate(size)} className="gap-1 text-xs">
          <RotateCcw className="w-3 h-3" /> כרטיס חדש
        </Button>
        <Button variant="ghost" size="sm" onClick={onHome} className="gap-1 text-xs">
          <Home className="w-3 h-3" /> בית
        </Button>
      </div>
    </div>
  );
}
