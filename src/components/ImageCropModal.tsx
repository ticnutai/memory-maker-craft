import { useState, useRef, useCallback, useEffect } from "react";
import { X, RotateCw, ZoomIn, ZoomOut, Check, Maximize, Eraser, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageCropModalProps {
  imageUrl: string;
  onSave: (croppedDataUrl: string) => void;
  onClose: () => void;
  theme: "girl" | "boy";
}

const BG_PRESETS = [
  { label: "לבן", value: "a clean solid white background", color: "#ffffff" },
  { label: "ורוד", value: "a soft pastel pink background", color: "#f9a8d4" },
  { label: "תכלת", value: "a soft pastel light blue background", color: "#93c5fd" },
  { label: "ירוק", value: "a soft pastel green background with grass", color: "#86efac" },
  { label: "שמיים", value: "a bright blue sky with fluffy white clouds", color: "#38bdf8" },
  { label: "חלל", value: "outer space with colorful stars and galaxies, kid-friendly", color: "#1e1b4b" },
  { label: "יער", value: "a magical fairy tale forest with sunlight, colorful flowers", color: "#166534" },
  { label: "חוף ים", value: "a beautiful sandy beach with turquoise water and palm trees", color: "#06b6d4" },
  { label: "קשת", value: "a colorful rainbow gradient background with sparkles", color: "#c084fc" },
  { label: "עננים", value: "fluffy pastel clouds in a dreamy sky", color: "#e0e7ff" },
];

export default function ImageCropModal({ imageUrl, onSave, onClose, theme }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"crop" | "background">("crop");
  const [customBgPrompt, setCustomBgPrompt] = useState("");
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  const accent = theme === "girl" ? "bg-game-pink" : "bg-game-blue";
  const SIZE = 300;

  const currentImageUrl = processedUrl || imageUrl;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
      drawCanvas(img, 1, 0, { x: 0, y: 0 });
    };
    img.src = currentImageUrl;
  }, [currentImageUrl]);

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
    const dataUrl = canvas.toDataURL("image/png", 0.95);
    onSave(dataUrl);
  };

  const callBackgroundAPI = async (mode: "remove" | "replace", replacementPrompt?: string) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("remove-background", {
        body: { imageUrl: currentImageUrl, mode, replacementPrompt },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error("לא התקבלה תמונה");

      setProcessedUrl(data.imageUrl);
      // Reset crop state
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      toast.success(mode === "remove" ? "הרקע הוסר בהצלחה! ✨" : "הרקע הוחלף בהצלחה! 🎨");
    } catch (err: any) {
      console.error("Background API error:", err);
      toast.error("שגיאה בעיבוד התמונה, נסו שוב");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveBg = () => callBackgroundAPI("remove");
  const handleReplaceBg = (prompt: string) => callBackgroundAPI("replace", prompt);

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border-2 border-muted flex flex-col overflow-hidden bounce-in max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted">
          <h3 className="text-lg font-black">✂️ עריכת תמונה</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-muted">
          <button
            onClick={() => setActiveTab("crop")}
            className={`flex-1 py-2.5 text-sm font-bold transition-all ${
              activeTab === "crop"
                ? `${accent} text-primary-foreground`
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            ✂️ חיתוך וסיבוב
          </button>
          <button
            onClick={() => setActiveTab("background")}
            className={`flex-1 py-2.5 text-sm font-bold transition-all ${
              activeTab === "background"
                ? `${accent} text-primary-foreground`
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> רקע AI
            </span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Canvas preview - shared */}
          <div className="p-4 flex flex-col items-center gap-3">
            <div
              className="relative border-2 border-dashed border-muted-foreground/30 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing"
              style={{ width: SIZE, height: SIZE }}
            >
              {processing && (
                <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-foreground" />
                  <span className="text-xs font-bold">מעבד תמונה...</span>
                </div>
              )}
              <canvas
                ref={canvasRef}
                width={SIZE}
                height={SIZE}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="touch-none"
              />
              {activeTab === "crop" && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/20" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Crop controls */}
            {activeTab === "crop" && (
              <>
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
                  {processedUrl && (
                    <button onClick={() => { setProcessedUrl(null); }}
                      className="h-9 px-4 rounded-xl bg-muted text-sm font-bold flex items-center gap-1.5 hover:bg-muted/80 transition-all active:scale-95">
                        ↩️ מקור
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Background controls */}
            {activeTab === "background" && (
              <div className="w-full space-y-3">
                {/* Remove background button */}
                <button
                  onClick={handleRemoveBg}
                  disabled={processing}
                  className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-2 border-dashed border-muted-foreground/30 hover:border-foreground/40 bg-muted/50 hover:bg-muted`}
                >
                  <Eraser className="w-4 h-4" />
                  🪄 הסרת רקע (AI)
                </button>

                {/* Preset backgrounds */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">🎨 החלפת רקע מוכן:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {BG_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handleReplaceBg(preset.value)}
                        disabled={processing}
                        className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-muted/60 transition-all active:scale-95 group"
                      >
                        <div
                          className="w-10 h-10 rounded-lg border-2 border-muted group-hover:border-foreground/30 transition-colors shadow-sm"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="text-[10px] font-bold text-muted-foreground">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom prompt */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">✍️ רקע מותאם אישית:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customBgPrompt}
                      onChange={(e) => setCustomBgPrompt(e.target.value)}
                      placeholder="תארו את הרקע... (אנגלית עדיפה)"
                      className="flex-1 h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-foreground/30"
                      dir="rtl"
                    />
                    <button
                      onClick={() => {
                        if (customBgPrompt.trim()) handleReplaceBg(customBgPrompt.trim());
                      }}
                      disabled={processing || !customBgPrompt.trim()}
                      className={`h-10 px-4 rounded-xl font-bold text-sm ${accent} text-primary-foreground shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5`}
                    >
                      <ImagePlus className="w-4 h-4" /> החלף
                    </button>
                  </div>
                </div>

                {processedUrl && (
                  <button onClick={() => setProcessedUrl(null)}
                    className="w-full h-9 rounded-xl bg-muted text-sm font-bold hover:bg-muted/80 transition-all active:scale-95">
                    ↩️ חזרה לתמונה המקורית
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-muted flex gap-2">
          <button onClick={onClose}
            className="flex-1 h-11 rounded-xl font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-all active:scale-95">
            ביטול
          </button>
          <button onClick={handleSave} disabled={processing}
            className={`flex-1 h-11 rounded-xl font-bold text-sm ${accent} text-primary-foreground shadow-md hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50`}>
            <Check className="w-4 h-4" /> שמירה
          </button>
        </div>
      </div>
    </div>
  );
}
