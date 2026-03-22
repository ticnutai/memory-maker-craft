import { useState } from "react";
import { LayoutGrid, X } from "lucide-react";

export type LayoutPreset = {
  id: string;
  name: string;
  cols: number;
  gap: number;
  align: "center" | "start" | "end";
  pattern: "grid" | "circle" | "wave" | "diamond" | "spiral" | "random";
};

const PRESETS: LayoutPreset[] = [
  { id: "grid-2", name: "2 עמודות", cols: 2, gap: 12, align: "center", pattern: "grid" },
  { id: "grid-3", name: "3 עמודות", cols: 3, gap: 12, align: "center", pattern: "grid" },
  { id: "grid-4", name: "4 עמודות", cols: 4, gap: 10, align: "center", pattern: "grid" },
  { id: "circle", name: "מעגל", cols: 0, gap: 0, align: "center", pattern: "circle" },
  { id: "wave", name: "גלים", cols: 4, gap: 10, align: "center", pattern: "wave" },
  { id: "diamond", name: "יהלום", cols: 0, gap: 8, align: "center", pattern: "diamond" },
  { id: "spiral", name: "ספירלה", cols: 0, gap: 0, align: "center", pattern: "spiral" },
  { id: "random", name: "אקראי", cols: 0, gap: 0, align: "center", pattern: "random" },
];

// Mini preview renderer
function PreviewDots({ preset }: { preset: LayoutPreset }) {
  const count = 8;
  const size = 56;

  const getPositions = (): { x: number; y: number }[] => {
    const positions: { x: number; y: number }[] = [];
    switch (preset.pattern) {
      case "grid": {
        const cols = preset.cols;
        const rows = Math.ceil(count / cols);
        const cellW = size / (cols + 0.5);
        const cellH = size / (rows + 0.5);
        for (let i = 0; i < count; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          positions.push({
            x: cellW * 0.4 + col * cellW,
            y: cellH * 0.4 + row * cellH,
          });
        }
        break;
      }
      case "circle": {
        const cx = size / 2;
        const cy = size / 2;
        const r = size * 0.35;
        for (let i = 0; i < count; i++) {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2;
          positions.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
        }
        break;
      }
      case "wave": {
        const cols = 4;
        for (let i = 0; i < count; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const waveOffset = Math.sin((col / cols) * Math.PI) * 6;
          positions.push({
            x: 6 + col * (size - 12) / (cols - 1),
            y: 12 + row * 20 + waveOffset,
          });
        }
        break;
      }
      case "diamond": {
        const cx = size / 2;
        const cy = size / 2;
        const layers = [[0, -16], [-12, -6], [12, -6], [-18, 6], [0, 6], [18, 6], [-12, 16], [12, 16]];
        for (let i = 0; i < count; i++) {
          const [dx, dy] = layers[i] || [0, 0];
          positions.push({ x: cx + dx, y: cy + dy });
        }
        break;
      }
      case "spiral": {
        const cx = size / 2;
        const cy = size / 2;
        for (let i = 0; i < count; i++) {
          const angle = i * 0.9;
          const r = 5 + i * 2.5;
          positions.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
        }
        break;
      }
      case "random": {
        const seed = [0.2, 0.7, 0.5, 0.1, 0.9, 0.3, 0.6, 0.8];
        const seedY = [0.3, 0.1, 0.8, 0.6, 0.4, 0.9, 0.2, 0.5];
        for (let i = 0; i < count; i++) {
          positions.push({
            x: 4 + seed[i] * (size - 12),
            y: 4 + seedY[i] * (size - 12),
          });
        }
        break;
      }
    }
    return positions;
  };

  const dots = getPositions();

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      {dots.map((p, i) => (
        <rect
          key={i}
          x={p.x - 3}
          y={p.y - 3.6}
          width={6}
          height={7.2}
          rx={1.2}
          fill="currentColor"
          opacity={0.85}
        />
      ))}
    </svg>
  );
}

interface LayoutPickerProps {
  current?: string;
  onSelect: (preset: LayoutPreset) => void;
}

export default function LayoutPicker({ current, onSelect }: LayoutPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-card/90 backdrop-blur border border-border shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-foreground"
        title="תצוגות פריסה"
      >
        <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 right-0 z-50 bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl p-3 min-w-[260px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-sm font-bold text-foreground">פריסת קלפים</span>
              <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => { onSelect(preset); setOpen(false); }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:bg-muted/60 active:scale-95 ${
                    current === preset.id
                      ? "bg-primary/15 ring-2 ring-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <PreviewDots preset={preset} />
                  <span className="text-[10px] font-medium leading-tight">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
