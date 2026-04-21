import { useEffect, useRef, useState } from "react";
import { Plus, Sparkles, Heart, Image as ImageIcon, Settings2 } from "lucide-react";
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
  loadSlideshowConfig, saveSlideshowConfig, SlideshowConfig, normalizeSlideshowConfig, resetSlideshowConfig,
} from "@/lib/familyThemes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

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
  const { user } = useAuth();
  const familyCtx = useFamily();
  const { collages, loading, createCollage, updateCollage, deleteCollage, joinByCode, deviceId } = useFamilyCollages(familyCtx.familyDeviceIds);
  const bootstrappingHomeRef = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [homeCollageId, setHomeCollageId] = useState<string | null>(() => loadHomeCollageId());
  const [theme, setTheme] = useState<FamilyTheme>(() => loadFamilyTheme());
  const [homePreviewPhotos, setHomePreviewPhotos] = useState<{ url: string; caption: string | null; media_type: string; thumbnail_url: string | null }[]>([]);
  const [slideshow, setSlideshow] = useState<SlideshowConfig>(() => loadSlideshowConfig());
  const [pageClock, setPageClock] = useState(() => new Date());

  const persistSlideshow = async (nextInput: SlideshowConfig, options?: { syncCloud?: boolean; touchUpdatedAt?: boolean }) => {
    const touchUpdatedAt = options?.touchUpdatedAt !== false;
    const syncCloud = options?.syncCloud !== false;
    const next = normalizeSlideshowConfig({
      ...nextInput,
      updatedAt: touchUpdatedAt ? new Date().toISOString() : nextInput.updatedAt,
    });

    saveSlideshowConfig(next, { touchUpdatedAt: false });
    setSlideshow(next);

    if (!syncCloud || !user) return;

    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      slideshow_config: next as unknown as Json,
      updated_at: next.updatedAt,
    });
  };

  const resetSlideshowPreferences = async () => {
    const next = resetSlideshowConfig();
    setSlideshow(next);
    if (user) {
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        slideshow_config: next as unknown as Json,
        updated_at: next.updatedAt,
      });
    }
    toast.success("העדפות הסליידשואו אופסו");
  };

  const applyHomeCollage = (id: string | null, options?: { followHomeInSlideshow?: boolean }) => {
    saveHomeCollageId(id);
    setHomeCollageId(id);

    if (options?.followHomeInSlideshow) {
      const next = { ...slideshow, enabled: true, autoStart: true, collageId: null };
      void persistSlideshow(next);
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const local = loadSlideshowConfig();
      const { data } = await supabase
        .from("user_preferences")
        .select("slideshow_config, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const rawCloud = (data?.slideshow_config ?? null) as Partial<SlideshowConfig> | null;
      if (!rawCloud) {
        await supabase.from("user_preferences").upsert({
          user_id: user.id,
          slideshow_config: local as unknown as Json,
          updated_at: local.updatedAt || new Date().toISOString(),
        });
        return;
      }

      const cloudCfg = normalizeSlideshowConfig(rawCloud);
      const localTs = Date.parse(local.updatedAt || "");
      const cloudTs = Date.parse(cloudCfg.updatedAt || (data?.updated_at ?? ""));
      const useCloud = Number.isFinite(cloudTs) && (!Number.isFinite(localTs) || cloudTs >= localTs);

      if (useCloud) {
        saveSlideshowConfig(cloudCfg, { touchUpdatedAt: false });
        setSlideshow(cloudCfg);
      } else {
        await supabase.from("user_preferences").upsert({
          user_id: user.id,
          slideshow_config: local as unknown as Json,
          updated_at: local.updatedAt || new Date().toISOString(),
        });
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

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
  }, [loading, photoCollages.length, createCollage]);

  // Auto-set home collage to first one if none selected
  useEffect(() => {
    if (loading) return;

    const namedHomeId = photoCollages.find((c) => c.name.trim() === "דף הבית")?.id ?? null;
    const firstPhotoCollageId = photoCollages[0]?.id ?? null;
    const hasValidHome = homeCollageId ? photoCollages.some((c) => c.id === homeCollageId) : false;

    if (!hasValidHome && homeCollageId) {
      applyHomeCollage(firstPhotoCollageId);
      return;
    }

    if (!homeCollageId && namedHomeId) {
      applyHomeCollage(namedHomeId);
      return;
    }

    if (!homeCollageId && firstPhotoCollageId) {
      applyHomeCollage(firstPhotoCollageId);
    }
  }, [loading, homeCollageId, photoCollages]);

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
    return <CollageView collage={active} onBack={() => setActiveId(null)} onUpdateCollage={updateCollage} />;
  }

  const handleCreate = async (partial?: Partial<typeof collages[0]>) => {
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
        isAdmin={familyCtx.isAdmin}
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
        isAdmin={familyCtx.isAdmin}
        slideshow={slideshow}
        onSlideshowChange={(cfg) => { void persistSlideshow(cfg); }}
        onResetSlideshow={resetSlideshowPreferences}
        hideTrigger
        externalOpen={externalThemePickerOpen}
        onExternalOpenChange={onThemePickerOpenChange}
      />

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

        <BirthdayHearts isDark={isDark} familyDeviceIds={familyCtx.familyDeviceIds} />

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

        {/* Rotating family quotes — built-in pool + user-added, click to manage */}
        {!loading && <FamilyQuoteRotator isDark={isDark} />}
      </div>
    </div>
  );
}
