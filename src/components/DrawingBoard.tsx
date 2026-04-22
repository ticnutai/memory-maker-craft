import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Home, RotateCcw, Download, Eraser, Undo2, Paintbrush } from "lucide-react";

const COLORS = [
  "hsl(var(--foreground))", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#78716c",
];
const SIZES = [2, 4, 8, 14, 24];

interface DrawingBoardProps {
  onHome: () => void;
}

export default function DrawingBoard({ onHome }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const getCtx = useCallback(() => canvasRef.current?.getContext("2d") ?? null, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.min(600, window.innerWidth - 32);
    const h = Math.min(500, window.innerHeight - 200);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
  }, []);

  const saveHistory = () => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(data);
    if (historyRef.current.length > 30) historyRef.current.shift();
    setCanUndo(true);
  };

  const undo = () => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    ctx.putImageData(prev, 0, 0);
    setCanUndo(historyRef.current.length > 0);
  };

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent) => {
    saveHistory();
    setDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.PointerEvent) => {
    if (!drawing) return;
    const ctx = getCtx();
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => {
    setDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    saveHistory();
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "ציור-משפחתי.png";
    a.click();
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 pt-14" dir="rtl">
      <h2 className="text-lg font-black mb-3">🎨 ציור משותף</h2>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3 w-full max-w-[600px] justify-center">
        {/* Tool */}
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setTool("brush")}
            className={`p-1.5 rounded transition-all ${tool === "brush" ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}>
            <Paintbrush className="w-4 h-4" />
          </button>
          <button onClick={() => setTool("eraser")}
            className={`p-1.5 rounded transition-all ${tool === "eraser" ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}>
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Colors */}
        <div className="flex gap-1">
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool("brush"); }}
              className={`w-6 h-6 rounded-full transition-all ${color === c && tool === "brush" ? "ring-2 ring-offset-1 ring-foreground scale-110" : "hover:scale-105"}`}
              style={{ backgroundColor: c }} />
          ))}
          <label className="relative w-6 h-6 rounded-full overflow-hidden border border-dashed border-muted-foreground/40 cursor-pointer">
            <input type="color" value={color} onChange={e => { setColor(e.target.value); setTool("brush"); }}
              className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="w-full h-full flex items-center justify-center text-[8px]">🎨</div>
          </label>
        </div>

        {/* Sizes */}
        <div className="flex gap-1 items-center">
          {SIZES.map(s => (
            <button key={s} onClick={() => setBrushSize(s)}
              className={`rounded-full transition-all ${brushSize === s ? "ring-2 ring-primary" : ""}`}
              style={{ width: Math.max(14, s + 8), height: Math.max(14, s + 8), backgroundColor: brushSize === s ? color : "hsl(var(--muted))" }} />
          ))}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
        className="rounded-xl border-2 border-muted shadow-lg cursor-crosshair touch-none bg-card"
      />

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} className="gap-1 text-xs">
          <Undo2 className="w-3 h-3" /> ביטול
        </Button>
        <Button variant="ghost" size="sm" onClick={clearCanvas} className="gap-1 text-xs">
          <RotateCcw className="w-3 h-3" /> נקה
        </Button>
        <Button variant="ghost" size="sm" onClick={downloadImage} className="gap-1 text-xs">
          <Download className="w-3 h-3" /> שמור
        </Button>
        <Button variant="ghost" size="sm" onClick={onHome} className="gap-1 text-xs">
          <Home className="w-3 h-3" /> בית
        </Button>
      </div>
    </div>
  );
}
