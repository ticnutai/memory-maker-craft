import { useState } from "react";
import { Palette, Plus, Check, KeyRound, Home as HomeIcon, Trash2, Users, Image as ImageIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FAMILY_THEMES, FamilyTheme, loadCustomTheme, saveFamilyTheme,
  saveHomeCollageId, SlideshowConfig, SlideTransition, saveSlideshowConfig,
} from "@/lib/familyThemes";
import { FamilyCollage } from "@/hooks/useFamilyCollages";
import { toast } from "sonner";

interface ThemePickerProps {
  current: FamilyTheme;
  onChange: (theme: FamilyTheme) => void;
  // Collages tab
  collages: FamilyCollage[];
  deviceId: string;
  homeCollageId: string | null;
  onSetHomeCollage: (id: string | null) => void;
  onOpenCollage: (id: string) => void;
  onCreateCollage: () => Promise<void>;
  onDeleteCollage: (id: string) => void;
  onJoinByCode: (code: string) => Promise<FamilyCollage | null>;
  // Slideshow tab
  slideshow: SlideshowConfig;
  onSlideshowChange: (cfg: SlideshowConfig) => void;
}

export default function FamilyThemePicker({
  current, onChange,
  collages = [], deviceId, homeCollageId,
  onSetHomeCollage, onOpenCollage, onCreateCollage, onDeleteCollage, onJoinByCode,
}: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"collages" | "themes">("collages");
  const [showCustom, setShowCustom] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const existing = loadCustomTheme();
  const [custom, setCustom] = useState<FamilyTheme>(existing ?? {
    id: "custom",
    name: "ערכה אישית",
    emoji: "🎨",
    background: "linear-gradient(135deg, #fce7f3 0%, #ddd6fe 100%)",
    cardBg: "rgba(255, 255, 255, 0.8)",
    accent: "#ec4899",
    textOnBg: "text-foreground",
    decoration: "hearts",
  });
  const [color1, setColor1] = useState("#fce7f3");
  const [color2, setColor2] = useState("#ddd6fe");

  const allThemes = existing ? [...FAMILY_THEMES, existing] : FAMILY_THEMES;

  const selectTheme = (t: FamilyTheme) => {
    saveFamilyTheme(t);
    onChange(t);
  };

  const saveCustom = () => {
    const newCustom: FamilyTheme = {
      ...custom,
      id: "custom",
      background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
    };
    saveFamilyTheme(newCustom);
    onChange(newCustom);
    setShowCustom(false);
  };

  const setAsHome = (id: string) => {
    saveHomeCollageId(id);
    onSetHomeCollage(id);
    toast.success("הקולאז׳ נקבע כדף הבית 🏠");
  };

  const clearHome = () => {
    saveHomeCollageId(null);
    onSetHomeCollage(null);
    toast.success("הוסר מדף הבית");
  };

  const handleCreate = async () => {
    await onCreateCollage();
    setOpen(false);
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 4) return;
    setJoining(true);
    try {
      const c = await onJoinByCode(joinCode);
      if (c) {
        toast.success(`הצטרפת לקולאז׳ "${c.name}"`);
        setJoinCode("");
        setAsHome(c.id);
        setOpen(false);
      } else {
        toast.error("קוד לא נמצא");
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      {/* Trigger — matches the other top-left nav icons (w-6 h-6, icon w-3.5 h-3.5) */}
      <button
        onClick={() => setOpen(true)}
        className="w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 text-foreground/40 hover:text-foreground/70"
        title="קולאז׳ים וערכות נושא"
        aria-label="קולאז׳ים וערכות נושא"
      >
        <Palette className="w-3.5 h-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>בית משפחת טננבאום 🏠</DialogTitle>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "collages" | "themes")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="collages">📸 קולאז׳ים</TabsTrigger>
              <TabsTrigger value="themes">🎨 ערכות נושא</TabsTrigger>
            </TabsList>

            {/* Collages tab */}
            <TabsContent value="collages" className="space-y-4 mt-4">
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1" style={{ background: current.accent, color: "white" }}>
                  <Plus className="w-4 h-4 ml-1" /> קולאז׳ חדש
                </Button>
              </div>

              {/* Join by code */}
              <div className="rounded-xl border p-3 bg-muted/30">
                <Label className="text-xs flex items-center gap-1 mb-2">
                  <KeyRound className="w-3 h-3" /> הצטרף עם קוד שיתוף
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="קוד 8 תווים"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    maxLength={8}
                    className="text-center font-mono tracking-widest uppercase h-9"
                  />
                  <Button onClick={handleJoin} disabled={joining || joinCode.trim().length < 4} size="sm">
                    {joining ? "..." : "הצטרף"}
                  </Button>
                </div>
              </div>

              {/* Collages list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    {collages.length === 0 ? "אין עדיין קולאז׳ים" : `${collages.length} קולאז׳ים`}
                  </Label>
                  {homeCollageId && (
                    <button onClick={clearHome} className="text-[10px] text-muted-foreground hover:text-foreground underline">
                      נקה דף בית
                    </button>
                  )}
                </div>

                {collages.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    צור קולאז׳ חדש או הצטרף עם קוד 👆
                  </div>
                )}

                {collages.map(c => {
                  const isShared = c.device_id !== deviceId;
                  const isHome = homeCollageId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                        isHome ? "bg-primary/10 border-primary" : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <button
                        onClick={() => { onOpenCollage(c.id); setOpen(false); }}
                        className="flex-1 flex items-center gap-2 text-right min-w-0"
                      >
                        <span className="text-2xl flex-shrink-0">{c.emoji ?? "📸"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate flex items-center gap-1">
                            {c.name}
                            {isHome && <HomeIcon className="w-3 h-3 text-primary flex-shrink-0" />}
                            {isShared && <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {isShared ? "משותף" : "שלי"} · קוד {c.share_code}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => isHome ? clearHome() : setAsHome(c.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          isHome ? "text-primary bg-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        title={isHome ? "הסר מדף הבית" : "קבע כדף הבית"}
                      >
                        <HomeIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const msg = isShared ? `לעזוב את "${c.name}"?` : `למחוק את "${c.name}"?`;
                          if (confirm(msg)) {
                            if (homeCollageId === c.id) clearHome();
                            onDeleteCollage(c.id);
                          }
                        }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="מחק"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Themes tab */}
            <TabsContent value="themes" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {allThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTheme(t)}
                    className={`relative rounded-2xl overflow-hidden border-2 transition-all active:scale-95 ${current.id === t.id ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-foreground/20"}`}
                    style={{ background: t.background, minHeight: 90 }}
                  >
                    <div className="p-3 text-right">
                      <div className="text-2xl">{t.emoji}</div>
                      <div className={`text-sm font-bold mt-1 ${t.textOnBg}`}>{t.name}</div>
                    </div>
                    {current.id === t.id && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustom(true)}
                  className="rounded-2xl border-2 border-dashed border-foreground/30 hover:border-foreground/60 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 py-5"
                >
                  <Plus className="w-6 h-6 text-foreground/60" />
                  <span className="text-sm font-bold">ערכה אישית</span>
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Custom theme builder */}
      <Dialog open={showCustom} onOpenChange={setShowCustom}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>יצירת ערכת נושא אישית</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div
              className="h-24 rounded-2xl border"
              style={{ background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)` }}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">צבע ראשי</Label>
                <Input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">צבע שני</Label>
                <Input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="h-10" />
              </div>
            </div>
            <div>
              <Label className="text-xs">שם הערכה</Label>
              <Input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="למשל: הערכה של אבא" />
            </div>
            <div>
              <Label className="text-xs">אימוג'י</Label>
              <Input value={custom.emoji} onChange={(e) => setCustom({ ...custom, emoji: e.target.value })} maxLength={2} className="text-2xl text-center" />
            </div>
            <div>
              <Label className="text-xs">קישוט רקע</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {(["hearts", "stars", "leaves", "confetti", "dots", "none"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setCustom({ ...custom, decoration: d })}
                    className={`px-3 py-1 rounded-full text-xs border ${custom.decoration === d ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
                  >
                    {d === "hearts" ? "❤️ לבבות" : d === "stars" ? "⭐ כוכבים" : d === "leaves" ? "🌿 עלים" : d === "confetti" ? "🎉 קונפטי" : d === "dots" ? "● נקודות" : "ללא"}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={saveCustom}>שמור ובחר</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
