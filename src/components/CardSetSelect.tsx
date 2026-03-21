import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CardData, CardSetType, GameSettings, getCardSets } from "@/lib/gameData";
import { BUILT_IN_MELODIES } from "@/lib/melodies";
import {
  Upload, Volume2, VolumeX, Music, Trash2, Cloud, Loader2,
  Image, Palette, LayoutGrid, Cake, Mic, Settings, X, Plus, Layers, Grid3X3, Move, Paintbrush, Code2, FolderOpen
} from "lucide-react";
import DevPanel from "@/components/DevPanel";
import VoiceRecorder from "@/components/VoiceRecorder";
import BirthdayManager from "@/components/BirthdayManager";
import CloudGallery from "@/components/CloudGallery";
import CustomCardSets from "@/components/CustomCardSets";
import { useCloudSettings } from "@/hooks/useCloudSettings";
import { getBgThemes } from "@/components/ThemeBackground";
import { supabase } from "@/integrations/supabase/client";
import FloatingPanel from "@/components/FloatingPanel";
import ThemeBuilder from "@/components/ThemeBuilder";



interface CardSetSelectProps {
  onSelectSet: (set: CardSetType, settings: GameSettings, customCards?: CardData[]) => void;
  settingsOpen?: boolean;
  onSettingsToggle?: (open: boolean) => void;
  settingsOnly?: boolean;
}

type SettingsTabId = "general" | "music" | "cards" | "themes" | "gallery" | "custom-sets" | "birthdays" | "recordings" | "dev";

const BACK_ICONS = ["⭐", "❓", "🎴", "🃏", "💫", "🌟", "🎯", "🔮", "🎪", "🎨"];
const BACK_COLORS = [
  { id: "default", label: "ברירת מחדל", css: "" },
  { id: "red", label: "אדום", css: "from-red-400 to-rose-500" },
  { id: "green", label: "ירוק", css: "from-emerald-400 to-green-500" },
  { id: "purple", label: "סגול", css: "from-purple-400 to-violet-500" },
  { id: "orange", label: "כתום", css: "from-orange-400 to-amber-500" },
  { id: "cyan", label: "תכלת", css: "from-cyan-400 to-sky-500" },
  { id: "gold", label: "זהב", css: "from-yellow-400 to-amber-500" },
];
const BORDER_COLORS = [
  { id: "default", label: "ברירת מחדל", color: "hsl(var(--background))" },
  { id: "white", label: "לבן", color: "#ffffff" },
  { id: "black", label: "שחור", color: "#1a1a2e" },
  { id: "gold", label: "זהב", color: "#d4a574" },
  { id: "pink", label: "ורוד", color: "hsl(var(--game-pink))" },
  { id: "blue", label: "כחול", color: "hsl(var(--game-blue))" },
  { id: "green", label: "ירוק", color: "#22c55e" },
];
const SHAPES = [
  { id: "square", label: "ריבוע", radius: 16 },
  { id: "rounded", label: "מעוגל", radius: 24 },
  { id: "pill", label: "כמוסה", radius: 9999 },
  { id: "sharp", label: "חד", radius: 4 },
];

const FLOATING_EMOJIS = ["🧸", "🎈", "🌈", "⭐", "🦄", "🎀", "🍭", "🌸", "💖", "🎪", "🐰", "🦋"];

// Gradient palette for custom sets
const CUSTOM_GRADIENTS = [
  "from-pink-400 to-rose-500",
  "from-purple-400 to-violet-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-green-500",
  "from-orange-400 to-amber-500",
  "from-fuchsia-400 to-pink-500",
  "from-teal-400 to-cyan-500",
  "from-indigo-400 to-purple-500",
];

interface CustomSetPreview {
  id: string;
  name: string;
  emoji: string;
  color: string;
  cardCount: number;
}

function getDeviceId(): string {
  const key = "memory-game-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export default function CardSetSelect({ onSelectSet, settingsOpen, onSettingsToggle, settingsOnly }: CardSetSelectProps) {
  const theme = "girl";
  const [_showSettings, _setShowSettings] = useState(false);
  const showSettings = settingsOpen !== undefined ? settingsOpen : _showSettings;
  const setShowSettings = onSettingsToggle || _setShowSettings;
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>("general");
  const [showCloudGallery, setShowCloudGallery] = useState(false);
  const [showCloudAudio, setShowCloudAudio] = useState(false);
  const [customSets, setCustomSets] = useState<CustomSetPreview[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [customBgThemes, setCustomBgThemes] = useState<any[]>([]);
  const [layoutPresets, setLayoutPresets] = useState<any[]>([]);
  const audioRef = useRef<HTMLInputElement>(null);

  const { settings: cloud, loaded, updateSetting, updateCardStyle, toGameSettings } = useCloudSettings(theme);

  const pairCount = cloud.pairCount;
  const cardMaxW = cloud.cardMaxW;
  const emojiScale = cloud.emojiScale;
  const soundEnabled = cloud.soundEnabled;
  const flipDuration = cloud.flipDuration;
  const musicType = cloud.musicType;
  const builtinMelodyId = cloud.builtinMelodyId || "twinkle";
  const customMusic = cloud.customMusic;
  const customMusicName = cloud.customMusicName || "";
  const cardStyle = cloud.cardStyle;

  const accent = "bg-game-pink";
  const sliderTrack = "accent-[hsl(var(--game-pink))]";
  const settings = toGameSettings();
  const deviceId = getDeviceId();

  // Load custom sets for home page display
  const loadCustomSets = useCallback(async () => {
    setLoadingSets(true);
    const { data: sets } = await supabase
      .from("custom_card_sets")
      .select("id, name, emoji, color")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });

    if (sets && sets.length > 0) {
      // Get card counts
      const { data: items } = await supabase
        .from("custom_card_items")
        .select("set_id")
        .in("set_id", sets.map(s => s.id));

      const counts: Record<string, number> = {};
      (items || []).forEach(i => { counts[i.set_id] = (counts[i.set_id] || 0) + 1; });

      setCustomSets(sets.map(s => ({
        ...s,
        cardCount: counts[s.id] || 0,
      })));
    } else {
      setCustomSets([]);
    }
    setLoadingSets(false);
  }, [deviceId]);

  useEffect(() => { loadCustomSets(); }, [loadCustomSets]);

  // Load custom bg themes
  useEffect(() => {
    const loadBgThemes = async () => {
      const { data } = await supabase
        .from("custom_bg_themes")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false });
      setCustomBgThemes(data || []);
    };
    loadBgThemes();
  }, [deviceId]);

  // Load layout presets
  const loadLayoutPresets = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("layout_presets")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });
    setLayoutPresets(data || []);
  }, [deviceId]);

  useEffect(() => { loadLayoutPresets(); }, [loadLayoutPresets]);

  const loadPreset = (preset: any) => {
    if (preset.positions) {
      updateSetting("cardPositions" as any, preset.positions);
    }
  };

  const deletePreset = async (id: string) => {
    await (supabase as any).from("layout_presets").delete().eq("id", id);
    loadLayoutPresets();
  };

  // Play a custom set
  const playCustomSet = async (setPreview: CustomSetPreview) => {
    if (setPreview.cardCount < 2) {
      // Open settings to manage this set
      setShowSettings(true);
      setSettingsTab("custom-sets");
      return;
    }
    const { data } = await supabase
      .from("custom_card_items")
      .select("*")
      .eq("set_id", setPreview.id)
      .order("sort_order", { ascending: true });

    if (!data || data.length < 2) return;
    const gameCards: CardData[] = data.map((c, i) => ({
      id: `custom-set-${setPreview.id}-${i}`,
      emoji: c.emoji || "📷",
      label: c.label || undefined,
      image: c.image_url || undefined,
    }));
    const customPairCount = Math.min(settings.pairCount, gameCards.length);
    onSelectSet("custom", { ...settings, pairCount: customPairCount }, gameCards);
  };

  if (!loaded && !settingsOnly) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const SETTINGS_TABS: { id: SettingsTabId; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "כללי", icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "cards", label: "קלפים", icon: <Palette className="w-4 h-4" /> },
    { id: "themes", label: "ערכות נושא", icon: <Paintbrush className="w-4 h-4" /> },
    { id: "music", label: "מוזיקה", icon: <Music className="w-4 h-4" /> },
    { id: "custom-sets", label: "ערכות", icon: <Layers className="w-4 h-4" /> },
    { id: "gallery", label: "גלריה", icon: <Image className="w-4 h-4" /> },
    { id: "birthdays", label: "ימי הולדת", icon: <Cake className="w-4 h-4" /> },
    { id: "recordings", label: "הקלטות", icon: <Mic className="w-4 h-4" /> },
    { id: "dev", label: "פיתוח", icon: <Code2 className="w-4 h-4" /> },
  ];

  const previewCardStyle: React.CSSProperties = {
    borderRadius: `${cardStyle.borderRadius}px`,
    borderWidth: `${cardStyle.borderWidth}px`,
    borderColor: cardStyle.borderColor === "default" ? "hsl(var(--background))" : BORDER_COLORS.find(c => c.id === cardStyle.borderColor)?.color || "hsl(var(--background))",
    borderStyle: "solid",
  };

  const allCardSets = getCardSets("girl");

  // Get home page background from selected theme (builtin or custom)
  const bgThemeId = cloud.bgTheme || "default";
  let homeBg = "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 30%, #f3e5f5 60%, #fff9c4 100%)";
  if (bgThemeId.startsWith("custom:")) {
    const cid = bgThemeId.replace("custom:", "");
    const ct = customBgThemes.find((t: any) => t.id === cid);
    if (ct && ct.config) {
      const cfg = ct.config;
      homeBg = cfg.bgType === "solid" ? cfg.bgColor1 : `linear-gradient(${cfg.gradientAngle || 135}deg, ${cfg.bgColor1} 0%, ${cfg.bgColor2} 50%, ${cfg.bgColor3} 100%)`;
    }
  } else {
    const selectedBgTheme = getBgThemes().find(t => t.id === bgThemeId);
    if (selectedBgTheme?.bg && selectedBgTheme.bg !== "transparent") {
      homeBg = selectedBgTheme.bg;
    }
  }



  return (
    <>
    {!settingsOnly && (
    <div
      className={`flex flex-col items-center min-h-screen gap-4 sm:gap-6 px-3 sm:px-5 py-6 sm:py-8 pb-24 sm:pb-28 overflow-y-auto relative ${cloud.animationsEnabled === false ? "no-animations" : ""}`}
      dir="rtl"
      style={{ background: homeBg }}
    >
      {/* Floating decorations */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {FLOATING_EMOJIS.map((emoji, i) => {
          const size = 20 + (i % 4) * 10;
          const left = (i * 8.3) % 92;
          const top = (i * 11.7 + 3) % 88;
          const delay = i * 0.9;
          const duration = 7 + (i % 5) * 2;
          return (
            <span key={i} className="absolute select-none"
              style={{
                fontSize: `${size}px`, left: `${left}%`, top: `${top}%`,
                opacity: 0.25 + (i % 3) * 0.08,
                animation: `floatBg ${duration}s ease-in-out ${delay}s infinite alternate`,
              }}
            >{emoji}</span>
          );
        })}
      </div>

      {/* Title */}
      <div className="relative z-10 text-center bounce-in mt-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground leading-tight">
          🎮 משחקי זיכרון 🎮
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">בחרו ערכה להתחיל לשחק!</p>
      </div>

      {/* Card set grid — built-in + custom + add button */}
      <div className="w-full max-w-lg relative z-10 grid grid-cols-2 gap-4 bounce-in" style={{ animationDelay: "0.1s" }}>
        {/* Built-in sets */}
        {allCardSets.map((set, i) => (
          <button key={set.type}
            onClick={() => onSelectSet(set.type, settings)}
            className={`bg-gradient-to-br ${set.color} rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 active:scale-95 bounce-in text-primary-foreground min-h-[120px]`}
            style={{ animationDelay: `${0.15 + i * 0.08}s` }}
          >
            <span className="text-5xl drop-shadow-sm">{set.emoji}</span>
            <span className="font-bold text-sm">{set.label}</span>
          </button>
        ))}

        {/* Custom sets as identical cards */}
        {customSets.map((cs, i) => {
          const gradientIdx = i % CUSTOM_GRADIENTS.length;
          return (
            <button key={cs.id}
              onClick={() => playCustomSet(cs)}
              className={`bg-gradient-to-br ${CUSTOM_GRADIENTS[gradientIdx]} rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 active:scale-95 bounce-in text-primary-foreground relative min-h-[120px]`}
              style={{ animationDelay: `${0.15 + (allCardSets.length + i) * 0.08}s` }}
            >
              <span className="text-5xl drop-shadow-sm">{cs.emoji}</span>
              <span className="font-bold text-sm">{cs.name}</span>
              {cs.cardCount > 0 && (
                <span className="absolute top-2 left-2 text-[10px] bg-white/30 backdrop-blur-sm rounded-full px-2 py-0.5 font-bold">
                  {cs.cardCount} קלפים
                </span>
              )}
              {cs.cardCount < 2 && (
                <span className="absolute bottom-1.5 text-[9px] bg-white/30 backdrop-blur-sm rounded-full px-2 py-0.5 font-bold">
                  ערכה ריקה
                </span>
              )}
            </button>
          );
        })}

        {/* Add new set button — smaller */}
        <button
          onClick={() => { setShowSettings(true); setSettingsTab("custom-sets"); }}
          className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 active:scale-95 bounce-in border-2 border-dashed border-game-pink/30 bg-white/50 backdrop-blur-sm min-h-[120px]"
          style={{ animationDelay: `${0.15 + (allCardSets.length + customSets.length) * 0.08}s` }}
        >
          <div className="w-9 h-9 rounded-full bg-game-pink/15 flex items-center justify-center">
            <Plus className="w-5 h-5 text-game-pink" />
          </div>
          <span className="font-bold text-xs text-game-pink">ערכה חדשה</span>
        </button>
      </div>
    </div>
    )}

      {/* ══════════════════ Settings Panel (Floating) ══════════════════ */}
      <FloatingPanel
        open={showSettings}
        onClose={() => { setShowSettings(false); loadCustomSets(); }}
        onConfirm={() => { setShowSettings(false); loadCustomSets(); }}
        title="⚙️ הגדרות"
        titleIcon={<Settings className="w-5 h-5" />}
        defaultWidth={580}
        defaultHeight={540}
      >
            {/* Tabs */}
            <div className="flex gap-1 bg-muted px-3 py-2 overflow-x-auto shrink-0">
              {SETTINGS_TABS.map((tab) => (
                <button key={tab.id} onClick={() => setSettingsTab(tab.id)}
                  className={`shrink-0 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                    settingsTab === tab.id ? `${accent} text-primary-foreground shadow-md` : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Settings content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">

              {/* ═══ GENERAL ═══ */}
              {settingsTab === "general" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-sm">🎯 מספר זוגות</p>
                      <span className={`text-sm font-black px-3 py-0.5 rounded-full ${accent} text-primary-foreground`}>{pairCount} זוגות</span>
                    </div>
                    <input type="range" min={2} max={16} step={1} value={pairCount}
                      onChange={(e) => updateSetting("pairCount", Number(e.target.value))}
                      className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>2 קל 😊</span><span>8 בינוני 🤔</span><span>16 קשה 🔥</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-sm">📐 גודל קלפים</p>
                      <span className="text-xs text-muted-foreground">{cardMaxW}px</span>
                    </div>
                    <input type="range" min={120} max={1200} step={20} value={cardMaxW}
                      onChange={(e) => updateSetting("cardMaxW", Number(e.target.value))}
                      className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>קטן</span><span>גדול</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-sm">🔤 גודל אלמנט</p>
                      <span className="text-xs text-muted-foreground">×{emojiScale.toFixed(1)}</span>
                    </div>
                    <input type="range" min={0.3} max={4} step={0.1} value={emojiScale}
                      onChange={(e) => updateSetting("emojiScale", Number(e.target.value))}
                      className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>קטן</span><span>גדול</span></div>
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-2">⏱️ זמן תצוגת קלפים</p>
                    <div className="flex gap-2">
                      {[{ val: 0.5, label: "חצי שנייה" }, { val: 1, label: "שנייה" }, { val: 2, label: "2 שניות" }, { val: 3, label: "3 שניות" }].map((opt) => (
                        <button key={opt.val} onClick={() => updateSetting("flipDuration", opt.val)}
                          className={`flex-1 h-11 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                            flipDuration === opt.val ? "bg-game-pink text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}>{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateSetting("soundEnabled", !soundEnabled)}
                      className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        soundEnabled ? "bg-accent text-accent-foreground shadow-md" : "bg-muted text-muted-foreground"
                      }`}>
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      {soundEnabled ? "🔊 צלילים" : "🔇 צלילים"}
                    </button>
                    <button onClick={() => updateSetting("speechEnabled", !cloud.speechEnabled)}
                      className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        cloud.speechEnabled ? "bg-accent text-accent-foreground shadow-md" : "bg-muted text-muted-foreground"
                      }`}>
                      {cloud.speechEnabled ? "🗣️ הכרזה" : "🔇 הכרזה"}
                    </button>
                  </div>
                  {cloud.speechEnabled && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-sm">🗣️ מהירות הקריין</p>
                        <span className="text-xs text-muted-foreground">×{(cloud.speechRate || 0.9).toFixed(1)}</span>
                      </div>
                      <input type="range" min={0.3} max={1.5} step={0.1} value={cloud.speechRate || 0.9}
                        onChange={(e) => updateSetting("speechRate", Number(e.target.value))}
                        className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`} />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>איטי</span><span>רגיל</span><span>מהיר</span></div>
                    </div>
                  )}

                  {/* Layout mode */}
                  <div>
                    <p className="font-bold text-sm mb-2">📐 מיקום קלפים</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSetting("layoutMode" as any, "grid")}
                        className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                          (cloud.layoutMode || "grid") === "grid"
                            ? "bg-game-pink text-primary-foreground shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        גריד אוטומטי
                      </button>
                      <button
                        onClick={() => updateSetting("layoutMode" as any, "free")}
                        className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                          cloud.layoutMode === "free"
                            ? "bg-game-orange text-primary-foreground shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <Move className="w-4 h-4" />
                        חופשי (גרירה)
                      </button>
                    </div>
                    {cloud.layoutMode === "free" && (
                      <div className="mt-3 space-y-3 p-3 bg-muted/50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">🧲 הצמד לגריד</span>
                          <button
                            onClick={() => updateSetting("snapToGrid" as any, cloud.snapToGrid === false ? true : false)}
                            className={`w-12 h-7 rounded-full transition-all ${
                              cloud.snapToGrid !== false ? "bg-accent" : "bg-muted-foreground/30"
                            } relative`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-all absolute top-1 ${
                              cloud.snapToGrid !== false ? "right-1" : "left-1"
                            }`} />
                          </button>
                        </div>
                        {cloud.snapToGrid !== false && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-muted-foreground">גודל גריד</span>
                              <span className="text-xs text-muted-foreground">{cloud.gridSize || 20}px</span>
                            </div>
                            <input type="range" min={10} max={50} step={5} value={cloud.gridSize || 20}
                              onChange={(e) => updateSetting("gridSize" as any, Number(e.target.value))}
                              className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`} />
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground">💡 במשחק לחצו על 🔓 כדי להפעיל מצב עריכה וגררו את הקלפים</p>

                        {/* Saved layout presets */}
                        {layoutPresets.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-muted">
                            <p className="text-xs font-bold">📦 פריסות שמורות</p>
                            {layoutPresets.map((p: any) => (
                              <div key={p.id} className="flex items-center gap-2 bg-background/60 rounded-lg px-2.5 py-1.5">
                                <FolderOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs font-bold flex-1 truncate">{p.name}</span>
                                <span className="text-[10px] text-muted-foreground">{p.pair_count} זוגות</span>
                                <button
                                  onClick={() => loadPreset(p)}
                                  className="text-[10px] font-bold text-game-blue hover:underline"
                                >טען</button>
                                <button
                                  onClick={() => deletePreset(p.id)}
                                  className="text-destructive hover:text-destructive/80"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                   </div>

                  {/* Animations toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div>
                      <p className="font-bold text-sm">✨ אנימציות ואפקטים</p>
                      <p className="text-[10px] text-muted-foreground">הפעלה/כיבוי של כל האנימציות, אפקטים חזותיים וקונפטי</p>
                    </div>
                    <button
                      onClick={() => updateSetting("animationsEnabled", cloud.animationsEnabled === false ? true : false)}
                      className={`w-12 h-7 rounded-full transition-all ${
                        cloud.animationsEnabled !== false ? "bg-accent" : "bg-muted-foreground/30"
                      } relative`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-all absolute top-1 ${
                        cloud.animationsEnabled !== false ? "right-1" : "left-1"
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ THEMES ═══ */}
              {settingsTab === "themes" && (
                <ThemeBuilder
                  selectedThemeId={cloud.bgTheme || "default"}
                  onSelectTheme={(id) => updateSetting("bgTheme" as any, id)}
                />
              )}

              {/* ═══ CARDS ═══ */}
              {settingsTab === "cards" && (
                <div className="space-y-5">
                  <p className="font-bold text-lg text-center">🎨 עיצוב הקלפים</p>
                  <div className="flex justify-center gap-3 py-2">
                    <div className="w-20 h-24 flex items-center justify-center shadow-lg transition-all duration-300"
                      style={{
                        ...previewCardStyle,
                        ...(/^#/.test(cardStyle.backColor)
                          ? { background: cardStyle.backColor2 ? `linear-gradient(135deg, ${cardStyle.backColor}, ${cardStyle.backColor2})` : cardStyle.backColor }
                          : cardStyle.backColor === "default" ? { background: "linear-gradient(135deg, hsl(var(--game-pink)), hsl(var(--primary)))" } : {}),
                      }}>
                      <span className="text-2xl drop-shadow-sm">{cardStyle.backIcon}</span>
                    </div>
                    <div className="w-20 h-24 bg-card flex items-center justify-center shadow-lg transition-all duration-300"
                      style={{ ...previewCardStyle, borderColor: /^#/.test(cardStyle.borderColor) ? cardStyle.borderColor : previewCardStyle.borderColor }}>
                      <span className="text-2xl">🐰</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-2">📐 צורת הקלף</p>
                    <div className="flex gap-2">
                      {SHAPES.map((s) => (
                        <button key={s.id} onClick={() => { updateCardStyle("shape", s.id); updateCardStyle("borderRadius", s.radius); }}
                          className={`flex-1 h-12 font-bold text-xs transition-all active:scale-95 flex items-center justify-center ${
                            cardStyle.shape === s.id ? "bg-game-pink text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`} style={{ borderRadius: `${Math.min(s.radius, 16)}px` }}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-sm">🖼️ עובי מסגרת</p>
                      <span className="text-xs text-muted-foreground">{cardStyle.borderWidth}px</span>
                    </div>
                    <input type="range" min={0} max={8} step={1} value={cardStyle.borderWidth}
                      onChange={(e) => updateCardStyle("borderWidth", Number(e.target.value))}
                      className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>ללא</span><span>עבה</span></div>
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-2">🎨 צבע מסגרת</p>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap gap-2 flex-1">
                        {BORDER_COLORS.map((c) => (
                          <button key={c.id} onClick={() => updateCardStyle("borderColor", c.id)}
                            className={`w-9 h-9 rounded-full transition-all active:scale-90 shadow-sm ${cardStyle.borderColor === c.id ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"}`}
                            style={{ backgroundColor: c.color }} title={c.label} />
                        ))}
                      </div>
                      <label className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/40 cursor-pointer hover:scale-105 transition-all shrink-0" title="בחרו צבע מותאם">
                        <input type="color" value={/^#/.test(cardStyle.borderColor) ? cardStyle.borderColor : "#ffffff"}
                          onChange={(e) => updateCardStyle("borderColor", e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground"
                          style={{ backgroundColor: /^#/.test(cardStyle.borderColor) ? cardStyle.borderColor : undefined }}>
                          {!/^#/.test(cardStyle.borderColor) && "🎨"}
                        </div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-2">🃏 צבע גב הקלף</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {BACK_COLORS.map((c) => (
                        <button key={c.id} onClick={() => { updateCardStyle("backColor", c.id); updateCardStyle("backColor2" as any, undefined); }}
                          className={`h-9 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            cardStyle.backColor === c.id ? "bg-game-pink text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}>{c.label}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <label className="flex flex-col items-center gap-1 cursor-pointer">
                          <span className="text-[10px] text-muted-foreground font-bold">צבע 1</span>
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-muted shadow-sm">
                            <input type="color" value={/^#/.test(cardStyle.backColor) ? cardStyle.backColor : "#ff6b9d"}
                              onChange={(e) => updateCardStyle("backColor", e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <div className="w-full h-full" style={{ backgroundColor: /^#/.test(cardStyle.backColor) ? cardStyle.backColor : "#ff6b9d" }} />
                          </div>
                        </label>
                        <span className="text-lg text-muted-foreground mt-4">→</span>
                        <label className="flex flex-col items-center gap-1 cursor-pointer">
                          <span className="text-[10px] text-muted-foreground font-bold">צבע 2</span>
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-muted shadow-sm">
                            <input type="color" value={cardStyle.backColor2 && /^#/.test(cardStyle.backColor2) ? cardStyle.backColor2 : "#6366f1"}
                              onChange={(e) => { if (!/^#/.test(cardStyle.backColor)) updateCardStyle("backColor", "#ff6b9d"); updateCardStyle("backColor2" as any, e.target.value); }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <div className="w-full h-full" style={{ backgroundColor: cardStyle.backColor2 && /^#/.test(cardStyle.backColor2) ? cardStyle.backColor2 : "#6366f1" }} />
                          </div>
                        </label>
                      </div>
                      {/^#/.test(cardStyle.backColor) && (
                        <div className="w-14 h-10 rounded-xl border-2 border-muted shadow-sm mt-4"
                          style={{ background: cardStyle.backColor2 ? `linear-gradient(135deg, ${cardStyle.backColor}, ${cardStyle.backColor2})` : cardStyle.backColor }} />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 text-center">בחרו 2 צבעים ליצירת גרדיאנט</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-2">✨ אייקון / טקסט על גב הקלף</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {BACK_ICONS.map((icon) => (
                        <button key={icon} onClick={() => updateCardStyle("backIcon", icon)}
                          className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all active:scale-90 ${
                            cardStyle.backIcon === icon ? "bg-game-pink/20 border-2 border-game-pink shadow-sm" : "bg-muted border-2 border-transparent hover:bg-muted/80"
                          }`}>{icon}</button>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="text" maxLength={10} placeholder="או הקלידו טקסט..."
                        value={BACK_ICONS.includes(cardStyle.backIcon) ? "" : cardStyle.backIcon}
                        onChange={(e) => updateCardStyle("backIcon", e.target.value || "⭐")}
                        className="flex-1 h-10 rounded-xl bg-muted px-3 text-sm font-bold text-center border-2 border-muted-foreground/20 focus:border-foreground/40 outline-none transition-colors placeholder:text-muted-foreground/50" dir="auto" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">הקלידו שם, אות, או כל טקסט קצר</p>
                  </div>
                </div>
              )}

              {/* ═══ MUSIC ═══ */}
              {settingsTab === "music" && (
                <div className="space-y-4">
                  <p className="font-bold text-lg text-center">🎵 מוזיקת רקע</p>
                  <div className="flex gap-1 bg-muted rounded-xl p-1">
                    {([
                      { type: "none" as const, label: "ללא", emoji: "🔇" },
                      { type: "builtin" as const, label: "שירים", emoji: "🎶" },
                      { type: "custom" as const, label: "העלאה", emoji: "📁" },
                      { type: "cloud" as const, label: "ענן", emoji: "☁️" },
                    ]).map((opt) => (
                      <button key={opt.type} onClick={() => updateSetting("musicType", opt.type)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                          musicType === opt.type ? "bg-game-pink text-primary-foreground shadow-sm" : "text-muted-foreground"
                        }`}>{opt.emoji} {opt.label}</button>
                    ))}
                  </div>
                  {musicType === "builtin" && (
                    <div className="grid grid-cols-2 gap-2">
                      {BUILT_IN_MELODIES.map((mel) => (
                        <button key={mel.id} onClick={() => updateSetting("builtinMelodyId", mel.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            builtinMelodyId === mel.id ? "bg-game-pink/20 border-2 border-game-pink text-foreground shadow-sm" : "bg-muted/60 border-2 border-transparent text-muted-foreground hover:bg-muted"
                          }`}>
                          <span className="text-lg">{mel.emoji}</span>
                          <span className="truncate">{mel.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {musicType === "custom" && (
                    <div className="space-y-2">
                      {customMusic ? (
                        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                          <Music className="w-4 h-4 text-accent shrink-0" />
                          <span className="text-xs font-medium truncate flex-1">{customMusicName}</span>
                          <button onClick={() => { updateSetting("customMusic", undefined); updateSetting("customMusicName", ""); }}
                            className="text-destructive hover:text-destructive/80 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => audioRef.current?.click()}
                          className="w-full h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-dashed border-muted-foreground/30">
                          <Upload className="w-4 h-4" /> העלו MP3 / רינגטון / שיר
                        </button>
                      )}
                      <input ref={audioRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                        onChange={(e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          updateSetting("customMusicName", file.name);
                          const reader = new FileReader();
                          reader.onload = (ev) => updateSetting("customMusic", ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }} className="hidden" />
                      <p className="text-[10px] text-muted-foreground text-center">MP3, WAV, M4A, רינגטונים, שירים ועוד</p>
                    </div>
                  )}
                  {musicType === "cloud" && (
                    <div className="space-y-2">
                      {customMusic && customMusicName.startsWith("cloud:") ? (
                        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                          <Music className="w-4 h-4 text-accent shrink-0" />
                          <span className="text-xs font-medium truncate flex-1">{customMusicName.replace("cloud:", "")}</span>
                          <button onClick={() => { updateSetting("customMusic", undefined); updateSetting("customMusicName", ""); }}
                            className="text-destructive hover:text-destructive/80 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setShowCloudAudio(true)}
                          className="w-full h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-dashed border-muted-foreground/30">
                          <Cloud className="w-4 h-4" /> בחרו שיר מהענן
                        </button>
                      )}
                      <p className="text-[10px] text-muted-foreground text-center">העלו ובחרו שירים, רינגטונים ומוזיקה מהענן</p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ CUSTOM SETS ═══ */}
              {settingsTab === "custom-sets" && (
                <div className="space-y-3">
                  <p className="font-bold text-lg text-center">🎴 ערכות מותאמות אישית</p>
                  <CustomCardSets
                    theme={theme}
                    onPlay={(cards, name) => {
                      setShowSettings(false);
                      const customPairCount = Math.min(settings.pairCount, cards.length);
                      onSelectSet("custom", { ...settings, pairCount: customPairCount }, cards);
                    }}
                  />
                </div>
              )}

              {/* ═══ GALLERY ═══ */}
              {settingsTab === "gallery" && (
                <div className="space-y-3 text-center">
                  <p className="font-bold text-lg">📸 גלריה</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setShowSettings(false); setShowCloudGallery(true); }}
                      className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all active:scale-95 text-primary-foreground">
                      <span className="text-4xl">☁️</span>
                      <span className="font-bold text-sm">גלריית ענן</span>
                    </button>
                    <button onClick={() => { setShowSettings(false); setShowCloudGallery(true); }}
                      className="bg-gradient-to-br from-game-orange to-amber-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all active:scale-95 text-primary-foreground">
                      <span className="text-4xl">📸</span>
                      <span className="font-bold text-sm">ניהול תמונות</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ BIRTHDAYS ═══ */}
              {settingsTab === "birthdays" && <BirthdayManager theme={theme} />}

              {/* ═══ RECORDINGS ═══ */}
              {settingsTab === "recordings" && <VoiceRecorder theme={theme} />}

              {/* ═══ DEV ═══ */}
              {settingsTab === "dev" && <DevPanel deviceId={deviceId} />}
            </div>
      </FloatingPanel>

      {/* Modals */}
      {showCloudGallery && (
        <CloudGallery theme={theme}
          onClose={() => setShowCloudGallery(false)}
          onSelect={(urls) => {
            setShowCloudGallery(false);
            const cards: CardData[] = urls.map((url, i) => ({ id: `cloud-${i}`, emoji: "☁️", image: url }));
            const cloudPairCount = Math.min(pairCount, cards.length);
            onSelectSet("custom", { ...settings, pairCount: cloudPairCount }, cards);
          }}
        />
      )}
      {showCloudAudio && (
        <CloudGallery theme={theme} mode="audio"
          onClose={() => setShowCloudAudio(false)}
          onSelect={() => {}}
          onSelectAudio={(url, name) => {
            setShowCloudAudio(false);
            updateSetting("musicType", "cloud");
            updateSetting("customMusic", url);
            updateSetting("customMusicName", `cloud:${name}`);
          }}
        />
      )}
    </>
  );
}
