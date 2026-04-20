import { useState } from "react";
import { Palette, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FAMILY_THEMES, FamilyTheme, loadCustomTheme, saveFamilyTheme } from "@/lib/familyThemes";

interface ThemePickerProps {
  current: FamilyTheme;
  onChange: (theme: FamilyTheme) => void;
}

export default function FamilyThemePicker({ current, onChange }: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
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

  const select = (t: FamilyTheme) => {
    saveFamilyTheme(t);
    onChange(t);
    setOpen(false);
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
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 text-foreground/60 hover:text-foreground bg-background/40 backdrop-blur-sm border border-foreground/10"
        title="ערכת נושא"
        aria-label="בחירת ערכת נושא"
      >
        <Palette className="w-3.5 h-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>בחירת ערכת נושא 🎨</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {allThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => select(t)}
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
        </DialogContent>
      </Dialog>

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
