import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { SlideshowConfig, SlideTransition } from "@/lib/familyThemes";

interface SlideshowProps {
  photos: { url: string; caption?: string | null }[];
  config: SlideshowConfig;
  onOpenCollage?: () => void;
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function transitionClass(t: SlideTransition, active: boolean): string {
  if (!active) return "opacity-0 pointer-events-none";
  switch (t) {
    case "fade":      return "opacity-100 animate-fade-in";
    case "slide":     return "opacity-100 animate-slide-in-right";
    case "zoom":      return "opacity-100 animate-scale-in";
    case "ken-burns": return "opacity-100 animate-ken-burns";
  }
}

export default function FamilySlideshow({ photos, config, onOpenCollage }: SlideshowProps) {
  const ordered = useMemo(() => config.shuffle ? shuffleArr(photos) : photos, [photos, config.shuffle]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset on photos change
  useEffect(() => { setIdx(0); }, [ordered.length]);

  // Auto-cycle
  useEffect(() => {
    if (paused || ordered.length <= 1) return;
    const id = window.setInterval(() => {
      setIdx(i => (i + 1) % ordered.length);
    }, Math.max(1500, config.intervalMs));
    return () => clearInterval(id);
  }, [paused, ordered.length, config.intervalMs]);

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  };
  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  if (ordered.length === 0) return null;

  const next = () => setIdx(i => (i + 1) % ordered.length);
  const prev = () => setIdx(i => (i - 1 + ordered.length) % ordered.length);
  const current = ordered[idx];

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-3xl bg-black shadow-2xl ${
        fullscreen ? "w-screen h-screen rounded-none" : "aspect-[16/10] w-full"
      }`}
    >
      {/* Stacked images for transition */}
      {ordered.map((p, i) => (
        <div
          key={`${p.url}-${i}`}
          className={`absolute inset-0 transition-opacity duration-700 ${transitionClass(config.transition, i === idx)}`}
        >
          <img
            src={p.url}
            alt={p.caption ?? ""}
            className={`w-full h-full ${config.transition === "ken-burns" ? "object-cover scale-110" : "object-cover"}`}
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Caption */}
      {config.showCaption && current.caption && (
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white text-center">
          <p className="text-lg sm:text-2xl font-bold drop-shadow-lg">{current.caption}</p>
        </div>
      )}

      {/* Counter pill */}
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
        {idx + 1} / {ordered.length}
      </div>

      {/* Controls — visible on hover or always on small screens */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm"
          aria-label="הקודם"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm"
          aria-label="הבא"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <button
            onClick={() => setPaused(p => !p)}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm"
            aria-label={paused ? "הפעל" : "השהה"}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm"
            aria-label="מסך מלא"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress dots */}
      {ordered.length <= 12 && (
        <div className="absolute top-3 left-3 flex gap-1">
          {ordered.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
              aria-label={`עבור לתמונה ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
