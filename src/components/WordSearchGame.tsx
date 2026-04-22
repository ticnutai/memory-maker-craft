import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw, Home, Trophy } from "lucide-react";

const WORD_BANKS: Record<string, { words: string[]; emoji: string }> = {
  "משפחה": { emoji: "👨‍👩‍👧‍👦", words: ["אמא", "אבא", "סבא", "סבתא", "אח", "אחות", "דוד", "דודה", "בית", "אהבה"] },
  "חיות": { emoji: "🐾", words: ["כלב", "חתול", "ארנב", "דג", "ציפור", "סוס", "פרה", "תרנגול", "נחש", "דוב"] },
  "אוכל": { emoji: "🍕", words: ["פיצה", "עוגה", "לחם", "גבינה", "תפוח", "בננה", "סלט", "מרק", "אורז", "דבש"] },
  "צבעים": { emoji: "🎨", words: ["אדום", "כחול", "ירוק", "צהוב", "כתום", "סגול", "ורוד", "לבן", "שחור", "חום"] },
};

const GRID_SIZE = 10;
const HEBREW_LETTERS = "אבגדהוזחטיכלמנסעפצקרשת";

function placeWord(grid: string[][], word: string): boolean {
  const directions = [
    [0, 1], [1, 0], [0, -1], [-1, 0], // horizontal & vertical
    [1, 1], [1, -1], // diagonals
  ];
  const letters = word.split("").reverse(); // Hebrew RTL → place LTR in grid
  
  for (let attempt = 0; attempt < 50; attempt++) {
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const startR = Math.floor(Math.random() * GRID_SIZE);
    const startC = Math.floor(Math.random() * GRID_SIZE);
    
    let fits = true;
    const positions: [number, number][] = [];
    
    for (let i = 0; i < letters.length; i++) {
      const r = startR + dir[0] * i;
      const c = startC + dir[1] * i;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) { fits = false; break; }
      if (grid[r][c] !== "" && grid[r][c] !== letters[i]) { fits = false; break; }
      positions.push([r, c]);
    }
    
    if (fits) {
      positions.forEach(([r, c], i) => { grid[r][c] = letters[i]; });
      return true;
    }
  }
  return false;
}

function generateGrid(words: string[]): { grid: string[][]; placedWords: string[] } {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(""));
  const placedWords: string[] = [];
  
  // Sort by length (longer first)
  const sorted = [...words].sort((a, b) => b.length - a.length);
  for (const word of sorted) {
    if (placeWord(grid, word)) placedWords.push(word);
  }
  
  // Fill empty cells
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = HEBREW_LETTERS[Math.floor(Math.random() * HEBREW_LETTERS.length)];
      }
    }
  }
  
  return { grid, placedWords };
}

interface WordSearchGameProps {
  onHome: () => void;
}

export default function WordSearchGame({ onHome }: WordSearchGameProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [grid, setGrid] = useState<string[][]>([]);
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [currentCells, setCurrentCells] = useState<[number, number][]>([]);

  const startGame = useCallback((cat: string) => {
    const bank = WORD_BANKS[cat];
    const { grid: g, placedWords: pw } = generateGrid(bank.words);
    setGrid(g);
    setPlacedWords(pw);
    setFoundWords(new Set());
    setSelectedCells(new Set());
    setCategory(cat);
  }, []);

  const getCellsInLine = (start: [number, number], end: [number, number]): [number, number][] => {
    const dr = Math.sign(end[0] - start[0]);
    const dc = Math.sign(end[1] - start[1]);
    if (dr === 0 && dc === 0) return [start];
    
    const cells: [number, number][] = [];
    let r = start[0], c = start[1];
    while (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      cells.push([r, c]);
      if (r === end[0] && c === end[1]) break;
      r += dr;
      c += dc;
    }
    return cells;
  };

  const handlePointerDown = (r: number, c: number) => {
    setSelecting(true);
    setStartCell([r, c]);
    setCurrentCells([[r, c]]);
  };

  const handlePointerMove = (r: number, c: number) => {
    if (!selecting || !startCell) return;
    const cells = getCellsInLine(startCell, [r, c]);
    setCurrentCells(cells);
  };

  const handlePointerUp = () => {
    if (!selecting || currentCells.length === 0) { setSelecting(false); return; }
    
    // Check if selected letters form a word
    const letters = currentCells.map(([r, c]) => grid[r][c]).join("");
    const reversed = [...letters].reverse().join("");
    
    const found = placedWords.find(w => {
      const wLetters = w.split("").reverse().join("");
      return wLetters === letters || wLetters === reversed;
    });
    
    if (found && !foundWords.has(found)) {
      setFoundWords(prev => new Set([...prev, found]));
      setSelectedCells(prev => {
        const next = new Set(prev);
        currentCells.forEach(([r, c]) => next.add(`${r},${c}`));
        return next;
      });
    }
    
    setSelecting(false);
    setStartCell(null);
    setCurrentCells([]);
  };

  const allFound = placedWords.length > 0 && foundWords.size === placedWords.length;

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-16" dir="rtl">
        <div className="text-6xl mb-4 bounce-in">🔤</div>
        <h1 className="text-2xl font-black text-foreground mb-2">חיפוש מילים</h1>
        <p className="text-sm text-muted-foreground mb-6">מצאו את כל המילים המוסתרות!</p>
        
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {Object.entries(WORD_BANKS).map(([key, val], i) => (
            <button key={key} onClick={() => startGame(key)}
              className="bg-card border-2 border-muted rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95 hover:border-primary bounce-in"
              style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="text-4xl">{val.emoji}</span>
              <span className="font-bold text-sm text-foreground">{key}</span>
            </button>
          ))}
        </div>

        <Button variant="ghost" onClick={onHome} className="mt-6 gap-2">
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
      </div>
    );
  }

  if (allFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4" dir="rtl">
        <div className="bg-card rounded-3xl p-8 border-2 border-muted shadow-xl max-w-sm w-full text-center bounce-in">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-xl font-black mb-2">מצאתם הכל!</h2>
          <p className="text-sm text-muted-foreground mb-4">{placedWords.length} מילים</p>
          <div className="flex gap-2">
            <Button onClick={() => startGame(category)} className="flex-1 rounded-xl gap-2">
              <RotateCcw className="w-4 h-4" /> שוב
            </Button>
            <Button variant="outline" onClick={() => setCategory(null)} className="flex-1 rounded-xl">
              קטגוריה אחרת
            </Button>
          </div>
          <Button variant="ghost" onClick={onHome} className="mt-3 w-full gap-2">
            <Home className="w-4 h-4" /> דף הבית
          </Button>
        </div>
      </div>
    );
  }

  const cellSize = Math.min(36, (Math.min(400, window.innerWidth - 32)) / GRID_SIZE);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" dir="rtl">
      <h2 className="text-lg font-black mb-2">🔤 חיפוש מילים — {category}</h2>
      <p className="text-xs text-muted-foreground mb-3">מצאו {foundWords.size}/{placedWords.length} מילים</p>

      {/* Grid */}
      <div
        className="grid rounded-xl border-2 border-muted bg-card shadow-lg p-1 select-none"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)` }}
        onPointerLeave={handlePointerUp}
      >
        {grid.map((row, r) =>
          row.map((letter, c) => {
            const key = `${r},${c}`;
            const isFound = selectedCells.has(key);
            const isActive = currentCells.some(([cr, cc]) => cr === r && cc === c);
            return (
              <div
                key={key}
                onPointerDown={() => handlePointerDown(r, c)}
                onPointerEnter={() => handlePointerMove(r, c)}
                onPointerUp={handlePointerUp}
                className={`flex items-center justify-center font-bold text-sm rounded cursor-pointer transition-all select-none ${
                  isFound ? "bg-green-200 text-green-800" :
                  isActive ? "bg-primary/20 text-primary" :
                  "hover:bg-muted text-foreground"
                }`}
                style={{ width: cellSize, height: cellSize }}
              >
                {letter}
              </div>
            );
          })
        )}
      </div>

      {/* Word list */}
      <div className="flex flex-wrap gap-1.5 mt-4 max-w-sm justify-center">
        {placedWords.map(word => (
          <span key={word} className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
            foundWords.has(word) ? "bg-green-200 text-green-800 line-through" : "bg-muted text-muted-foreground"
          }`}>
            {word}
          </span>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="ghost" size="sm" onClick={() => startGame(category)} className="gap-1 text-xs">
          <RotateCcw className="w-3 h-3" /> ערבב
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCategory(null)} className="gap-1 text-xs">
          קטגוריה אחרת
        </Button>
        <Button variant="ghost" size="sm" onClick={onHome} className="gap-1 text-xs">
          <Home className="w-3 h-3" /> בית
        </Button>
      </div>
    </div>
  );
}
