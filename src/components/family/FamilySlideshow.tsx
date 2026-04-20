import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, ChevronLeft, ChevronRight, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { SlideshowConfig, SlideTransition } from "@/lib/familyThemes";

interface SlideItem {
  url: string;
  caption?: string | null;
  media_type?: string; // 'image' | 'video'
}

interface SlideshowProps {
  photos: SlideItem[];
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
  const [muted, setMuted] = useState(true); // user opt-in to sound (browser autoplay policy)
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = ordered[idx];
  const isVideo = current?.media_type === "video";

  // Reset on photos change
  useEffect(() => { setIdx(0); }, [ordered.length]);

  // Auto-cycle for IMAGES only. Videos advance on `onEnded`.
  useEffect(() => {
    if (paused || ordered.length <= 1 || isVideo) return;
    const id = window.setInterval(() => {
      setIdx(i => (i + 1) % ordered.length);
    }, Math.max(1500, config.intervalMs));
    return () => clearInterval(id);
  }, [paused, ordered.length, config.intervalMs, isVideo, idx]);

  // When pausing on a video, pause it; on resume, play it.
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    if (paused) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  }, [paused, isVideo, idx]);

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

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-3xl bg-black shadow-2xl ${
        fullscreen ? "w-screen h-screen rounded-none" : "aspect-[16/10] w-full"
      }`}
    >
      {/* Stacked items for transition */}
      {ordered.map((p, i) => {
        const itemIsVideo = p.media_type === "video";
        const isActive = i === idx;
        return (
          <div
            key={`${p.url}-${i}`}
            className={`absolute inset-0 transition-opacity duration-700 ${transitionClass(config.transition, isActive)}`}
          >
            {itemIsVideo ? (
              isActive ? (
                <video
                  ref={videoRef}
                  src={p.url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted={muted}
                  playsInline
                  preload="metadata"
                  onEnded={() => { if (!paused) next(); }}
                  onError={() => { if (!paused) setTimeout(next, 800); }}
                />
              ) : null
            ) : (
              <img
                src={p.url}
                alt={p.caption ?? ""}
                className={`w-full h-full ${config.transition === "ken-burns" ? "object-cover scale-110" : "object-cover"}`}
                loading={i === 0 ? "eager" : "lazy"}
              />
            )}
          </div>
        );
      })}

      {/* Caption */}
      {config.showCaption && current.caption && (
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white text-center">
          <p className="text-lg sm:text-2xl font-bold drop-shadow-lg">{current.caption}</p>
        </div>
      )}

      {/* Counter pill */}
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
        {isVideo && <span>🎬</span>}
        <span>{idx + 1} / {ordered.length}</span>
      </div>

      {/* Controls — visible on hover */}
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
          {/* Sound toggle — relevant when there's at least one video in the playlist */}
          {ordered.some(p => p.media_type === "video") && (
            <button
              onClick={() => setMuted(m => !m)}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm"
              aria-label={muted ? "הפעל סאונד" : "השתק"}
              title={muted ? "הפעל סאונד" : "השתק"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
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
              aria-label={`עבור לפריט ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
