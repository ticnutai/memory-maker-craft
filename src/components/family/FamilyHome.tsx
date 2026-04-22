import { useEffect, useRef, useState } from "react";
import { Plus, Sparkles, Heart, Image as ImageIcon, Settings2, X } from "lucide-react";
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

  // ESC to close quick animation panel
  useEffect(() => {
    if (!quickAnimOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickAnimOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quickAnimOpen]);

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

      <div className="fixed bottom-4 left-4 z-30">
        <button
          type="button"
          onClick={() => setQuickAnimOpen((v) => !v)}
          className="h-11 w-11 rounded-full shadow-lg border border-white/40 backdrop-blur bg-white/85 text-foreground flex items-center justify-center hover:scale-105 transition-transform"
          title="שליטה מהירה באנימציות"
        >
          {quickAnimOpen ? <X className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
        </button>

        {quickAnimOpen && (
          <div className="mt-2 w-[290px] max-h-[70vh] overflow-y-auto rounded-2xl border border-white/40 bg-white/90 backdrop-blur-md shadow-xl p-3 space-y-2 text-right">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setQuickAnimOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="סגור"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-xs font-black">שליטה מהירה באנימציות</div>
            </div>

            <button
              type="button"
              onClick={() => applyAnimationPreset("balanced")}
              className="w-full text-xs font-bold rounded-lg border px-2 py-1.5 bg-muted/40 hover:bg-muted/70"
            >
              איזון אוטומטי למכשיר הזה
            </button>

            <div className="grid grid-cols-3 gap-1.5">
              {([
                { id: "soft" as FloatPresetId, label: "עדין" },
                { id: "balanced" as FloatPresetId, label: "מאוזן" },
                { id: "rich" as FloatPresetId, label: "עשיר" },
              ]).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyAnimationPreset(preset.id)}
                  className={`text-[11px] font-bold rounded-lg border px-2 py-1 ${
                    animCfg.floatPreset === preset.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted/50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span>{Math.round((animCfg.floatSizeScale ?? 1) * 100)}%</span>
                <span>גודל</span>
              </div>
              <input type="range" min={0.5} max={2} step={0.1} value={animCfg.floatSizeScale ?? 1} onChange={(e) => updateAnimCfg({ floatSizeScale: Number(e.target.value) })} className="w-full" />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span>{Math.round((animCfg.floatSpeedScale ?? 1) * 100)}%</span>
                <span>מהירות</span>
              </div>
              <input type="range" min={0.4} max={2.5} step={0.1} value={animCfg.floatSpeedScale ?? 1} onChange={(e) => updateAnimCfg({ floatSpeedScale: Number(e.target.value) })} className="w-full" />
            </div>

            <div>
              <div className="text-[11px] mb-1">כיוון</div>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { id: "up" as const, label: "⬆️ למעלה" },
                  { id: "down" as const, label: "⬇️ למטה" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateAnimCfg({ floatDirection: opt.id })}
                    className={`text-[11px] font-bold rounded-lg border px-2 py-1 ${
                      (animCfg.floatDirection ?? "up") === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span>{Math.round((animCfg.floatDensityScale ?? 1) * 100)}%</span>
                <span>צפיפות</span>
              </div>
              <input type="range" min={0.4} max={2.5} step={0.1} value={animCfg.floatDensityScale ?? 1} onChange={(e) => updateAnimCfg({ floatDensityScale: Number(e.target.value) })} className="w-full" />
            </div>

            <div>
              <div className="text-[11px] mb-1">סביבה</div>
              <div className="flex flex-wrap gap-1">
                {([
                  { id: "theme" as FloatEnvironment, label: "🎨" },
                  { id: "hearts" as FloatEnvironment, label: "❤️" },
                  { id: "stars" as FloatEnvironment, label: "⭐" },
                  { id: "confetti" as FloatEnvironment, label: "🎉" },
                  { id: "bubbles" as FloatEnvironment, label: "🫧" },
                  { id: "butterflies" as FloatEnvironment, label: "🦋" },
                  { id: "snow" as FloatEnvironment, label: "❄️" },
                  { id: "petals" as FloatEnvironment, label: "🌸" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateAnimCfg({ floatEnvironment: opt.id })}
                    className={`px-2 py-1 text-xs rounded border ${
                      (animCfg.floatEnvironment ?? "theme") === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display style selector */}
            <div>
              <div className="text-[11px] mb-1">סגנון תצוגה</div>
              <div className="flex flex-wrap gap-1">
                {([
                  { id: "hearts" as HeartsDisplayStyle, label: "❤️ לבבות" },
                  { id: "bubbles" as HeartsDisplayStyle, label: "🫧 בועות" },
                  { id: "floating" as HeartsDisplayStyle, label: "🎈 צפים" },
                  { id: "cards" as HeartsDisplayStyle, label: "🃏 כרטיסים" },
                  { id: "compact" as HeartsDisplayStyle, label: "📋 רשימה" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateAnimCfg({ displayStyle: opt.id })}
                    className={`px-2 py-1 text-[10px] font-bold rounded border ${
                      (animCfg.displayStyle ?? "hearts") === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Floating / full-page options — available for hearts, bubbles, floating */}
            {(animCfg.displayStyle === "floating" || animCfg.displayStyle === "hearts" || animCfg.displayStyle === "bubbles") && (
              <div className="space-y-1.5 rounded-lg border p-2 bg-background/50">
                <div className="text-[11px] font-bold">הגדרות צפים ובלונים</div>

                {/* Full page toggle */}
                {animCfg.displayStyle !== "floating" && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]">🎈 צפים על כל העמוד</span>
                    <button
                      type="button"
                      onClick={() => updateAnimCfg({ floatFullPage: !(animCfg as any).floatFullPage } as any)}
                      className={`w-10 h-6 rounded-full transition-all relative ${(animCfg as any).floatFullPage ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${(animCfg as any).floatFullPage ? "right-0.5" : "right-4"}`} />
                    </button>
                  </div>
                )}

                {/* Draggable toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">🖐️ גרירה חופשית</span>
                  <button
                    type="button"
                    onClick={() => updateAnimCfg({ draggable: (animCfg as any).draggable === false } as any)}
                    className={`w-10 h-6 rounded-full transition-all relative ${(animCfg as any).draggable !== false ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${(animCfg as any).draggable !== false ? "right-0.5" : "right-4"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px]">תנועה עצמאית</span>
                  <button
                    type="button"
                    onClick={() => updateAnimCfg({ floatingIndependent: !animCfg.floatingIndependent } as any)}
                    className={`w-10 h-6 rounded-full transition-all relative ${(animCfg as any).floatingIndependent !== false ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${(animCfg as any).floatingIndependent !== false ? "right-0.5" : "right-4"}`} />
                  </button>
                </div>
                <div className="text-[11px]">אפקטים בלחיצה</div>
                <div className="flex flex-wrap gap-1">
                  {([
                    { id: "sparkles" as FloatingEffect, label: "✨ ניצוצות" },
                    { id: "confetti" as FloatingEffect, label: "🎊 קונפטי" },
                    { id: "pop" as FloatingEffect, label: "🔊 צליל" },
                  ]).map((eff) => {
                    const effects: FloatingEffect[] = (animCfg as any).floatingEffects ?? ["sparkles", "confetti", "pop"];
                    const active = effects.includes(eff.id);
                    return (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => {
                          const cur: FloatingEffect[] = (animCfg as any).floatingEffects ?? ["sparkles", "confetti", "pop"];
                          const next = active ? cur.filter((e) => e !== eff.id) : [...cur, eff.id];
                          updateAnimCfg({ floatingEffects: next } as any);
                        }}
                        className={`px-2 py-1 text-[10px] font-bold rounded border ${
                          active ? "bg-primary text-primary-foreground border-primary" : "bg-background"
                        }`}
                      >
                        {eff.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border px-2 py-1.5 bg-background/70">
              <span className="text-[11px]">תנועה מופחתת</span>
              <button
                type="button"
                onClick={() => updateAnimCfg({ reducedMotion: !animCfg.reducedMotion })}
                className={`w-10 h-6 rounded-full transition-all relative ${animCfg.reducedMotion ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${animCfg.reducedMotion ? "right-0.5" : "right-4"}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 pt-20 pb-12 px-4 max-w-5xl mx-auto">
        {/* Hero header */}
        <header className="text-center mb-8">
          <div className="inline-block mb-3 relative">
            <div className="text-6xl sm:text-7xl animate-float inline-block">🏠</div>
            <Heart className="absolute -top-1 -right-2 w-5 h-5 fill-rose-500 text-rose-500 animate-pulse" />
          </div>
          <h1 className={`text-3xl sm:text-4xl font-extrabold mb-2 ${isDark ? "text-white" : "text-foreground"} drop-shadow-sm`}>
            בית משפחת טננבאום
          </h1>
          <p className={`text-base ${isDark ? "text-white/80" : "text-foreground/70"} flex items-center justify-center gap-1`}>
            <Sparkles className="w-4 h-4" />
            <span>הזיכרונות הכי יפים — יחד</span>
            <Sparkles className="w-4 h-4" />
          </p>
        </header>

        {loading && <div className="text-center text-foreground/60">טוען…</div>}

        {/* Empty state */}
        {!loading && collages.length === 0 && (
          <div
            className="rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xl backdrop-blur-md border border-white/40"
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
            <p className={`mt-4 text-xs ${isDark ? "text-white/60" : "text-foreground/60"}`}>
              💡 לחץ על האייקון 🎨 בפינה השמאלית למעלה לניהול קולאז׳ים והצטרפות עם קוד
            </p>
          </div>
        )}

        {/* Home collage display — clean, photos only. Editing happens via the 🎨 icon above. */}
        {!loading && displayCollage && (
          <div className="max-w-3xl mx-auto">
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
              <div
                className="rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md border border-white/40"
                style={{ background: theme.cardBg }}
              >
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {homePreviewPhotos.slice(0, 9).map((p, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl overflow-hidden bg-white/50 shadow-md relative"
                    >
                      {p.media_type === "video" ? (
                        <>
                          {p.thumbnail_url ? (
                            <img src={p.thumbnail_url} alt={p.caption ?? ""} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <video src={p.url} className="w-full h-full object-cover" muted loop playsInline preload="metadata" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                              <span className="text-white text-sm">▶</span>
                            </div>
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">🎬</div>
                        </>
                      ) : (
                        <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                  ))}
                </div>
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

        {/* Event icons — below photos, not overlapping */}
        <BirthdayHearts isDark={isDark} familyDeviceIds={familyCtx.familyDeviceIds} />

        {/* Rotating family quotes — built-in pool + user-added, click to manage */}
        {!loading && <FamilyQuoteRotator isDark={isDark} />}
      </div>
    </div>
  );
}
