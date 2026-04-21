import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Pause, Play, ChevronLeft, ChevronRight, Maximize2, Minimize2, Volume2, VolumeX, Settings2, X } from "lucide-react";
import { SlideshowConfig, SlideTransition, saveSlideshowConfig } from "@/lib/familyThemes";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SlideItem {
  url: string;
  caption?: string | null;
  media_type?: string;
  thumbnail_url?: string | null;
}

interface SlideshowProps {
  photos: SlideItem[];
  config: SlideshowConfig;
  onOpenCollage?: () => void;
  onConfigChange?: (cfg: SlideshowConfig) => void;
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

function formatTime(d: Date): string {
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export default function FamilySlideshow({ photos, config, onOpenCollage, onConfigChange }: SlideshowProps) {
  const ordered = useMemo(() => config.shuffle ? shuffleArr(photos) : photos, [photos, config.shuffle]);
  const [idx, setIdx] = useState(() => Math.max(0, config.lastSlideIndex || 0));
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(config.mediaMuted !== false);
  const [showSettings, setShowSettings] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [ended, setEnded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const current = ordered[idx];
  const isVideo = current?.media_type === "video";

  // Clock tick
  useEffect(() => {
    if (!config.showClock) return;
    const id = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(id);
  }, [config.showClock]);

  // Background music
  useEffect(() => {
    if (!config.bgMusicUrl) {
      if (bgAudioRef.current) { bgAudioRef.current.pause(); bgAudioRef.current = null; }
      return;
    }
    if (!bgAudioRef.current || bgAudioRef.current.src !== config.bgMusicUrl) {
      bgAudioRef.current?.pause();
      const audio = new Audio(config.bgMusicUrl);
      audio.loop = true;
      audio.volume = config.bgMusicVolume;
      bgAudioRef.current = audio;
      if (!paused) audio.play().catch(() => {});
    }
    return () => { bgAudioRef.current?.pause(); };
  }, [config.bgMusicUrl]);

  // Update bg music volume
  useEffect(() => {
    if (bgAudioRef.current) bgAudioRef.current.volume = config.bgMusicVolume;
  }, [config.bgMusicVolume]);

  // Pause/resume bg music
  useEffect(() => {
    if (!bgAudioRef.current) return;
    if (paused) bgAudioRef.current.pause();
    else bgAudioRef.current.play().catch(() => {});
  }, [paused]);

  // Keep index in bounds when source changes
  useEffect(() => {
    const maxIndex = Math.max(0, ordered.length - 1);
    setIdx((prev) => Math.min(prev, maxIndex));
    setEnded(false);
  }, [ordered.length]);

  useEffect(() => {
    setMuted(config.mediaMuted !== false);
  }, [config.mediaMuted]);

  useEffect(() => {
    if (config.lastSlideIndex !== idx) {
      const next = { ...config, lastSlideIndex: idx };
      saveSlideshowConfig(next);
      onConfigChange?.(next);
    }
  }, [idx, config, onConfigChange]);

  const advance = useCallback(() => {
    if (idx >= ordered.length - 1 && !config.loop) {
      setEnded(true);
      setPaused(true);
      return;
    }
    setIdx(i => (i + 1) % ordered.length);
  }, [idx, ordered.length, config.loop]);

  // Auto-cycle for images
  useEffect(() => {
    if (paused || ordered.length <= 1 || isVideo || ended) return;
    const id = window.setInterval(advance, Math.max(1500, config.intervalMs));
    return () => clearInterval(id);
  }, [paused, ordered.length, config.intervalMs, isVideo, idx, advance, ended]);

  // Video max duration
  useEffect(() => {
    if (!isVideo || !videoRef.current || paused || config.videoMaxMs === 0) return;
    const id = window.setTimeout(() => { if (!paused) advance(); }, config.videoMaxMs);
    return () => clearTimeout(id);
  }, [isVideo, idx, paused, config.videoMaxMs, advance]);

  // When pausing on a video, pause it; on resume, play it
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

  const updateConfig = (patch: Partial<SlideshowConfig>) => {
    const next = { ...config, ...patch };
    saveSlideshowConfig(next);
    onConfigChange?.(next);
  };

  if (ordered.length === 0) return null;

  const next = () => { setEnded(false); setIdx(i => (i + 1) % ordered.length); };
  const prev = () => { setEnded(false); setIdx(i => (i - 1 + ordered.length) % ordered.length); };

  const displayCaption = current?.caption || (config.autoCaptions ? `תמונה ${idx + 1} מתוך ${ordered.length}` : null);

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
                  poster={p.thumbnail_url ?? undefined}
                  className="w-full h-full object-cover bg-black"
                  autoPlay
                  muted={muted}
                  playsInline
                  preload="metadata"
                  onEnded={() => { if (!paused) advance(); }}
                  onError={() => { if (!paused) setTimeout(advance, 800); }}
                />
              ) : p.thumbnail_url ? (
                <img src={p.thumbnail_url} alt={p.caption ?? ""} className="w-full h-full object-cover" loading="lazy" />
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
      {config.showCaption && displayCaption && (
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white text-center">
          <p className="text-lg sm:text-2xl font-bold drop-shadow-lg">{displayCaption}</p>
        </div>
      )}

      {/* Clock overlay */}
      {config.showClock && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm font-mono">
          {formatTime(clock)}
        </div>
      )}

      {/* Counter pill */}
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
        {isVideo && <span>🎬</span>}
        <span>{idx + 1} / {ordered.length}</span>
      </div>

      {/* Ended overlay */}
      {ended && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <button
            onClick={() => { setEnded(false); setPaused(false); setIdx(0); }}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full px-6 py-3 backdrop-blur-sm font-bold text-lg flex items-center gap-2"
          >
            <Play className="w-6 h-6" /> התחל מחדש
          </button>
        </div>
      )}

      {/* Controls — visible on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm" aria-label="הקודם">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm" aria-label="הבא">
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <button onClick={() => setPaused(p => !p)} className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm" aria-label={paused ? "הפעל" : "השהה"}>
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          {ordered.some(p => p.media_type === "video") && (
            <button
              onClick={() => {
                setMuted((prev) => {
                  const nextMuted = !prev;
                  updateConfig({ mediaMuted: nextMuted });
                  return nextMuted;
                });
              }}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm"
              aria-label={muted ? "הפעל סאונד" : "השתק"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
          <button onClick={toggleFullscreen} className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm" aria-label="מסך מלא">
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {/* Quick settings button */}
          <button onClick={() => setShowSettings(s => !s)} className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm" aria-label="הגדרות">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick settings panel */}
      {showSettings && (
        <div className="absolute bottom-14 left-3 z-30 bg-black/80 backdrop-blur-md text-white rounded-xl p-4 w-72 space-y-3 animate-fade-in" dir="rtl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold">⚙️ הגדרות מהירות</span>
            <button onClick={() => setShowSettings(false)}><X className="w-4 h-4" /></button>
          </div>

          <div>
            <div className="flex justify-between text-[11px]">
              <span>🖼️ משך תמונה</span>
              <span className="font-mono">{(config.intervalMs / 1000).toFixed(1)}s</span>
            </div>
            <Slider value={[config.intervalMs]} min={1500} max={30000} step={500}
              onValueChange={([v]) => updateConfig({ intervalMs: v })} className="mt-1" />
          </div>

          <div>
            <div className="flex justify-between text-[11px]">
              <span>🎬 מקס׳ סרטון</span>
              <span className="font-mono">{config.videoMaxMs === 0 ? "∞" : `${(config.videoMaxMs / 1000).toFixed(0)}s`}</span>
            </div>
            <Slider value={[config.videoMaxMs]} min={0} max={120000} step={5000}
              onValueChange={([v]) => updateConfig({ videoMaxMs: v })} className="mt-1" />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-white">🔁 לופ</Label>
            <Switch checked={config.loop} onCheckedChange={(v) => updateConfig({ loop: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-white">🕐 שעון</Label>
            <Switch checked={config.showClock} onCheckedChange={(v) => updateConfig({ showClock: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-white">📝 כיתובים</Label>
            <Switch checked={config.showCaption} onCheckedChange={(v) => updateConfig({ showCaption: v })} />
          </div>
        </div>
      )}

      {/* Progress dots */}
      {ordered.length <= 12 && (
        <div className="absolute top-3 left-3 flex gap-1">
          {ordered.map((_, i) => (
            <button
              key={i}
              onClick={() => { setEnded(false); setIdx(i); }}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
              aria-label={`עבור לפריט ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
