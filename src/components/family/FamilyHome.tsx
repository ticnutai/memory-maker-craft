import { useEffect, useState } from "react";
import { Plus, Trash2, KeyRound, Users, Sparkles, Heart, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFamilyCollages, FamilyCollage } from "@/hooks/useFamilyCollages";
import CollageView from "./CollageView";
import FamilyThemePicker from "./FamilyThemePicker";
import FamilyDecorations from "./FamilyDecorations";
import { loadFamilyTheme, FamilyTheme } from "@/lib/familyThemes";
import { toast } from "sonner";

export default function FamilyHome() {
  const { collages, loading, createCollage, updateCollage, deleteCollage, joinByCode, deviceId } = useFamilyCollages();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [theme, setTheme] = useState<FamilyTheme>(() => loadFamilyTheme());

  // Apply theme to body so it covers the entire page (under the icons too)
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = theme.background;
    return () => { document.body.style.background = prev; };
  }, [theme.background]);

  const active = collages.find(c => c.id === activeId);
  if (active) {
    return <CollageView collage={active} onBack={() => setActiveId(null)} onUpdateCollage={updateCollage} />;
  }

  const handleCreate = async () => {
    try {
      const c = await createCollage({ name: `קולאז׳ ${collages.length + 1}` });
      setActiveId(c.id);
    } catch {
      toast.error("שגיאה ביצירת קולאז׳");
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const c = await joinByCode(joinCode);
      if (c) {
        toast.success(`הצטרפת לקולאז׳ "${c.name}"`);
        setShowJoin(false);
        setJoinCode("");
        setActiveId(c.id);
      } else {
        toast.error("קוד לא נמצא");
      }
    } finally {
      setJoining(false);
    }
  };

  const isDark = theme.id === "night";

  return (
    <div className="min-h-screen relative">
      {/* Theme decorations (floating bg elements) */}
      <FamilyDecorations type={theme.decoration ?? "none"} />

      {/* Theme picker — top-left, after the global nav icons */}
      <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] left-[140px] z-[91]">
        <FamilyThemePicker current={theme} onChange={setTheme} />
      </div>

      <div className="relative z-10 pt-20 pb-12 px-4 max-w-5xl mx-auto">
        {/* Hero header */}
        <header className="text-center mb-10">
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

        {/* Action buttons */}
        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          <Button
            onClick={handleCreate}
            size="lg"
            className="rounded-full shadow-lg hover:shadow-xl text-base px-7 h-14"
            style={{ background: theme.accent, color: "white" }}
          >
            <Plus className="w-5 h-5 ml-1" /> קולאז׳ חדש
          </Button>
          <Button
            onClick={() => setShowJoin(true)}
            size="lg"
            variant="outline"
            className="rounded-full text-base px-7 h-14 backdrop-blur-sm bg-background/60 border-2"
          >
            <KeyRound className="w-5 h-5 ml-1" /> הצטרף עם קוד
          </Button>
        </div>

        {loading && (
          <div className="text-center text-foreground/60">טוען…</div>
        )}

        {/* Empty state with guidance */}
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
              צרו אלבום משפחתי דיגיטלי — כל אחד יכול להוסיף תמונות, לערוך, ולשתף את הזיכרונות הכי אהובים.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
              <Step n={1} icon="✨" title="צרו קולאז׳" desc="לחצו על 'קולאז׳ חדש' ותתחילו לבנות אלבום" />
              <Step n={2} icon="📤" title="הוסיפו תמונות" desc="העלו מהמכשיר, מהענן או גררו תמונות" />
              <Step n={3} icon="❤️" title="שתפו עם המשפחה" desc="שלחו קוד שיתוף וכולם עורכים יחד בזמן אמת" />
            </div>
          </div>
        )}

        {/* Collages grid */}
        {collages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {collages.map(c => (
              <CollageCard
                key={c.id}
                collage={c}
                isShared={c.device_id !== deviceId}
                accent={theme.accent}
                onOpen={() => setActiveId(c.id)}
                onDelete={() => {
                  const isShared = c.device_id !== deviceId;
                  const msg = isShared ? `לעזוב את הקולאז׳ "${c.name}"?` : `למחוק את "${c.name}"?`;
                  if (confirm(msg)) deleteCollage(c.id);
                }}
              />
            ))}
            {/* Add new card at the end */}
            <button
              onClick={handleCreate}
              className="rounded-2xl border-2 border-dashed border-foreground/30 hover:border-foreground/60 transition-all active:scale-95 flex flex-col items-center justify-center gap-2 py-6 backdrop-blur-sm bg-background/30"
              style={{ minHeight: 130 }}
            >
              <Plus className="w-8 h-8 text-foreground/60" />
              <span className="text-sm font-bold text-foreground/70">קולאז׳ חדש</span>
            </button>
          </div>
        )}

        {/* Footer quote */}
        {!loading && (
          <div className={`text-center mt-12 text-xs ${isDark ? "text-white/50" : "text-foreground/50"}`}>
            ✨ "המשפחה היא הכל" ✨
          </div>
        )}
      </div>

      {/* Join dialog */}
      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>הצטרף לקולאז׳ משפחתי</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground/70">
              הכנס את קוד השיתוף שקיבלת מבן משפחה כדי להוסיף תמונות ולערוך יחד.
            </p>
            <Input
              placeholder="קוד שיתוף (8 תווים)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={8}
              className="text-center text-xl font-mono tracking-[0.3em] uppercase"
              autoFocus
            />
            <Button onClick={handleJoin} disabled={joining || joinCode.trim().length < 4} className="w-full">
              {joining ? "מצטרף…" : "הצטרף"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: string; title: string; desc: string }) {
  return (
    <div className="bg-background/50 rounded-2xl p-4 backdrop-blur-sm border border-white/30">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-xs font-bold text-foreground/50 mb-1">שלב {n}</div>
      <div className="font-bold text-sm mb-1">{title}</div>
      <div className="text-xs text-foreground/70">{desc}</div>
    </div>
  );
}

function CollageCard({ collage, isShared, accent, onOpen, onDelete }: { collage: FamilyCollage; isShared: boolean; accent: string; onOpen: () => void; onDelete: () => void }) {
  return (
    <div
      className="group relative rounded-2xl p-4 cursor-pointer hover:shadow-xl transition-all active:scale-95 backdrop-blur-md border border-white/40 shadow-md"
      onClick={onOpen}
      style={{ background: collage.background ?? "rgba(255,255,255,0.7)", minHeight: 130 }}
    >
      {isShared && (
        <div
          className="absolute top-2 right-2 text-white rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1 shadow"
          style={{ background: accent }}
        >
          <Users className="w-2.5 h-2.5" /> משותף
        </div>
      )}
      <div className="text-4xl text-center mb-2">{collage.emoji ?? "📸"}</div>
      <div className="font-bold text-center text-sm truncate">{collage.name}</div>
      <div className="text-[10px] text-center text-foreground/60 mt-1 flex items-center justify-center gap-1">
        <ImageIcon className="w-2.5 h-2.5" />
        <span>{collage.layout_type === "grid" ? "רשת" : collage.layout_type === "masonry" ? "פסיפס" : collage.layout_type === "freeform" ? "חופשי" : "תבנית"}</span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full p-1 transition-opacity shadow-md"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
