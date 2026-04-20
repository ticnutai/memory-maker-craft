import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  BUILTIN_FAMILY_QUOTES, FamilyQuote, getAllQuotes,
  loadCustomQuotes, addCustomQuote, removeCustomQuote,
  loadQuoteRotationMs, saveQuoteRotationMs,
} from "@/lib/familyQuotes";
import { toast } from "sonner";

interface QuoteRotatorProps {
  isDark?: boolean;
}

/**
 * Auto-rotating family quote display. Reads built-in + custom quotes,
 * cycles through them on a configurable interval, and offers an inline
 * "manage" button to add/remove user quotes.
 */
export default function FamilyQuoteRotator({ isDark = false }: QuoteRotatorProps) {
  const [version, setVersion] = useState(0); // bump to re-read storage
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [newEmoji, setNewEmoji] = useState("💫");
  const [rotationMs, setRotationMs] = useState<number>(() => loadQuoteRotationMs());
  const fadeKey = useRef(0);

  // Listen for storage updates (from manage dialog or other tabs)
  useEffect(() => {
    const handler = () => setVersion(v => v + 1);
    window.addEventListener("family-quotes-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("family-quotes-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const allQuotes: FamilyQuote[] = useMemo(() => getAllQuotes(), [version]);
  const custom = useMemo(() => loadCustomQuotes(), [version]);

  // Reset index if list shrank
  useEffect(() => {
    if (idx >= allQuotes.length) setIdx(0);
  }, [allQuotes.length, idx]);

  // Auto rotation
  useEffect(() => {
    if (allQuotes.length <= 1) return;
    const id = window.setInterval(() => {
      setIdx(i => (i + 1) % allQuotes.length);
      fadeKey.current += 1;
    }, Math.max(2000, rotationMs));
    return () => clearInterval(id);
  }, [allQuotes.length, rotationMs]);

  if (allQuotes.length === 0) return null;
  const current = allQuotes[idx] ?? allQuotes[0];

  const handleAdd = () => {
    const t = newText.trim();
    if (!t) { toast.error("צריך לכתוב משהו"); return; }
    if (t.length > 200) { toast.error("מקסימום 200 תווים"); return; }
    addCustomQuote(t, newEmoji.trim() || "💫");
    setNewText("");
    setNewEmoji("💫");
    toast.success("נוסף בהצלחה");
  };

  return (
    <>
      <div className="text-center mt-12 select-none">
        <div
          key={`${current.id}-${fadeKey.current}`}
          className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-md border animate-fade-in cursor-pointer transition-transform hover:scale-[1.02] ${
            isDark
              ? "bg-white/10 border-white/20 text-white"
              : "bg-white/60 border-white/60 text-foreground"
          }`}
          onClick={() => setOpen(true)}
          title="לחץ לניהול ציטוטים"
        >
          <span className="text-3xl sm:text-4xl">{current.emoji ?? "✨"}</span>
          <span className="text-xl sm:text-2xl md:text-3xl font-bold leading-snug max-w-[80vw] sm:max-w-3xl">
            {current.text}
          </span>
        </div>
        <div className={`mt-2 text-xs ${isDark ? "text-white/50" : "text-foreground/50"}`}>
          {idx + 1} / {allQuotes.length} • לחץ על הציטוט להוספה ועריכה
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" /> ציטוטים על המשפחה
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Add new */}
            <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
              <Label className="font-bold">➕ הוספת ציטוט חדש</Label>
              <div className="flex gap-2">
                <Input
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  className="w-16 text-center text-2xl"
                  maxLength={4}
                  aria-label="אימוג'י"
                />
                <Input
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="כתוב ציטוט יפה על המשפחה..."
                  maxLength={200}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                />
              </div>
              <Button onClick={handleAdd} className="w-full" size="sm">
                <Plus className="w-4 h-4 ml-1" /> הוסף לרוטציה
              </Button>
            </div>

            {/* Rotation speed */}
            <div className="space-y-2">
              <Label>⏱️ מהירות החלפה: {(rotationMs / 1000).toFixed(1)} שניות</Label>
              <Slider
                min={2000}
                max={15000}
                step={500}
                value={[rotationMs]}
                onValueChange={(v) => { setRotationMs(v[0]); saveQuoteRotationMs(v[0]); }}
              />
            </div>

            {/* Custom list */}
            {custom.length > 0 && (
              <div className="space-y-2">
                <Label className="font-bold">הציטוטים שלי ({custom.length})</Label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {custom.map(q => (
                    <div key={q.id} className="flex items-center gap-2 bg-background border rounded-xl p-2.5">
                      <span className="text-xl">{q.emoji}</span>
                      <span className="flex-1 text-sm">{q.text}</span>
                      <button
                        onClick={() => { removeCustomQuote(q.id); toast.success("נמחק"); }}
                        className="text-destructive hover:bg-destructive/10 rounded-full p-1.5"
                        aria-label="מחק"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Built-in info */}
            <div className="text-xs text-foreground/60 text-center pt-2 border-t">
              💡 המערכת מציגה {BUILTIN_FAMILY_QUOTES.length} ציטוטים מובנים + הציטוטים שלך, ברוטציה אוטומטית
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
