import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CardData } from "@/lib/gameData";
import { Plus, Trash2, Edit2, Play, X, Upload, Image, Download, FolderUp, Loader2, ChevronRight, ChevronLeft, CloudDownload } from "lucide-react";
import { toast } from "sonner";

interface CustomSet {
  id: string;
  device_id: string;
  name: string;
  emoji: string;
  color: string;
}

interface CustomCard {
  id: string;
  set_id: string;
  label: string | null;
  emoji: string;
  image_url: string | null;
  sort_order: number;
}

const SET_EMOJIS = ["📷", "🎨", "🌟", "🎮", "🎪", "🎈", "🧸", "🦄", "🌈", "🎀", "🐾", "🌺"];
const SET_COLORS = ["#60a5fa", "#f472b6", "#4ade80", "#fb923c", "#a78bfa", "#facc15", "#f87171", "#38bdf8"];

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
}

export default function CustomCardSets({ theme, onPlay }: CustomCardSetsProps) {
  const [sets, setSets] = useState<CustomSet[]>([]);
  const [cards, setCards] = useState<Record<string, CustomCard[]>>({});
  const [loading, setLoading] = useState(true);
  const [openSetId, setOpenSetId] = useState<string | null>(null);
  const [showNewSet, setShowNewSet] = useState(false);
  const [editSetId, setEditSetId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmoji, setFormEmoji] = useState("📷");
  const [formColor, setFormColor] = useState("#60a5fa");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const deviceId = getDeviceId();
  const accent = theme === "girl" ? "bg-game-pink" : "bg-game-blue";

  const loadSets = useCallback(async () => {
    const { data } = await supabase
      .from("custom_card_sets")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });
    if (data) setSets(data as CustomSet[]);
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
    if (openSetId && !cards[openSetId]) {
      loadCards(openSetId);
    }
  }, [openSetId, cards, loadCards]);

  const resetForm = () => {
    setFormName(""); setFormEmoji("📷"); setFormColor("#60a5fa");
    setShowNewSet(false); setEditSetId(null);
  };

  const saveSet = async () => {
    if (!formName.trim()) return;
    if (editSetId) {
      await supabase.from("custom_card_sets").update({
        name: formName, emoji: formEmoji, color: formColor,
        updated_at: new Date().toISOString(),
      }).eq("id", editSetId);
    } else {
      await supabase.from("custom_card_sets").insert({
        device_id: deviceId, name: formName, emoji: formEmoji, color: formColor,
      });
    }
    resetForm();
    loadSets();
  };

  const deleteSet = async (id: string) => {
    // Delete cards' images from storage
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
    setEditSetId(s.id); setShowNewSet(true);
  };

  // Upload images to a set
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
        set_id: setId,
        label: file.name.replace(/\.[^.]+$/, ""),
        emoji: "📷",
        image_url: urlData.publicUrl,
        sort_order: existingCount + i,
      }).select().single();

      if (insertData) newCards.push(insertData as CustomCard);
    }

    setCards(prev => ({
      ...prev,
      [setId]: [...(prev[setId] || []), ...newCards],
    }));
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
    setCards(prev => ({
      ...prev,
      [setId]: (prev[setId] || []).filter(c => c.id !== cardId),
    }));
  };

  const updateCardLabel = async (setId: string, cardId: string, label: string) => {
    await supabase.from("custom_card_items").update({ label }).eq("id", cardId);
    setCards(prev => ({
      ...prev,
      [setId]: (prev[setId] || []).map(c => c.id === cardId ? { ...c, label } : c),
    }));
  };

  const playSet = (s: CustomSet) => {
    const setItems = cards[s.id] || [];
    if (setItems.length < 2) {
      toast.error("צריך לפחות 2 קלפים כדי לשחק");
      return;
    }
    const gameCards: CardData[] = setItems.map((c, i) => ({
      id: `custom-set-${s.id}-${i}`,
      emoji: c.emoji,
      label: c.label || undefined,
      image: c.image_url || undefined,
    }));
    onPlay(gameCards, s.name);
  };

  const downloadCard = async (card: CustomCard) => {
    if (!card.image_url) return;
    try {
      const response = await fetch(card.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (card.label || "card") + ".jpg";
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("שגיאה בהורדה"); }
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  // Viewing a specific set
  if (openSetId) {
    const currentSet = sets.find(s => s.id === openSetId);
    const setItems = cards[openSetId] || [];
    if (!currentSet) return null;

    return (
      <div className="space-y-3 bounce-in">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenSetId(null)} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-all active:scale-95">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xl">{currentSet.emoji}</span>
            <h3 className="font-black text-sm">{currentSet.name}</h3>
            <span className="text-xs text-muted-foreground">({setItems.length} קלפים)</span>
          </div>
          <Button
            variant={theme === "girl" ? "game-pink" : "game-blue"}
            size="sm"
            onClick={() => playSet(currentSet)}
            disabled={setItems.length < 2}
            className="rounded-xl gap-1"
          >
            <Play className="w-4 h-4" /> שחק
          </Button>
        </div>

        {/* Upload area */}
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleUpload(e.target.files, openSetId)} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex-1 rounded-xl gap-1">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            העלאת תמונות
          </Button>
        </div>

        {/* Cards grid */}
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
                  <div className="w-full aspect-square flex items-center justify-center text-3xl bg-muted">
                    {card.emoji}
                  </div>
                )}
                {/* Label */}
                <div className="px-2 py-1">
                  <input
                    type="text"
                    value={card.label || ""}
                    onChange={e => updateCardLabel(openSetId, card.id, e.target.value)}
                    className="w-full text-[10px] font-bold bg-transparent border-none focus:outline-none text-center truncate"
                    placeholder="שם..."
                    dir="rtl"
                  />
                </div>
                {/* Action buttons overlay */}
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

  // Main sets list view
  return (
    <div className="space-y-3">
      {/* New set form */}
      {showNewSet && (
        <div className="bg-card rounded-2xl p-4 border-2 border-muted shadow-lg space-y-3 bounce-in">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">{editSetId ? "✏️ עריכת ערכה" : "➕ ערכה חדשה"}</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
            placeholder="שם הערכה..." dir="rtl"
            className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-pink-300" />
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">אימוג׳י</p>
            <div className="flex flex-wrap gap-2">
              {SET_EMOJIS.map(e => (
                <button key={e} onClick={() => setFormEmoji(e)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all active:scale-90 ${
                    formEmoji === e ? "ring-2 ring-pink-400 bg-pink-50 scale-110" : "bg-muted hover:scale-105"
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
          <Button variant={theme === "girl" ? "game-pink" : "game-blue"} className="w-full rounded-xl"
            onClick={saveSet} disabled={!formName.trim()}>
            {editSetId ? "💾 שמירה" : "➕ צור ערכה"}
          </Button>
        </div>
      )}

      {/* Add button */}
      {!showNewSet && (
        <button
          onClick={() => { resetForm(); setShowNewSet(true); }}
          className="w-full h-14 rounded-2xl border-2 border-dashed border-muted flex items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold text-sm">צור ערכת קלפים חדשה</span>
        </button>
      )}

      {/* Sets list */}
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
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={e => { e.stopPropagation(); editSet(s); }}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all active:scale-90">
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={e => { e.stopPropagation(); playSet(s); }}
                  className="p-2 rounded-lg transition-all active:scale-90"
                  style={{ backgroundColor: s.color + "20" }}
                  disabled={itemCount < 2}>
                  <Play className="w-3.5 h-3.5" style={{ color: s.color }} />
                </button>
                <button onClick={e => { e.stopPropagation(); deleteSet(s.id); }}
                  className="p-2 rounded-lg bg-muted hover:bg-destructive/10 transition-all active:scale-90">
                  <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                </button>
              </div>
            </div>
            {/* Preview strip */}
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
