import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CardData } from "@/lib/gameData";
import { Plus, Trash2, Edit2, Play, X, Upload, Download, Loader2, ChevronRight, CloudDownload, Copy, Sparkles, Zap, Timer } from "lucide-react";
import { toast } from "sonner";

interface CustomSet {
  id: string;
  device_id: string;
  name: string;
  emoji: string;
  color: string;
  settings_json?: Record<string, any> | null;
}

interface CustomCard {
  id: string;
  set_id: string;
  label: string | null;
  emoji: string;
  image_url: string | null;
  sort_order: number;
}

interface SetSettings {
  floatingEmojis?: string[];
  flipDuration?: number;
  emojiScale?: number;
  pairCount?: number;
  soundEnabled?: boolean;
  speechEnabled?: boolean;
  speechRate?: number;
  cardBackIcon?: string;
  cardShape?: string;
  cardBorderRadius?: number;
  cardBackColor?: string;
}

const SET_EMOJIS = ["📷", "🎨", "🌟", "🎮", "🎪", "🎈", "🧸", "🦄", "🌈", "🎀", "🐾", "🌺"];
const SET_COLORS = ["#60a5fa", "#f472b6", "#4ade80", "#fb923c", "#a78bfa", "#facc15", "#f87171", "#38bdf8"];
const FLOATING_EMOJI_OPTIONS = ["🧸", "🎈", "🌈", "⭐", "🦄", "🎀", "🍭", "🌸", "💖", "🎪", "🐰", "🦋", "🎵", "🌺", "🍬", "🎯", "🔮", "🎨", "❤️", "🌟"];
const BACK_ICONS = ["⭐", "❓", "🎴", "🃏", "💫", "🌟", "🎯", "🔮", "🎪", "🎨"];
const SHAPES = [
  { id: "square", label: "ריבוע", radius: 16 },
  { id: "rounded", label: "מעוגל", radius: 24 },
  { id: "pill", label: "כמוסה", radius: 9999 },
  { id: "sharp", label: "חד", radius: 4 },
];
const BACK_COLORS = [
  { id: "default", label: "ברירת מחדל" },
  { id: "red", label: "אדום" },
  { id: "green", label: "ירוק" },
  { id: "purple", label: "סגול" },
  { id: "orange", label: "כתום" },
  { id: "cyan", label: "תכלת" },
  { id: "gold", label: "זהב" },
];

function getDeviceId(): string {
  const key = "memory-game-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

interface CustomCardSetsProps {
  theme: "girl" | "boy";
  onPlay: (cards: CardData[], setName: string) => void;
  initialOpenSetId?: string | null;
}

export default function CustomCardSets({ theme, onPlay, initialOpenSetId }: CustomCardSetsProps) {
  const [sets, setSets] = useState<CustomSet[]>([]);
  const [newEmojiCard, setNewEmojiCard] = useState({ emoji: "", label: "" });
  const [cards, setCards] = useState<Record<string, CustomCard[]>>({});
  const [loading, setLoading] = useState(true);
  const [openSetId, setOpenSetId] = useState<string | null>(null);
  const [showNewSet, setShowNewSet] = useState(false);
  const [editSetId, setEditSetId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmoji, setFormEmoji] = useState("📷");
  const [formColor, setFormColor] = useState("#60a5fa");
  const [formSettings, setFormSettings] = useState<SetSettings>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCloudPicker, setShowCloudPicker] = useState(false);
  const [cloudImages, setCloudImages] = useState<{ name: string; url: string }[]>([]);
  const [cloudSelected, setCloudSelected] = useState<Set<string>>(new Set());
  const [loadingCloud, setLoadingCloud] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const deviceId = getDeviceId();
  const accent = theme === "girl" ? "bg-game-pink" : "bg-game-blue";

  const loadSets = useCallback(async () => {
    const { data } = await supabase
      .from("custom_card_sets")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });
    if (data) setSets(data.map((d: any) => ({
      ...d,
      settings_json: typeof d.settings_json === "string" ? JSON.parse(d.settings_json) : d.settings_json,
    })) as CustomSet[]);
    setLoading(false);
  }, [deviceId]);

  const loadCards = useCallback(async (setId: string) => {
    const { data } = await supabase
      .from("custom_card_items")
      .select("*")
      .eq("set_id", setId)
      .order("sort_order", { ascending: true });
    if (data) setCards(prev => ({ ...prev, [setId]: data as CustomCard[] }));
  }, []);

  useEffect(() => { loadSets(); }, [loadSets]);

  useEffect(() => {
    if (initialOpenSetId) {
      setOpenSetId(initialOpenSetId);
      loadCards(initialOpenSetId);
    }
  }, [initialOpenSetId, loadCards]);

  useEffect(() => {
    if (openSetId && !cards[openSetId]) loadCards(openSetId);
  }, [openSetId, cards, loadCards]);

  const resetForm = () => {
    setFormName(""); setFormEmoji("📷"); setFormColor("#60a5fa");
    setFormSettings({}); setShowAdvanced(false);
    setShowNewSet(false); setEditSetId(null);
  };

  const saveSet = async (saveAsNew = false) => {
    if (!formName.trim()) return;
    const settingsPayload = Object.keys(formSettings).length > 0 ? formSettings : {};
    if (editSetId && !saveAsNew) {
      const { error } = await supabase.from("custom_card_sets").update({
        name: formName, emoji: formEmoji, color: formColor,
        settings_json: settingsPayload as any,
        updated_at: new Date().toISOString(),
      }).eq("id", editSetId);
      if (error) {
        console.error("Update set error:", error);
        toast.error("שגיאה בעדכון הערכה: " + error.message);
        return;
      }
      toast.success("הערכה עודכנה! ✏️");
    } else {
      const { data: newSet, error } = await supabase.from("custom_card_sets").insert({
        device_id: deviceId, name: formName, emoji: formEmoji, color: formColor,
        settings_json: settingsPayload as any,
      }).select().single();
      if (error) {
        console.error("Insert set error:", error);
        toast.error("שגיאה ביצירת ערכה: " + error.message);
        return;
      }
      if (saveAsNew && editSetId && newSet) {
        const sourceCards = cards[editSetId] || [];
        for (const c of sourceCards) {
          const { error: cardError } = await supabase.from("custom_card_items").insert({
            set_id: (newSet as any).id, label: c.label, emoji: c.emoji,
            image_url: c.image_url, sort_order: c.sort_order,
          });
          if (cardError) console.error("Copy card error:", cardError);
        }
      }
      toast.success(saveAsNew ? "ערכה חדשה נשמרה! 🎉" : "ערכה נוצרה! ✨");
    }
    resetForm(); loadSets();
  };

  const deleteSet = async (id: string) => {
    const setCards2 = cards[id] || [];
    for (const c of setCards2) {
      if (c.image_url) {
        const path = c.image_url.split("/game-images/")[1];
        if (path) await supabase.storage.from("game-images").remove([path]);
      }
    }
    await supabase.from("custom_card_sets").delete().eq("id", id);
    if (openSetId === id) setOpenSetId(null);
    loadSets();
    setCards(prev => { const n = { ...prev }; delete n[id]; return n; });
    toast.success("הערכה נמחקה");
  };

  const editSet = (s: CustomSet) => {
    setFormName(s.name); setFormEmoji(s.emoji); setFormColor(s.color);
    setFormSettings((s.settings_json as SetSettings) || {});
    setEditSetId(s.id); setShowNewSet(true);
    if (Object.keys((s.settings_json as any) || {}).length > 0) setShowAdvanced(true);
  };

  const duplicateSet = (s: CustomSet) => {
    setFormName(s.name + " (העתק)"); setFormEmoji(s.emoji); setFormColor(s.color);
    setFormSettings((s.settings_json as SetSettings) || {});
    setEditSetId(s.id); setShowNewSet(true); setShowAdvanced(true);
  };

  const handleUpload = async (files: FileList | null, setId: string) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newCards: CustomCard[] = [];
    const existingCount = (cards[setId] || []).length;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop() || "jpg";
      const path = `custom-sets/${setId}/${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage.from("game-images").upload(path, file);
      if (error) { console.error(error); continue; }
      const { data: urlData } = supabase.storage.from("game-images").getPublicUrl(path);
      const { data: insertData } = await supabase.from("custom_card_items").insert({
        set_id: setId, label: file.name.replace(/\.[^.]+$/, ""), emoji: "📷",
        image_url: urlData.publicUrl, sort_order: existingCount + i,
      }).select().single();
      if (insertData) newCards.push(insertData as CustomCard);
    }
    setCards(prev => ({ ...prev, [setId]: [...(prev[setId] || []), ...newCards] }));
    setUploading(false);
    toast.success(`${newCards.length} קלפים הוספו`);
  };

  const deleteCard = async (setId: string, cardId: string) => {
    const card = (cards[setId] || []).find(c => c.id === cardId);
    if (card?.image_url) {
      const path = card.image_url.split("/game-images/")[1];
      if (path) await supabase.storage.from("game-images").remove([path]);
    }
    await supabase.from("custom_card_items").delete().eq("id", cardId);
    setCards(prev => ({ ...prev, [setId]: (prev[setId] || []).filter(c => c.id !== cardId) }));
  };

  const openCloudPicker = async () => {
    setShowCloudPicker(true); setCloudSelected(new Set()); setLoadingCloud(true);
    const { data } = await supabase.storage.from("game-images").list("", {
      limit: 200, sortBy: { column: "created_at", order: "desc" },
    });
    const results = (data || [])
      .filter(f => f.name && !f.name.startsWith(".") && !f.name.startsWith("custom-sets"))
      .map(f => ({ name: f.name, url: supabase.storage.from("game-images").getPublicUrl(f.name).data.publicUrl }));
    setCloudImages(results); setLoadingCloud(false);
  };

  const importFromCloud = async (setId: string) => {
    if (cloudSelected.size === 0) return;
    setUploading(true);
    const existingCount = (cards[setId] || []).length;
    const newCards: CustomCard[] = [];
    let i = 0;
    for (const url of cloudSelected) {
      const img = cloudImages.find(c => c.url === url);
      const { data: insertData, error } = await supabase.from("custom_card_items").insert({
        set_id: setId, label: img?.name.replace(/\.[^.]+$/, "") || `קלף ${existingCount + i + 1}`,
        emoji: "📷", image_url: url, sort_order: existingCount + i,
      }).select().single();
      if (error) {
        console.error("Import card error:", error);
        toast.error("שגיאה בייבוא קלף: " + error.message);
      }
      if (insertData) newCards.push(insertData as CustomCard);
      i++;
    }
    setCards(prev => ({ ...prev, [setId]: [...(prev[setId] || []), ...newCards] }));
    setUploading(false); setShowCloudPicker(false);
    toast.success(`${newCards.length} קלפים יובאו מהענן! ☁️`);
  };

  const updateCardLabel = async (setId: string, cardId: string, label: string) => {
    await supabase.from("custom_card_items").update({ label }).eq("id", cardId);
    setCards(prev => ({ ...prev, [setId]: (prev[setId] || []).map(c => c.id === cardId ? { ...c, label } : c) }));
  };

  const addEmojiCard = async (setId: string) => {
    if (!newEmojiCard.emoji.trim()) { toast.error("בחרו אימוג׳י"); return; }
    const existingCount = (cards[setId] || []).length;
    const { data, error } = await supabase.from("custom_card_items").insert({
      set_id: setId, label: newEmojiCard.label || newEmojiCard.emoji,
      emoji: newEmojiCard.emoji, image_url: null, sort_order: existingCount,
    }).select().single();
    if (error) { toast.error("שגיאה בהוספת קלף"); return; }
    if (data) setCards(prev => ({ ...prev, [setId]: [...(prev[setId] || []), data as CustomCard] }));
    setNewEmojiCard({ emoji: "", label: "" });
    toast.success("קלף נוסף! ✨");
  };

  const updateCardEmoji = async (setId: string, cardId: string, emoji: string) => {
    await supabase.from("custom_card_items").update({ emoji }).eq("id", cardId);
    setCards(prev => ({ ...prev, [setId]: (prev[setId] || []).map(c => c.id === cardId ? { ...c, emoji } : c) }));
  };

  const playSet = (s: CustomSet) => {
    const setItems = cards[s.id] || [];
    if (setItems.length < 2) { toast.error("צריך לפחות 2 קלפים כדי לשחק"); return; }
    const gameCards: CardData[] = setItems.map((c, i) => ({
      id: `custom-set-${s.id}-${i}`, emoji: c.emoji, label: c.label || undefined, image: c.image_url || undefined,
    }));
    onPlay(gameCards, s.name);
  };

  const downloadCard = async (card: CustomCard) => {
    if (!card.image_url) return;
    try {
      const response = await fetch(card.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = (card.label || "card") + ".jpg"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("שגיאה בהורדה"); }
  };

  const updateFormSetting = <K extends keyof SetSettings>(key: K, val: SetSettings[K]) => {
    setFormSettings(prev => ({ ...prev, [key]: val }));
  };

  const toggleFloatingEmoji = (emoji: string) => {
    setFormSettings(prev => {
      const current = prev.floatingEmojis || [];
      const next = current.includes(emoji) ? current.filter(e => e !== emoji) : [...current, emoji];
      return { ...prev, floatingEmojis: next };
    });
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  // ─── Viewing a specific set ───
  if (openSetId) {
    const currentSet = sets.find(s => s.id === openSetId);
    const setItems = cards[openSetId] || [];
    if (!currentSet) return null;

    return (
      <div className="space-y-3 bounce-in">
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenSetId(null)} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-all active:scale-95">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xl">{currentSet.emoji}</span>
            <h3 className="font-black text-sm">{currentSet.name}</h3>
            <span className="text-xs text-muted-foreground">({setItems.length} קלפים)</span>
          </div>
          <button onClick={() => editSet(currentSet)}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all active:scale-90">
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <Button variant={theme === "girl" ? "game-pink" : "game-blue"} size="sm"
            onClick={() => playSet(currentSet)} disabled={setItems.length < 2} className="rounded-xl gap-1">
            <Play className="w-4 h-4" /> שחק
          </Button>
        </div>

        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleUpload(e.target.files, openSetId)} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex-1 rounded-xl gap-1">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            העלאת תמונות
          </Button>
          <Button variant="outline" size="sm" onClick={openCloudPicker} disabled={uploading}
            className="flex-1 rounded-xl gap-1">
            <CloudDownload className="w-4 h-4" /> ייבוא מהענן
          </Button>
        </div>

        {/* Add emoji card */}
        <div className="bg-card rounded-2xl border-2 border-muted p-3 space-y-2">
          <p className="text-xs font-bold text-muted-foreground">➕ הוספת קלף אימוג׳י</p>
          <div className="flex gap-2">
            <input type="text" value={newEmojiCard.emoji} onChange={e => setNewEmojiCard(prev => ({ ...prev, emoji: e.target.value }))}
              placeholder="🐶" className="w-14 h-10 rounded-lg border-2 border-muted text-center text-xl focus:outline-none focus:border-game-pink" />
            <input type="text" value={newEmojiCard.label} onChange={e => setNewEmojiCard(prev => ({ ...prev, label: e.target.value }))}
              placeholder="שם הקלף..." dir="rtl" className="flex-1 h-10 rounded-lg border-2 border-muted px-3 text-sm focus:outline-none focus:border-game-pink" />
            <Button variant={theme === "girl" ? "game-pink" : "game-blue"} size="sm" className="rounded-xl"
              onClick={() => addEmojiCard(openSetId)} disabled={!newEmojiCard.emoji.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showCloudPicker && (
          <div className="bg-card rounded-2xl border-2 border-muted shadow-lg p-3 space-y-2 bounce-in">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">☁️ בחירת תמונות מהענן</h4>
              <button onClick={() => setShowCloudPicker(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            {loadingCloud ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : cloudImages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">אין תמונות בענן</p>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                  {cloudImages.map(img => {
                    const isSel = cloudSelected.has(img.url);
                    return (
                      <button key={img.name} onClick={() => {
                        setCloudSelected(prev => {
                          const next = new Set(prev);
                          if (next.has(img.url)) next.delete(img.url); else next.add(img.url);
                          return next;
                        });
                      }}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all active:scale-95 ${
                          isSel ? "border-foreground ring-1 ring-foreground/30" : "border-muted hover:border-muted-foreground/40"
                        }`}>
                        <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    );
                  })}
                </div>
                <Button variant={theme === "girl" ? "game-pink" : "game-blue"} size="sm"
                  className="w-full rounded-xl" disabled={cloudSelected.size === 0 || uploading}
                  onClick={() => importFromCloud(openSetId)}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  ייבוא {cloudSelected.size} תמונות
                </Button>
              </>
            )}
          </div>
        )}

        {/* Edit form inline if editing */}
        {showNewSet && editSetId === openSetId && (
          <div className="bg-card rounded-2xl p-4 border-2 border-game-pink/30 shadow-lg space-y-3 bounce-in max-h-[60vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">✏️ עריכת ערכה</h3>
              <button onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            {renderSetForm()}
          </div>
        )}

        {setItems.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border-2 border-dashed border-muted space-y-2">
            <div className="text-4xl">📷</div>
            <p className="text-sm text-muted-foreground">אין עדיין קלפים. העלו תמונות!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {setItems.map((card, i) => (
              <div key={card.id} className="relative group rounded-xl overflow-hidden border-2 border-muted bg-card bounce-in shadow-sm"
                style={{ animationDelay: `${i * 0.04}s` }}>
                {card.image_url ? (
                  <img src={card.image_url} alt={card.label || ""} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-3xl bg-muted">{card.emoji}</div>
                )}
                <div className="px-2 py-1">
                  <input type="text" value={card.label || ""} onChange={e => updateCardLabel(openSetId, card.id, e.target.value)}
                    className="w-full text-[10px] font-bold bg-transparent border-none focus:outline-none text-center truncate"
                    placeholder="שם..." dir="rtl" />
                </div>
                <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => downloadCard(card)}
                    className="w-6 h-6 rounded-md bg-card/90 shadow flex items-center justify-center hover:bg-card transition-all active:scale-90">
                    <Download className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteCard(openSetId, card.id)}
                    className="w-6 h-6 rounded-md bg-card/90 shadow flex items-center justify-center hover:bg-destructive/10 transition-all active:scale-90">
                    <Trash2 className="w-3 h-3 text-destructive/70" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Shared form renderer ───
  function renderSetForm() {
    return (
      <>
        <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
          placeholder="שם הערכה..." dir="rtl"
          className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-game-pink" />

        <div>
          <p className="text-xs font-bold text-muted-foreground mb-1">אימוג׳י</p>
          <div className="flex flex-wrap gap-2">
            {SET_EMOJIS.map(e => (
              <button key={e} onClick={() => setFormEmoji(e)}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all active:scale-90 ${
                  formEmoji === e ? "ring-2 ring-game-pink bg-game-pink/10 scale-110" : "bg-muted hover:scale-105"
                }`}>{e}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted-foreground mb-1">צבע</p>
          <div className="flex gap-2">
            {SET_COLORS.map(c => (
              <button key={c} onClick={() => setFormColor(c)}
                className={`w-7 h-7 rounded-full transition-all active:scale-90 ${
                  formColor === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"
                }`} style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-all text-xs font-bold text-muted-foreground active:scale-[0.98]">
          <Sparkles className="w-4 h-4" />
          {showAdvanced ? "הסתר הגדרות מתקדמות ▲" : "הגדרות מתקדמות ▼"}
        </button>

        {showAdvanced && (
          <div className="space-y-4 bg-muted/30 rounded-xl p-3">
            {/* Floating emojis */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> אלמנטים צפים
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FLOATING_EMOJI_OPTIONS.map(e => {
                  const selected = (formSettings.floatingEmojis || []).includes(e);
                  return (
                    <button key={e} onClick={() => toggleFloatingEmoji(e)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all active:scale-90 ${
                        selected ? "ring-2 ring-game-pink bg-game-pink/15 scale-110" : "bg-card hover:scale-105"
                      }`}>{e}</button>
                  );
                })}
              </div>
              {(formSettings.floatingEmojis || []).length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">נבחרו: {(formSettings.floatingEmojis || []).join(" ")}</p>
              )}
            </div>

            {/* Flip duration */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" /> מהירות היפוך (שניות)
              </p>
              <div className="flex gap-2 items-center">
                <input type="range" min={0.3} max={3} step={0.1} value={formSettings.flipDuration ?? 1}
                  onChange={e => updateFormSetting("flipDuration", Number(e.target.value))} className="flex-1 accent-game-pink" />
                <span className="text-xs font-bold w-8 text-center">{formSettings.flipDuration ?? 1}s</span>
              </div>
            </div>

            {/* Emoji scale */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1">גודל אלמנט (סקייל)</p>
              <div className="flex gap-2 items-center">
                <input type="range" min={0.5} max={2} step={0.1} value={formSettings.emojiScale ?? 1}
                  onChange={e => updateFormSetting("emojiScale", Number(e.target.value))} className="flex-1 accent-game-pink" />
                <span className="text-xs font-bold w-8 text-center">×{formSettings.emojiScale ?? 1}</span>
              </div>
            </div>

            {/* Pair count */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                <Timer className="w-3 h-3" /> מספר זוגות
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                  <button key={n} onClick={() => updateFormSetting("pairCount", n)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all active:scale-90 ${
                      (formSettings.pairCount ?? 0) === n ? `${accent} text-primary-foreground shadow-md` : "bg-card hover:bg-muted"
                    }`}>{n}</button>
                ))}
              </div>
            </div>

            {/* Sound / Speech */}
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <input type="checkbox" checked={formSettings.soundEnabled !== false}
                  onChange={e => updateFormSetting("soundEnabled", e.target.checked)} className="rounded accent-game-pink" />
                🔊 צלילים
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <input type="checkbox" checked={formSettings.speechEnabled !== false}
                  onChange={e => updateFormSetting("speechEnabled", e.target.checked)} className="rounded accent-game-pink" />
                🗣️ דיבור
              </label>
            </div>

            {formSettings.speechEnabled !== false && (
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">קצב דיבור</p>
                <div className="flex gap-2 items-center">
                  <input type="range" min={0.3} max={1.5} step={0.1} value={formSettings.speechRate ?? 0.9}
                    onChange={e => updateFormSetting("speechRate", Number(e.target.value))} className="flex-1 accent-game-pink" />
                  <span className="text-xs font-bold w-8 text-center">{formSettings.speechRate ?? 0.9}</span>
                </div>
              </div>
            )}

            {/* Back icon */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1">אייקון גב הקלף</p>
              <div className="flex flex-wrap gap-2">
                {BACK_ICONS.map(ic => (
                  <button key={ic} onClick={() => updateFormSetting("cardBackIcon", ic)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all active:scale-90 ${
                      formSettings.cardBackIcon === ic ? "ring-2 ring-game-pink bg-game-pink/10 scale-110" : "bg-card hover:scale-105"
                    }`}>{ic}</button>
                ))}
              </div>
            </div>

            {/* Card shape */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1">צורת קלף</p>
              <div className="flex gap-2">
                {SHAPES.map(sh => (
                  <button key={sh.id} onClick={() => { updateFormSetting("cardShape", sh.id); updateFormSetting("cardBorderRadius", sh.radius); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      formSettings.cardShape === sh.id ? `${accent} text-primary-foreground shadow-md` : "bg-card hover:bg-muted"
                    }`}>{sh.label}</button>
                ))}
              </div>
            </div>

            {/* Back color */}
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1">צבע גב הקלף</p>
              <div className="flex gap-2 flex-wrap">
                {BACK_COLORS.map(bc => (
                  <button key={bc.id} onClick={() => updateFormSetting("cardBackColor", bc.id)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all active:scale-90 ${
                      formSettings.cardBackColor === bc.id ? `${accent} text-primary-foreground shadow-md` : "bg-card hover:bg-muted"
                    }`}>{bc.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant={theme === "girl" ? "game-pink" : "game-blue"} className="flex-1 rounded-xl"
            onClick={() => saveSet(false)} disabled={!formName.trim()}>
            {editSetId ? "💾 שמירה" : "➕ צור ערכה"}
          </Button>
          {editSetId && (
            <Button variant="outline" className="rounded-xl gap-1"
              onClick={() => saveSet(true)} disabled={!formName.trim()}>
              <Copy className="w-4 h-4" /> שמור כחדשה
            </Button>
          )}
        </div>
      </>
    );
  }

  // ─── Main sets list ───
  return (
    <div className="space-y-3">
      {showNewSet && (
        <div className="bg-card rounded-2xl p-4 border-2 border-muted shadow-lg space-y-3 bounce-in max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">{editSetId ? "✏️ עריכת ערכה" : "➕ ערכה חדשה"}</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          {renderSetForm()}
        </div>
      )}

      {!showNewSet && (
        <button onClick={() => { resetForm(); setShowNewSet(true); }}
          className="w-full h-14 rounded-2xl border-2 border-dashed border-muted flex items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-all active:scale-[0.98]">
          <Plus className="w-5 h-5" />
          <span className="font-bold text-sm">צור ערכת קלפים חדשה</span>
        </button>
      )}

      {sets.length === 0 && !showNewSet && (
        <div className="bg-card rounded-2xl p-8 text-center border-2 border-dashed border-muted space-y-2">
          <div className="text-4xl bounce-in">🎴</div>
          <p className="font-bold">אין ערכות מותאמות</p>
          <p className="text-xs text-muted-foreground">צרו ערכת קלפים חדשה מתמונות שלכם!</p>
        </div>
      )}

      {sets.map((s, i) => {
        const setItems = cards[s.id] || [];
        const itemCount = setItems.length;
        const hasSettings = Object.keys((s.settings_json as any) || {}).length > 0;
        return (
          <div key={s.id} className="rounded-2xl border-2 overflow-hidden shadow-md bounce-in transition-all hover:shadow-lg"
            style={{ borderColor: s.color + "60", animationDelay: `${i * 0.06}s` }}>
            <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => { setOpenSetId(s.id); if (!cards[s.id]) loadCards(s.id); }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
                style={{ backgroundColor: s.color + "20", border: `2px solid ${s.color}` }}>
                {s.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm truncate">{s.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {itemCount > 0 ? `${itemCount} קלפים` : "ערכה ריקה"}
                  {hasSettings && " • ⚙️ מותאם"}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={e => { e.stopPropagation(); editSet(s); }}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all active:scale-90">
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={e => { e.stopPropagation(); duplicateSet(s); }}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all active:scale-90">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={e => { e.stopPropagation(); playSet(s); }}
                  className="p-2 rounded-lg transition-all active:scale-90"
                  style={{ backgroundColor: s.color + "20" }} disabled={itemCount < 2}>
                  <Play className="w-3.5 h-3.5" style={{ color: s.color }} />
                </button>
                <button onClick={e => { e.stopPropagation(); deleteSet(s.id); }}
                  className="p-2 rounded-lg bg-muted hover:bg-destructive/10 transition-all active:scale-90">
                  <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                </button>
              </div>
            </div>
            {itemCount > 0 && (
              <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
                {setItems.slice(0, 6).map(c => (
                  <div key={c.id} className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-muted">
                    {c.image_url ? (
                      <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm bg-muted">{c.emoji}</div>
                    )}
                  </div>
                ))}
                {itemCount > 6 && (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground shrink-0">
                    +{itemCount - 6}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
