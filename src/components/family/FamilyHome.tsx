import { useEffect, useRef, useState } from "react";
import { Plus, Sparkles, Heart, Image as ImageIcon, Settings2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFamilyCollages } from "@/hooks/useFamilyCollages";
import CollageView from "./CollageView";
import FamilyThemePicker from "./FamilyThemePicker";
import FamilyDecorations from "./FamilyDecorations";
import FamilySlideshow from "./FamilySlideshow";
import FamilyQuoteRotator from "./FamilyQuoteRotator";
import BirthdayHearts from "./BirthdayHearts";
import FamilyCodeManager from "./FamilyCodeManager";
import { useFamily } from "@/hooks/useFamily";
import { useAuth } from "@/hooks/useAuth";
import {
  loadFamilyTheme, FamilyTheme, loadHomeCollageId, saveHomeCollageId,
  loadGlobalHomeCollageId, saveGlobalHomeCollageId,
  loadSlideshowConfig, saveSlideshowConfig, SlideshowConfig, normalizeSlideshowConfig, resetSlideshowConfig,
} from "@/lib/familyThemes";
import { FloatEnvironment, FloatPresetId, FloatingEffect, HeartsDisplayStyle, getFloatPresetPatch, hasSavedHeartsConfig, HEARTS_CONFIG_UPDATED_EVENT, loadHeartsConfig, saveHeartsConfig } from "@/lib/heartsDisplayConfig";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface FamilyHomeProps {
  externalFamilyCodeOpen?: boolean;
  onFamilyCodeOpenChange?: (open: boolean) => void;
  externalThemePickerOpen?: boolean;
  onThemePickerOpenChange?: (open: boolean) => void;
}

export default function FamilyHome({
  externalFamilyCodeOpen,
  onFamilyCodeOpenChange,
  externalThemePickerOpen,
  onThemePickerOpenChange,
}: FamilyHomeProps) {
  const { user, isAdmin } = useAuth();
  const familyCtx = useFamily();
  const { collages, loading, createCollage, updateCollage, deleteCollage, joinByCode, deviceId } = useFamilyCollages(familyCtx.familyDeviceIds);
  const bootstrappingHomeRef = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [homeCollageId, setHomeCollageId] = useState<string | null>(() => loadHomeCollageId());
  const [theme, setTheme] = useState<FamilyTheme>(() => loadFamilyTheme());
  const [homePreviewPhotos, setHomePreviewPhotos] = useState<{ url: string; caption: string | null; media_type: string; thumbnail_url: string | null }[]>([]);
  const [slideshow, setSlideshow] = useState<SlideshowConfig>(() => loadSlideshowConfig());
  const [pageClock, setPageClock] = useState(() => new Date());
  const [quickAnimOpen, setQuickAnimOpen] = useState(false);
  const [animCfg, setAnimCfg] = useState(() => loadHeartsConfig());
  const isMobile = useIsMobile();
  const [manualPhotoIdx, setManualPhotoIdx] = useState(0);

  const applyAnimationPreset = (preset: FloatPresetId) => {
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;

    const next = {
      ...loadHeartsConfig(),
      floatPreset: preset,
      ...getFloatPresetPatch(preset, {
        isMobile,
        prefersReducedMotion: prefersReduced,
        lowPowerDevice: lowPower,
      }),
    };
    setAnimCfg(next);
    saveHeartsConfig(next);
  };

  const updateAnimCfg = (patch: Partial<typeof animCfg>) => {
    const explicitPreset = (patch as { floatPreset?: typeof animCfg.floatPreset }).floatPreset;
    const next = {
      ...animCfg,
      ...patch,
      floatPreset: explicitPreset ?? "custom",
    };
    setAnimCfg(next);
    saveHeartsConfig(next);
  };

  const isSchemaMismatchError = (err: any) => {
    const text = `${err?.message ?? ""} ${err?.details ?? ""} ${err?.hint ?? ""}`.toLowerCase();
    return text.includes("does not exist") || text.includes("column") || text.includes("relation");
  };

  const saveCloudSlideshow = async (cfg: SlideshowConfig) => {
    if (!user) return;
    const { error } = await (supabase as any).from("user_preferences").upsert({
      user_id: user.id,
      slideshow_config: cfg as unknown as Json,
      updated_at: cfg.updatedAt,
    });
    if (error && !isSchemaMismatchError(error)) throw error;
  };

  const persistSlideshow = async (nextInput: SlideshowConfig, options?: { touchUpdatedAt?: boolean }) => {
    const touchUpdatedAt = options?.touchUpdatedAt !== false;
    const next = normalizeSlideshowConfig({
      ...nextInput,
      updatedAt: touchUpdatedAt ? new Date().toISOString() : nextInput.updatedAt,
    });

    saveSlideshowConfig(next, { touchUpdatedAt: false });
    setSlideshow(next);
    await saveCloudSlideshow(next);
  };

  const resetSlideshowPreferences = async () => {
    const next = resetSlideshowConfig();
    setSlideshow(next);
    saveSlideshowConfig(next, { touchUpdatedAt: false });
    await saveCloudSlideshow(next);
    toast.success("העדפות הסליידשואו אופסו");
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const localCfg = loadSlideshowConfig();
      const { data, error } = await (supabase as any)
        .from("user_preferences")
        .select("slideshow_config, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        if (!isSchemaMismatchError(error)) console.warn("slideshow cloud sync read failed", error);
        return;
      }

      const rawCloud = (data?.slideshow_config ?? null) as Partial<SlideshowConfig> | null;
      if (!rawCloud) {
        await saveCloudSlideshow(localCfg);
        return;
      }

      const cloudCfg = normalizeSlideshowConfig(rawCloud);
      const localTs = Date.parse(localCfg.updatedAt || "");
      const cloudTs = Date.parse(cloudCfg.updatedAt || (data?.updated_at ?? ""));
      const useCloud = Number.isFinite(cloudTs) && (!Number.isFinite(localTs) || cloudTs >= localTs);

      if (useCloud) {
        saveSlideshowConfig(cloudCfg, { touchUpdatedAt: false });
        setSlideshow(cloudCfg);
      } else {
        await saveCloudSlideshow(localCfg);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const applyHomeCollage = async (id: string | null, options?: { followHomeInSlideshow?: boolean }) => {
    // Always save locally
    saveHomeCollageId(id);
    setHomeCollageId(id);

    // Admin: also save globally to families table
    if (isAdmin && familyCtx.family?.id) {
      const ok = await saveGlobalHomeCollageId(familyCtx.family.id, id);
      if (ok && id) toast.success("הקולאז׳ נשמר כברירת מחדל לכולם");
    }

    if (options?.followHomeInSlideshow) {
      const next = { ...slideshow, enabled: true, autoStart: true, collageId: null };
      void persistSlideshow(next);
    }
  };

  // Apply theme to body so it covers the entire page (under the icons too)
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = theme.background;
    return () => { document.body.style.background = prev; };
  }, [theme.background]);

  const photoCollages = collages.filter((c) => !c.is_folder);

  // Create a real, editable "Home" collage if there are no collages yet.
  useEffect(() => {
    if (loading || bootstrappingHomeRef.current) return;
    if (!user) return;
    if (photoCollages.length > 0) return;

    bootstrappingHomeRef.current = true;
    (async () => {
      try {
        const created = await createCollage({ name: "דף הבית", emoji: "🏠" });
        applyHomeCollage(created.id);
      } catch {
        toast.error("שגיאה ביצירת קולאז׳ דף הבית");
      } finally {
        bootstrappingHomeRef.current = false;
      }
    })();
  }, [loading, photoCollages.length, createCollage, user]);

  // Load global home collage from cloud (families table), then fall back to local
  useEffect(() => {
    if (loading) return;
    const familyId = familyCtx.family?.id;
    
    (async () => {
      // Try loading global setting from families table
      let globalId: string | null = null;
      if (familyId) {
        globalId = await loadGlobalHomeCollageId(familyId);
      }

      // Local override from localStorage
      const localId = loadHomeCollageId();
      
      // Priority: local override > global > auto-detect
      const effectiveId = localId || globalId;

      const namedHomeId = photoCollages.find((c) => c.name.trim() === "דף הבית")?.id ?? null;
      const firstPhotoCollageId = photoCollages[0]?.id ?? null;

      if (effectiveId && photoCollages.some((c) => c.id === effectiveId)) {
        if (homeCollageId !== effectiveId) {
          setHomeCollageId(effectiveId);
          saveHomeCollageId(effectiveId);
        }
        return;
      }

      // Fallback: auto-detect
      const fallback = namedHomeId ?? firstPhotoCollageId;
      if (fallback && homeCollageId !== fallback) {
        setHomeCollageId(fallback);
        saveHomeCollageId(fallback);
      }
    })();
  }, [loading, photoCollages, familyCtx.family?.id]);

  useEffect(() => {
    if (!slideshow.collageId) return;
    if (photoCollages.some((c) => c.id === slideshow.collageId)) return;

    const next = { ...slideshow, collageId: null };
    void persistSlideshow(next);
  }, [slideshow, photoCollages]);

  useEffect(() => {
    if (!slideshow.showClock) return;
    const timer = window.setInterval(() => setPageClock(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, [slideshow.showClock]);

  useEffect(() => {
    if (hasSavedHeartsConfig()) return;
    applyAnimationPreset("balanced");
  }, [isMobile]);

  useEffect(() => {
    const sync = () => setAnimCfg(loadHeartsConfig());
    window.addEventListener(HEARTS_CONFIG_UPDATED_EVENT, sync);
    return () => window.removeEventListener(HEARTS_CONFIG_UPDATED_EVENT, sync);
  }, []);

  const homeCollage = photoCollages.find(c => c.id === homeCollageId);

  // Determine the source collage for slideshow & preview (slideshow can override)
  const fallbackSlideshowCollageId = photoCollages[0]?.id ?? null;
  const slideshowCollageId = slideshow.collageId ?? homeCollageId ?? fallbackSlideshowCollageId;
  const displayCollageId = slideshow.enabled ? slideshowCollageId : homeCollageId;
  const displayCollage = photoCollages.find((c) => c.id === displayCollageId);

  // Load preview photos for the active display collage
  useEffect(() => {
    if (!displayCollageId) { setHomePreviewPhotos([]); return; }
    let cancelled = false;
    (async () => {
      const limit = slideshow.enabled ? 50 : 9;
      const { data } = await supabase
        .from("family_photos")
        .select("image_url, caption, media_type, thumbnail_url")
        .eq("collage_id", displayCollageId)
        .order("sort_order", { ascending: true })
        .limit(limit);
      if (!cancelled) {
        setHomePreviewPhotos((data ?? []).map((p: any) => ({
          url: p.image_url,
          caption: p.caption,
          media_type: p.media_type ?? "image",
          thumbnail_url: p.thumbnail_url ?? null,
        })));
      }
    })();
    return () => { cancelled = true; };
  }, [activeId, displayCollageId, slideshow.enabled]);

  // Reset manual photo index when photos change
  useEffect(() => { setManualPhotoIdx(0); }, [displayCollageId]);

  const active = collages.find(c => c.id === activeId);
  if (active) {
    const canEditActive = !!user && (isAdmin || active.owner_user_id === user.id);
    return <CollageView collage={active} onBack={() => setActiveId(null)} onUpdateCollage={updateCollage} canEdit={canEditActive} />;
  }

  const handleCreate = async (partial?: Partial<typeof collages[0]>) => {
    if (!user) {
      toast.error("יש להתחבר כדי ליצור קולאז׳");
      throw new Error("auth-required");
    }
    try {
      const c = await createCollage({ name: `קולאז׳ ${collages.length + 1}`, ...partial });
      if (!homeCollageId || !photoCollages.some((item) => item.id === homeCollageId)) {
        applyHomeCollage(c.id);
      }
      setActiveId(c.id);
      return c;
    } catch {
      toast.error("שגיאה ביצירת קולאז׳");
      throw new Error("create failed");
    }
  };

  const isDark = theme.id === "night";

  return (
    <div className="min-h-screen relative">
      <FamilyDecorations type={theme.decoration ?? "none"} />

      {/* Family code manager — rendered hidden, controlled externally via sidebar */}
      <FamilyCodeManager
        family={familyCtx.family}
        members={familyCtx.members}
        isAdmin={isAdmin || familyCtx.isAdmin}
        deviceId={familyCtx.deviceId}
        onCreateFamily={familyCtx.createFamily}
        onJoinByCode={familyCtx.joinByCode}
        onLeaveFamily={familyCtx.leaveFamily}
        onUpdateNickname={familyCtx.updateNickname}
        hideTrigger
        externalOpen={externalFamilyCodeOpen}
        onExternalOpenChange={onFamilyCodeOpenChange}
      />

      {/* Theme/Collages — rendered hidden, controlled externally via sidebar */}
      <FamilyThemePicker
        current={theme}
        onChange={setTheme}
        collages={collages}
        deviceId={deviceId}
        homeCollageId={homeCollageId}
        onSetHomeCollage={(id) => applyHomeCollage(id, { followHomeInSlideshow: true })}
        onOpenCollage={(id) => setActiveId(id)}
        onCreateCollage={handleCreate}
        onDeleteCollage={deleteCollage}
        onJoinByCode={joinByCode}
        isAdmin={!!user}
        slideshow={slideshow}
        onSlideshowChange={(cfg) => { void persistSlideshow(cfg); }}
        onResetSlideshow={resetSlideshowPreferences}
        hideTrigger
        externalOpen={externalThemePickerOpen}
        onExternalOpenChange={onThemePickerOpenChange}
      />

      <div className="relative z-10 pt-16 pb-6 px-3 max-w-6xl mx-auto">
        {/* Compact hero header */}
        <header className="text-center mb-4">
          <h1 className={`text-2xl sm:text-3xl font-extrabold flex items-center justify-center gap-2 ${isDark ? "text-white" : "text-foreground"} drop-shadow-sm`}>
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500 animate-pulse" />
            בית משפחת טננבאום
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
        </header>

        {/* 3-column hero layout: events | media | slideshow controls */}
        <div className="flex flex-col lg:flex-row gap-3 items-start">

          {/* LEFT: Event icons */}
          <div className="w-full lg:w-56 shrink-0">
            <BirthdayHearts isDark={isDark} familyDeviceIds={familyCtx.familyDeviceIds} />
          </div>

          {/* CENTER: Main photo/slideshow area */}
          <div className="flex-1 min-w-0">
            {loading && <div className="text-center text-foreground/60 py-12">טוען…</div>}

            {/* Empty state */}
            {!loading && collages.length === 0 && (
              <div
                className="rounded-3xl p-8 sm:p-12 text-center shadow-xl backdrop-blur-md border border-white/40"
                style={{ background: theme.cardBg }}
              >
                <div className="text-7xl mb-4 inline-block animate-float">📸</div>
                <h2 className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-foreground"}`}>
                  בואו נתחיל לבנות יחד!
                </h2>
                <p className={`mb-6 ${isDark ? "text-white/80" : "text-foreground/70"}`}>
                  צרו את הקולאז׳ המשפחתי הראשון, או הצטרפו לקולאז׳ קיים עם קוד שיתוף.
                </p>
                <Button
                  onClick={() => handleCreate()}
                  size="lg"
                  className="rounded-full shadow-lg text-base px-7 h-14"
                  style={{ background: theme.accent, color: "white" }}
                >
                  <Plus className="w-5 h-5 ml-1" /> צור קולאז׳ ראשון
                </Button>
              </div>
            )}

            {/* Media display */}
            {!loading && displayCollage && (
              <div>
                {slideshow.enabled && slideshow.autoStart && slideshow.showClock && homePreviewPhotos.length > 0 && (
                  <div className="mb-2 flex justify-start">
                    <div className="bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm font-mono">
                      {pageClock.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                )}
                {slideshow.enabled && slideshow.autoStart && homePreviewPhotos.length > 0 ? (
                  <FamilySlideshow
                    photos={homePreviewPhotos}
                    config={slideshow}
                    onOpenCollage={() => {}}
                    onConfigChange={(cfg) => { void persistSlideshow(cfg); }}
                  />
                ) : homePreviewPhotos.length > 0 ? (
                  <div className="relative rounded-3xl overflow-hidden shadow-xl backdrop-blur-md border border-white/40" style={{ background: theme.cardBg }}>
                    {/* Single large photo with nav arrows */}
                    <div className="aspect-video relative">
                      {(() => {
                        const p = homePreviewPhotos[manualPhotoIdx] ?? homePreviewPhotos[0];
                        return p.media_type === "video" ? (
                          p.thumbnail_url
                            ? <img src={p.thumbnail_url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
                            : <video src={p.url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                        ) : (
                          <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
                        );
                      })()}
                      {/* Arrows */}
                      {homePreviewPhotos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setManualPhotoIdx((i) => (i - 1 + homePreviewPhotos.length) % homePreviewPhotos.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualPhotoIdx((i) => (i + 1) % homePreviewPhotos.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          {/* Dot indicators */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {homePreviewPhotos.slice(0, 12).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setManualPhotoIdx(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === manualPhotoIdx % homePreviewPhotos.length ? "bg-white w-3" : "bg-white/50"}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Caption */}
                    {homePreviewPhotos[manualPhotoIdx]?.caption && (
                      <div className={`px-4 py-2 text-sm font-medium text-center ${isDark ? "text-white/80" : "text-foreground/70"}`}>
                        {homePreviewPhotos[manualPhotoIdx].caption}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="rounded-3xl py-12 px-6 text-center shadow-xl backdrop-blur-md border border-white/40"
                    style={{ background: theme.cardBg }}
                  >
                    <ImageIcon className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-white/40" : "text-foreground/40"}`} />
                    <p className={`font-bold ${isDark ? "text-white/80" : "text-foreground/70"}`}>אין עדיין תמונות בקולאז׳ הזה</p>
                    <p className={`text-xs mt-2 ${isDark ? "text-white/50" : "text-foreground/50"}`}>
                      לחץ על האייקון 🎨 למעלה כדי לפתוח ולערוך
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quote rotator below media */}
            {!loading && <div className="mt-3"><FamilyQuoteRotator isDark={isDark} /></div>}
          </div>

          {/* RIGHT: Slideshow controls */}
          <div className={`w-full lg:w-52 shrink-0 rounded-2xl border p-3 space-y-2 ${isDark ? "bg-white/5 border-white/15" : "bg-white/70 border-white/80"}`}>
            <div className={`text-xs font-black ${isDark ? "text-white" : "text-foreground"}`}>אפשרויות תצוגה</div>

            {/* Slideshow toggle */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isDark ? "text-white/80" : "text-foreground/80"}`}>סליידשואו</span>
              <button
                type="button"
                onClick={() => { void persistSlideshow({ ...slideshow, enabled: !slideshow.enabled, autoStart: !slideshow.enabled }); }}
                className={`w-10 h-6 rounded-full transition-all relative ${slideshow.enabled ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${slideshow.enabled ? "right-0.5" : "right-4"}`} />
              </button>
            </div>

            {/* Show clock toggle */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isDark ? "text-white/80" : "text-foreground/80"}`}>שעון</span>
              <button
                type="button"
                onClick={() => { void persistSlideshow({ ...slideshow, showClock: !slideshow.showClock }); }}
                className={`w-10 h-6 rounded-full transition-all relative ${slideshow.showClock ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${slideshow.showClock ? "right-0.5" : "right-4"}`} />
              </button>
            </div>

            {/* Speed slider */}
            {slideshow.enabled && (
              <div>
                <div className={`flex items-center justify-between text-[11px] mb-1 ${isDark ? "text-white/75" : "text-muted-foreground"}`}>
                  <span>{slideshow.intervalSec ?? 5}s</span>
                  <span>מהירות מעבר</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={1}
                  value={slideshow.intervalSec ?? 5}
                  onChange={(e) => { void persistSlideshow({ ...slideshow, intervalSec: Number(e.target.value) }); }}
                  className="w-full"
                />
              </div>
            )}

            <div className={`border-t pt-2 ${isDark ? "border-white/10" : "border-muted"}`} />
            <div className={`text-[11px] font-black ${isDark ? "text-white" : "text-foreground"}`}>אנימציות</div>

            {/* Animation presets */}
            <div className="grid grid-cols-3 gap-1">
              {([
                { id: "soft" as FloatPresetId, label: "עדין" },
                { id: "balanced" as FloatPresetId, label: "מאוזן" },
                { id: "rich" as FloatPresetId, label: "עשיר" },
              ]).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyAnimationPreset(preset.id)}
                  className={`text-[10px] font-bold rounded-lg border px-1 py-1 ${
                    animCfg.floatPreset === preset.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : `${isDark ? "bg-white/5 border-white/15 text-white" : "bg-background hover:bg-muted/50"}`
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Reduced motion toggle */}
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isDark ? "text-white/80" : "text-foreground/80"}`}>תנועה מופחתת</span>
              <button
                type="button"
                onClick={() => updateAnimCfg({ reducedMotion: !animCfg.reducedMotion })}
                className={`w-10 h-6 rounded-full transition-all relative ${animCfg.reducedMotion ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${animCfg.reducedMotion ? "right-0.5" : "right-4"}`} />
              </button>
            </div>

            {/* Environment picker */}
            <div>
              <div className={`text-[11px] mb-1 ${isDark ? "text-white/75" : "text-muted-foreground"}`}>סביבה</div>
              <div className="flex flex-wrap gap-1">
                {([
                  { id: "theme" as FloatEnvironment, label: "🎨" },
                  { id: "hearts" as FloatEnvironment, label: "❤️" },
                  { id: "stars" as FloatEnvironment, label: "⭐" },
                  { id: "confetti" as FloatEnvironment, label: "🎉" },
                  { id: "bubbles" as FloatEnvironment, label: "🫧" },
                  { id: "snow" as FloatEnvironment, label: "❄️" },
                  { id: "petals" as FloatEnvironment, label: "🌸" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateAnimCfg({ floatEnvironment: opt.id })}
                    className={`px-1.5 py-0.5 text-xs rounded border ${
                      (animCfg.floatEnvironment ?? "theme") === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : `${isDark ? "bg-white/5 border-white/15" : "bg-background"}`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
