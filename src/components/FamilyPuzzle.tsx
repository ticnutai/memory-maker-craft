import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw, Home, Upload, Trophy, Image as ImageIcon } from "lucide-react";

const PRESET_IMAGES = [
  { url: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=400&fit=crop", label: "🐶 כלבלב" },
  { url: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop", label: "🐱 חתלתול" },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", label: "🌸 פרחים" },
  { url: "https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=400&h=400&fit=crop", label: "🌅 שקיעה" },
];

interface Piece {
  id: number;
  correctX: number;
  correctY: number;
  currentIdx: number;
}

interface FamilyPuzzleProps {
  onHome: () => void;
}

export default function FamilyPuzzle({ onHome }: FamilyPuzzleProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(3);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [solved, setSolved] = useState(false);
  const [moves, setMoves] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const initPuzzle = useCallback((size: number) => {
    const total = size * size;
    const arr: Piece[] = Array.from({ length: total }, (_, i) => ({
      id: i,
      correctX: i % size,
      correctY: Math.floor(i / size),
      currentIdx: i,
    }));
    // Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i].currentIdx, arr[j].currentIdx] = [arr[j].currentIdx, arr[i].currentIdx];
    }
    setPieces(arr);
    setSolved(false);
    setMoves(0);
  }, []);

  const handleImageSelect = (url: string) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageUrl(url);
      initPuzzle(gridSize);
    };
    img.src = url;
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    handleImageSelect(url);
  };

  const handleSwap = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setPieces(prev => {
      const next = [...prev];
      const a = next.find(p => p.currentIdx === fromIdx)!;
      const b = next.find(p => p.currentIdx === toIdx)!;
      [a.currentIdx, b.currentIdx] = [b.currentIdx, a.currentIdx];
      // Check solved
      const isSolved = next.every(p => p.currentIdx === p.id);
      if (isSolved) setSolved(true);
      return next;
    });
    setMoves(m => m + 1);
  };

  // Image selection screen
  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-16" dir="rtl">
        <div className="text-6xl mb-4 bounce-in">🧩</div>
        <h1 className="text-2xl font-black text-foreground mb-2">פאזל משפחתי</h1>
        <p className="text-sm text-muted-foreground mb-6">בחרו תמונה או העלו משלכם</p>

        {/* Grid size */}
        <div className="flex gap-2 mb-4">
          {[3, 4, 5].map(s => (
            <button key={s} onClick={() => setGridSize(s)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${gridSize === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-muted text-muted-foreground"}`}>
              {s}×{s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-4">
          {PRESET_IMAGES.map((img, i) => (
            <button key={i} onClick={() => handleImageSelect(img.url)}
              className="relative rounded-2xl overflow-hidden border-2 border-muted hover:border-primary transition-all hover:scale-105 active:scale-95 aspect-square bounce-in"
              style={{ animationDelay: `${i * 0.08}s` }}>
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" crossOrigin="anonymous" />
              <span className="absolute bottom-1 right-1 bg-background/80 px-2 py-0.5 rounded-full text-xs font-bold">{img.label}</span>
            </button>
          ))}
        </div>

        <label className="cursor-pointer">
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:brightness-110 transition-all">
            <Upload className="w-4 h-4" /> העלאת תמונה
          </div>
        </label>

        <Button variant="ghost" onClick={onHome} className="mt-4 gap-2">
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
      </div>
    );
  }

  // Solved
  if (solved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4" dir="rtl">
        <div className="bg-card rounded-3xl p-8 border-2 border-muted shadow-xl max-w-sm w-full text-center bounce-in">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-xl font-black mb-2">כל הכבוד!</h2>
          <p className="text-sm text-muted-foreground mb-1">השלמתם את הפאזל</p>
          <p className="text-lg font-bold text-primary mb-4">{moves} מהלכים</p>
          <img src={imageUrl} alt="Puzzle" className="rounded-xl mb-4 w-full max-w-[200px] mx-auto" crossOrigin="anonymous" />
          <div className="flex gap-2">
            <Button onClick={() => initPuzzle(gridSize)} className="flex-1 rounded-xl gap-2">
              <RotateCcw className="w-4 h-4" /> שוב
            </Button>
            <Button variant="outline" onClick={() => setImageUrl(null)} className="flex-1 rounded-xl gap-2">
              <ImageIcon className="w-4 h-4" /> תמונה חדשה
            </Button>
          </div>
          <Button variant="ghost" onClick={onHome} className="mt-3 w-full gap-2">
            <Home className="w-4 h-4" /> דף הבית
          </Button>
        </div>
      </div>
    );
  }

  // Game board
  const pieceSize = Math.min(320, window.innerWidth - 40) / gridSize;
  const sortedByPosition = [...pieces].sort((a, b) => a.currentIdx - b.currentIdx);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" dir="rtl">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-xs font-bold text-muted-foreground">🧩 {gridSize}×{gridSize}</span>
        <span className="text-xs font-bold text-primary">📊 {moves} מהלכים</span>
      </div>

      <div
        className="grid bg-muted/30 rounded-xl border-2 border-muted p-1 gap-0.5"
        style={{ gridTemplateColumns: `repeat(${gridSize}, ${pieceSize}px)` }}
      >
        {sortedByPosition.map((piece) => {
          const bgX = -(piece.correctX * pieceSize);
          const bgY = -(piece.correctY * pieceSize);
          const totalSize = pieceSize * gridSize;
          return (
            <div
              key={piece.id}
              draggable
              onDragStart={() => setDragIdx(piece.currentIdx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null) handleSwap(dragIdx, piece.currentIdx);
                setDragIdx(null);
              }}
              onClick={() => {
                if (dragIdx === null) setDragIdx(piece.currentIdx);
                else { handleSwap(dragIdx, piece.currentIdx); setDragIdx(null); }
              }}
              className={`rounded-md overflow-hidden cursor-pointer transition-all hover:brightness-110 ${dragIdx === piece.currentIdx ? "ring-2 ring-primary scale-95" : "hover:scale-[1.02]"}`}
              style={{
                width: pieceSize,
                height: pieceSize,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${totalSize}px ${totalSize}px`,
                backgroundPosition: `${bgX}px ${bgY}px`,
              }}
            />
          );
        })}
      </div>

      {/* Tiny reference */}
      <div className="mt-3 flex items-center gap-3">
        <img src={imageUrl} alt="ref" className="w-12 h-12 rounded-lg border object-cover" crossOrigin="anonymous" />
        <Button variant="ghost" size="sm" onClick={() => initPuzzle(gridSize)} className="gap-1 text-xs">
          <RotateCcw className="w-3 h-3" /> ערבב
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setImageUrl(null)} className="gap-1 text-xs">
          <ImageIcon className="w-3 h-3" /> תמונה אחרת
        </Button>
        <Button variant="ghost" size="sm" onClick={onHome} className="gap-1 text-xs">
          <Home className="w-3 h-3" /> בית
        </Button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
