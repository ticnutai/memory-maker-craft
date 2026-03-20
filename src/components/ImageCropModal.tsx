import { useState, useRef, useCallback, useEffect } from "react";
import { X, RotateCw, ZoomIn, ZoomOut, Check, Maximize } from "lucide-react";

interface ImageCropModalProps {
  imageUrl: string;
  onSave: (croppedDataUrl: string) => void;
  onClose: () => void;
  theme: "girl" | "boy";
}

export default function ImageCropModal({ imageUrl, onSave, onClose, theme }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);
  const [aspect, setAspect] = useState<"square" | "free">("square");

  const accent = theme === "girl" ? "bg-game-pink" : "bg-game-blue";
  const SIZE = 300;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
      drawCanvas(img, 1, 0, { x: 0, y: 0 });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const drawCanvas = useCallback((img: HTMLImageElement, z: number, rot: number, off: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = SIZE;
    canvas.height = SIZE;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.translate(SIZE / 2 + off.x, SIZE / 2 + off.y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(z, z);

    const scale = Math.max(SIZE / img.width, SIZE / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }, []);

  useEffect(() => {
    if (imgRef.current && loaded) {
      drawCanvas(imgRef.current, zoom, rotation, offset);
    }
  }, [zoom, rotation, offset, loaded, drawCanvas]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = () => setDragging(false);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border-2 border-muted flex flex-col overflow-hidden bounce-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted">
          <h3 className="text-lg font-black">✂️ חיתוך והתאמה</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {/* Canvas area */}
          <div
            className="relative border-2 border-dashed border-muted-foreground/30 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ width: SIZE, height: SIZE }}
          >
            <canvas
              ref={canvasRef}
              width={SIZE}
              height={SIZE}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="touch-none"
            />
            {/* Crop overlay grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 w-full justify-center">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-all active:scale-95">
              <ZoomOut className="w-4 h-4" />
            </button>
            <input type="range" min={0.5} max={3} step={0.05} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 rounded-full cursor-pointer accent-[hsl(var(--foreground))]"
            />
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-all active:scale-95">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setRotation(r => r + 90)}
              className="h-9 px-4 rounded-xl bg-muted text-sm font-bold flex items-center gap-1.5 hover:bg-muted/80 transition-all active:scale-95">
              <RotateCw className="w-3.5 h-3.5" /> סיבוב
            </button>
            <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); setRotation(0); }}
              className="h-9 px-4 rounded-xl bg-muted text-sm font-bold flex items-center gap-1.5 hover:bg-muted/80 transition-all active:scale-95">
              <Maximize className="w-3.5 h-3.5" /> איפוס
            </button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-muted flex gap-2">
          <button onClick={onClose}
            className="flex-1 h-11 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-all active:scale-95">
            ביטול
          </button>
          <button onClick={handleSave}
            className={`flex-1 h-11 rounded-xl font-bold text-sm ${accent} text-primary-foreground shadow-md hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2`}>
            <Check className="w-4 h-4" /> שמירה
          </button>
        </div>
      </div>
    </div>
  );
}
