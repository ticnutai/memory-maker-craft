import { useEffect, useState } from "react";
import { Plus, Sparkles, Heart, Image as ImageIcon, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFamilyCollages } from "@/hooks/useFamilyCollages";
import CollageView from "./CollageView";
import FamilyThemePicker from "./FamilyThemePicker";
import FamilyDecorations from "./FamilyDecorations";
import FamilySlideshow from "./FamilySlideshow";
import {
  loadFamilyTheme, FamilyTheme, loadHomeCollageId, saveHomeCollageId,
  loadSlideshowConfig, SlideshowConfig,
} from "@/lib/familyThemes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function FamilyHome() {
  const { collages, loading, createCollage, updateCollage, deleteCollage, joinByCode, deviceId } = useFamilyCollages();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [homeCollageId, setHomeCollageId] = useState<string | null>(() => loadHomeCollageId());
  const [theme, setTheme] = useState<FamilyTheme>(() => loadFamilyTheme());
  const [homePreviewPhotos, setHomePreviewPhotos] = useState<string[]>([]);

  // Apply theme to body so it covers the entire page (under the icons too)
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = theme.background;
    return () => { document.body.style.background = prev; };
  }, [theme.background]);

  // Auto-set home collage to first one if none selected
  useEffect(() => {
    if (!loading && !homeCollageId && collages.length > 0) {
      const firstId = collages[0].id;
      saveHomeCollageId(firstId);
      setHomeCollageId(firstId);
    }
    // Clear home if it points to a deleted collage
    if (!loading && homeCollageId && collages.length > 0 && !collages.find(c => c.id === homeCollageId)) {
      saveHomeCollageId(null);
      setHomeCollageId(null);
    }
  }, [loading, homeCollageId, collages]);

  const homeCollage = collages.find(c => c.id === homeCollageId);

  // Load preview photos for home collage
  useEffect(() => {
    if (!homeCollage) { setHomePreviewPhotos([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("family_photos")
        .select("image_url")
        .eq("collage_id", homeCollage.id)
        .order("sort_order", { ascending: true })
        .limit(9);
      if (!cancelled) setHomePreviewPhotos((data ?? []).map(p => p.image_url));
    })();
    return () => { cancelled = true; };
  }, [homeCollage?.id]);

  const active = collages.find(c => c.id === activeId);
  if (active) {
    return <CollageView collage={active} onBack={() => setActiveId(null)} onUpdateCollage={updateCollage} />;
  }

  const handleCreate = async () => {
    try {
      const c = await createCollage({ name: `קולאז׳ ${collages.length + 1}` });
      // First collage becomes home automatically
      if (!homeCollageId) {
        saveHomeCollageId(c.id);
        setHomeCollageId(c.id);
      }
      setActiveId(c.id);
    } catch {
      toast.error("שגיאה ביצירת קולאז׳");
    }
  };

  const isDark = theme.id === "night";

  return (
    <div className="min-h-screen relative">
      <FamilyDecorations type={theme.decoration ?? "none"} />

      {/* Theme/Collages icon — same style as other top-left nav icons */}
      <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] left-[170px] z-[91]">
        <FamilyThemePicker
          current={theme}
          onChange={setTheme}
          collages={collages}
          deviceId={deviceId}
          homeCollageId={homeCollageId}
          onSetHomeCollage={setHomeCollageId}
          onOpenCollage={(id) => setActiveId(id)}
          onCreateCollage={handleCreate}
          onDeleteCollage={deleteCollage}
          onJoinByCode={joinByCode}
        />
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
              onClick={handleCreate}
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

        {/* Home collage display */}
        {!loading && homeCollage && (
          <div
            className="rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-xl backdrop-blur-md border border-white/40"
            style={{ background: theme.cardBg }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="text-right min-w-0 flex-1">
                <div className="text-3xl mb-1">{homeCollage.emoji ?? "📸"}</div>
                <h2 className={`text-xl sm:text-2xl font-bold truncate ${isDark ? "text-white" : "text-foreground"}`}>
                  {homeCollage.name}
                </h2>
                <p className={`text-xs ${isDark ? "text-white/70" : "text-foreground/60"}`}>
                  {homePreviewPhotos.length === 0 ? "אין עדיין תמונות" : `${homePreviewPhotos.length} תמונות אחרונות`}
                </p>
              </div>
              <Button
                onClick={() => setActiveId(homeCollage.id)}
                size="lg"
                className="rounded-full shadow-md flex-shrink-0"
                style={{ background: theme.accent, color: "white" }}
              >
                <Settings2 className="w-4 h-4 ml-1" /> פתח / ערוך
              </Button>
            </div>

            {/* Photos preview grid */}
            {homePreviewPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {homePreviewPhotos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveId(homeCollage.id)}
                    className="aspect-square rounded-xl overflow-hidden bg-white/50 hover:scale-[1.03] transition-transform shadow-md"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setActiveId(homeCollage.id)}
                className="w-full py-12 rounded-2xl border-2 border-dashed border-foreground/20 hover:border-foreground/40 transition-all text-center"
              >
                <ImageIcon className={`w-10 h-10 mx-auto mb-2 ${isDark ? "text-white/40" : "text-foreground/40"}`} />
                <p className={`font-bold ${isDark ? "text-white/80" : "text-foreground/70"}`}>הוסף תמונות ראשונות</p>
                <p className={`text-xs mt-1 ${isDark ? "text-white/50" : "text-foreground/50"}`}>לחץ כדי לפתוח את הקולאז׳</p>
              </button>
            )}

            {collages.length > 1 && (
              <p className={`text-center text-xs mt-4 ${isDark ? "text-white/60" : "text-foreground/60"}`}>
                💡 יש לך {collages.length} קולאז׳ים — בחר את דף הבית באייקון 🎨
              </p>
            )}
          </div>
        )}

        {/* Footer quote */}
        {!loading && (
          <div className={`text-center mt-12 text-xs ${isDark ? "text-white/50" : "text-foreground/50"}`}>
            ✨ "המשפחה היא הכל" ✨
          </div>
        )}
      </div>
    </div>
  );
}
