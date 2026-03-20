import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeType, CardData, CardSetType, GameSettings, getCardSets, CardStyle } from "@/lib/gameData";
import { BUILT_IN_MELODIES } from "@/lib/melodies";
import {
  Upload, Volume2, VolumeX, Music, Trash2, Cloud, Loader2,
  Image, Layers, Palette, LayoutGrid, Cake
} from "lucide-react";
import BirthdayManager from "@/components/BirthdayManager";
import CloudGallery from "@/components/CloudGallery";
import CustomCardSets from "@/components/CustomCardSets";
import { useCloudSettings } from "@/hooks/useCloudSettings";
import { getBgThemes, BgThemeId } from "@/components/ThemeBackground";

interface CardSetSelectProps {
  theme: ThemeType;
  onSelectSet: (set: CardSetType, settings: GameSettings, customCards?: CardData[]) => void;
  onBack: () => void;
}

type TabId = "sets" | "gallery" | "music" | "cards" | "birthdays";

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

export default function CardSetSelect({ theme, onSelectSet, onBack }: CardSetSelectProps) {
  const [activeTab, setActiveTab] = useState<TabId>("sets");
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showCloudGallery, setShowCloudGallery] = useState(false);
  const [showCloudAudio, setShowCloudAudio] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
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

  const accentBtn = theme === "girl" ? "game-pink" as const : "game-blue" as const;
  const accent = theme === "girl" ? "bg-game-pink" : "bg-game-blue";
  const accentText = theme === "girl" ? "text-game-pink" : "text-game-blue";
  const settings = toGameSettings();
  const sliderTrack = theme === "girl" ? "accent-[hsl(var(--game-pink))]" : "accent-[hsl(var(--game-blue))]";

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomImages((prev) => {
          if (prev.length >= 8) return prev;
          return [...prev, ev.target?.result as string];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setCustomImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const startCustom = () => {
    if (customImages.length < 2) return;
    const cards: CardData[] = customImages.map((img, i) => ({
      id: `custom-${i}`,
      emoji: "📷",
      image: img,
    }));
    const customPairCount = Math.min(pairCount, cards.length);
    onSelectSet("custom", { ...settings, pairCount: customPairCount }, cards);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "sets", label: "ערכות", icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "gallery", label: "גלריה", icon: <Image className="w-4 h-4" /> },
    { id: "music", label: "מוזיקה", icon: <Music className="w-4 h-4" /> },
    { id: "cards", label: "קלפים", icon: <Palette className="w-4 h-4" /> },
    { id: "birthdays", label: "ימי הולדת", icon: <Cake className="w-4 h-4" /> },
  ];

  // Card preview for the cards tab
  const previewCardStyle: React.CSSProperties = {
    borderRadius: `${cardStyle.borderRadius}px`,
    borderWidth: `${cardStyle.borderWidth}px`,
    borderColor: cardStyle.borderColor === "default" ? "hsl(var(--background))" : BORDER_COLORS.find(c => c.id === cardStyle.borderColor)?.color || "hsl(var(--background))",
    borderStyle: "solid",
  };

  return (
    <div
      className="flex flex-col items-center min-h-screen gap-4 px-4 py-6 overflow-y-auto relative"
      dir="rtl"
      style={{
        background: theme === "girl"
          ? "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 30%, #f3e5f5 60%, #fff9c4 100%)"
          : "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 30%, #e8eaf6 60%, #e0f7fa 100%)",
      }}
    >
      <Button variant="ghost" onClick={onBack} className="self-start text-muted-foreground">
        → חזרה
      </Button>

      <h2 className="text-2xl sm:text-3xl font-black text-foreground text-center bounce-in">
        {theme === "girl" ? "👧 ערכה לבנות" : "👦 ערכה לבנים"}
      </h2>

      {/* Tab bar */}
      <div className="w-full max-w-md flex gap-1 bg-muted rounded-2xl p-1.5 bounce-in">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex flex-col items-center gap-1 ${
              activeTab === tab.id
                ? `${accent} text-primary-foreground shadow-md`
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="w-full max-w-md bounce-in">

        {/* ═══ SETS TAB ═══ */}
        {activeTab === "sets" && (
          <div className="space-y-4">
            {/* Settings panel */}
            <div className="bg-card rounded-2xl p-5 shadow-lg border-2 border-muted space-y-4">
              {/* Pair count */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-sm">🎯 מספר זוגות</p>
                  <span className={`text-sm font-black px-3 py-0.5 rounded-full ${accent} text-primary-foreground`}>
                    {pairCount} זוגות
                  </span>
                </div>
                <input type="range" min={2} max={16} step={1} value={pairCount}
                  onChange={(e) => updateSetting("pairCount", Number(e.target.value))}
                  className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>2 קל 😊</span><span>8 בינוני 🤔</span><span>16 קשה 🔥</span>
                </div>
              </div>

              {/* Card size slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-sm">📐 גודל קלפים</p>
                  <span className="text-xs text-muted-foreground">{cardMaxW}px</span>
                </div>
                <input type="range" min={280} max={700} step={20} value={cardMaxW}
                  onChange={(e) => updateSetting("cardMaxW", Number(e.target.value))}
                  className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>קטן</span><span>גדול</span>
                </div>
              </div>

              {/* Emoji scale */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-sm">🔤 גודל אלמנט</p>
                  <span className="text-xs text-muted-foreground">×{emojiScale.toFixed(1)}</span>
                </div>
                <input type="range" min={0.5} max={2} step={0.1} value={emojiScale}
                  onChange={(e) => updateSetting("emojiScale", Number(e.target.value))}
                  className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>קטן</span><span>גדול</span>
                </div>
              </div>

              {/* Flip duration */}
              <div>
                <p className="font-bold text-sm mb-2">⏱️ זמן תצוגת קלפים</p>
                <div className="flex gap-2">
                  {[
                    { val: 0.5, label: "חצי שנייה" },
                    { val: 1, label: "שנייה" },
                    { val: 2, label: "2 שניות" },
                    { val: 3, label: "3 שניות" },
                  ].map((opt) => (
                    <button key={opt.val}
                      onClick={() => updateSetting("flipDuration", opt.val)}
                      className={`flex-1 h-11 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                        flipDuration === opt.val
                          ? theme === "girl"
                            ? "bg-game-pink text-primary-foreground shadow-md"
                            : "bg-game-blue text-secondary-foreground shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateSetting("soundEnabled", !soundEnabled)}
                  className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    soundEnabled ? "bg-accent text-accent-foreground shadow-md" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {soundEnabled ? "🔊 צלילים" : "🔇 צלילים"}
                </button>
                <button
                  onClick={() => updateSetting("speechEnabled", !cloud.speechEnabled)}
                  className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    cloud.speechEnabled ? "bg-accent text-accent-foreground shadow-md" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cloud.speechEnabled ? "🗣️ הכרזה" : "🔇 הכרזה"}
                </button>
              </div>

              {/* Speech rate slider */}
              {cloud.speechEnabled && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-sm">🗣️ מהירות הקריין</p>
                    <span className="text-xs text-muted-foreground">×{(cloud.speechRate || 0.9).toFixed(1)}</span>
                  </div>
                  <input type="range" min={0.3} max={1.5} step={0.1} value={cloud.speechRate || 0.9}
                    onChange={(e) => updateSetting("speechRate", Number(e.target.value))}
                    className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>איטי</span><span>רגיל</span><span>מהיר</span>
                  </div>
                </div>
              )}
            </div>

            {/* Background theme */}
            <div>
              <p className="font-bold text-sm mb-2">🎨 סגנון רקע</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                {getBgThemes().map((bg) => (
                  <button key={bg.id}
                    onClick={() => updateSetting("bgTheme" as any, bg.id)}
                    className={`h-14 rounded-xl text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                      (cloud.bgTheme || "default") === bg.id
                        ? theme === "girl"
                          ? "bg-game-pink text-primary-foreground shadow-md"
                          : "bg-game-blue text-secondary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span className="text-lg">{bg.emoji}</span>
                    <span className="text-[10px]">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card set grid */}
            <div className="grid grid-cols-2 gap-3">
              {getCardSets(theme).map((set, i) => (
                <button key={set.type}
                  onClick={() => onSelectSet(set.type, settings)}
                  className={`bg-gradient-to-br ${set.color} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 active:scale-95 bounce-in text-primary-foreground`}
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <span className="text-4xl drop-shadow-sm">{set.emoji}</span>
                  <span className="font-bold text-sm">{set.label}</span>
                </button>
              ))}
            </div>

            {/* Custom card sets */}
            <div className="mt-4">
              <p className="font-bold text-sm mb-2 text-center">🎴 ערכות מותאמות אישית</p>
              <CustomCardSets
                theme={theme}
                onPlay={(cards, name) => {
                  const customPairCount = Math.min(settings.pairCount, cards.length);
                  onSelectSet("custom", { ...settings, pairCount: customPairCount }, cards);
                }}
              />
            </div>
          </div>
        )}

        {/* ═══ GALLERY TAB ═══ */}
        {activeTab === "gallery" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowUpload(true)}
                className="bg-gradient-to-br from-game-orange to-amber-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 active:scale-95 text-primary-foreground"
              >
                <span className="text-4xl">📸</span>
                <span className="font-bold text-sm">תמונות מהמכשיר</span>
              </button>
              <button
                onClick={() => setShowCloudGallery(true)}
                className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 active:scale-95 text-primary-foreground"
              >
                <span className="text-4xl">☁️</span>
                <span className="font-bold text-sm">גלריית ענן</span>
              </button>
            </div>

            {showUpload && (
              <div className="bg-card rounded-2xl p-5 shadow-xl border-2 border-muted space-y-4 bounce-in">
                <p className="font-bold text-center">העלו תמונות או GIF לזוגות</p>
                <p className="text-xs text-muted-foreground text-center">תומך בתמונות ו-GIF • מינימום 2, מקסימום 8</p>
                <div className="grid grid-cols-4 gap-2">
                  {customImages.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-muted bounce-in">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✕</button>
                    </div>
                  ))}
                  {customImages.length < 8 && (
                    <button onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Upload className="w-5 h-5" />
                      <span className="text-[10px]">הוספה</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,.gif" multiple onChange={handleFiles} className="hidden" />
                <Button variant={accentBtn} size="lg" className="w-full text-lg" disabled={customImages.length < 2} onClick={startCustom}>
                  🎮 התחלת משחק ({customImages.length} תמונות)
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ═══ MUSIC TAB ═══ */}
        {activeTab === "music" && (
          <div className="bg-card rounded-2xl p-5 shadow-lg border-2 border-muted space-y-4">
            <p className="font-bold text-lg text-center">🎵 מוזיקת רקע</p>

            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {([
                { type: "none" as const, label: "ללא", emoji: "🔇" },
                { type: "builtin" as const, label: "שירים", emoji: "🎶" },
                { type: "custom" as const, label: "העלאה", emoji: "📁" },
                { type: "cloud" as const, label: "ענן", emoji: "☁️" },
              ]).map((opt) => (
                <button key={opt.type}
                  onClick={() => updateSetting("musicType", opt.type)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    musicType === opt.type
                      ? theme === "girl"
                        ? "bg-game-pink text-primary-foreground shadow-sm"
                        : "bg-game-blue text-secondary-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>

            {musicType === "builtin" && (
              <div className="grid grid-cols-2 gap-2">
                {BUILT_IN_MELODIES.map((mel) => (
                  <button key={mel.id}
                    onClick={() => updateSetting("builtinMelodyId", mel.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      builtinMelodyId === mel.id
                        ? theme === "girl"
                          ? "bg-game-pink/20 border-2 border-game-pink text-foreground shadow-sm"
                          : "bg-game-blue/20 border-2 border-game-blue text-foreground shadow-sm"
                        : "bg-muted/60 border-2 border-transparent text-muted-foreground hover:bg-muted"
                    }`}
                  >
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
                      className="text-destructive hover:text-destructive/80 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => audioRef.current?.click()}
                    className="w-full h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-dashed border-muted-foreground/30">
                    <Upload className="w-4 h-4" />
                    העלו MP3 / רינגטון / שיר
                  </button>
                )}
                <input ref={audioRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    updateSetting("customMusicName", file.name);
                    const reader = new FileReader();
                    reader.onload = (ev) => updateSetting("customMusic", ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
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
                      className="text-destructive hover:text-destructive/80 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowCloudAudio(true)}
                    className="w-full h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-dashed border-muted-foreground/30">
                    <Cloud className="w-4 h-4" />
                    בחרו שיר מהענן
                  </button>
                )}
                <p className="text-[10px] text-muted-foreground text-center">העלו ובחרו שירים, רינגטונים ומוזיקה מהענן</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ CARDS TAB ═══ */}
        {activeTab === "cards" && (
          <div className="bg-card rounded-2xl p-5 shadow-lg border-2 border-muted space-y-5">
            <p className="font-bold text-lg text-center">🎨 עיצוב הקלפים</p>

            {/* Live preview */}
            <div className="flex justify-center gap-3 py-2">
              <div
                className={`w-20 h-24 flex items-center justify-center shadow-lg transition-all duration-300`}
                style={{
                  ...previewCardStyle,
                  ...(/^#/.test(cardStyle.backColor)
                    ? {
                        background: cardStyle.backColor2
                          ? `linear-gradient(135deg, ${cardStyle.backColor}, ${cardStyle.backColor2})`
                          : cardStyle.backColor,
                      }
                    : cardStyle.backColor === "default"
                      ? {
                          background: theme === "girl"
                            ? "linear-gradient(135deg, hsl(var(--game-pink)), hsl(var(--primary)))"
                            : "linear-gradient(135deg, hsl(var(--game-blue)), hsl(var(--secondary)))",
                        }
                      : {}),
                }}
              >
                <span className="text-2xl drop-shadow-sm">{cardStyle.backIcon}</span>
              </div>
              <div className="w-20 h-24 bg-card flex items-center justify-center shadow-lg transition-all duration-300"
                style={{
                  ...previewCardStyle,
                  borderColor: /^#/.test(cardStyle.borderColor) ? cardStyle.borderColor : previewCardStyle.borderColor,
                }}
              >
                <span className="text-2xl">🐰</span>
              </div>
            </div>

            {/* Shape */}
            <div>
              <p className="font-bold text-sm mb-2">📐 צורת הקלף</p>
              <div className="flex gap-2">
                {SHAPES.map((s) => (
                  <button key={s.id}
                    onClick={() => {
                      updateCardStyle("shape", s.id);
                      updateCardStyle("borderRadius", s.radius);
                    }}
                    className={`flex-1 h-12 font-bold text-xs transition-all active:scale-95 flex items-center justify-center ${
                      cardStyle.shape === s.id
                        ? theme === "girl"
                          ? "bg-game-pink text-primary-foreground shadow-md"
                          : "bg-game-blue text-secondary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    style={{ borderRadius: `${Math.min(s.radius, 16)}px` }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border width */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-sm">🖼️ עובי מסגרת</p>
                <span className="text-xs text-muted-foreground">{cardStyle.borderWidth}px</span>
              </div>
              <input type="range" min={0} max={8} step={1} value={cardStyle.borderWidth}
                onChange={(e) => updateCardStyle("borderWidth", Number(e.target.value))}
                className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>ללא</span><span>עבה</span>
              </div>
            </div>

            {/* Border color */}
            <div>
              <p className="font-bold text-sm mb-2">🎨 צבע מסגרת</p>
              <div className="flex items-center gap-3">
                <div className="flex flex-wrap gap-2 flex-1">
                  {BORDER_COLORS.map((c) => (
                    <button key={c.id}
                      onClick={() => updateCardStyle("borderColor", c.id)}
                      className={`w-9 h-9 rounded-full transition-all active:scale-90 shadow-sm ${
                        cardStyle.borderColor === c.id ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
                <label className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/40 cursor-pointer hover:scale-105 transition-all shrink-0" title="בחרו צבע מותאם">
                  <input type="color"
                    value={/^#/.test(cardStyle.borderColor) ? cardStyle.borderColor : "#ffffff"}
                    onChange={(e) => updateCardStyle("borderColor", e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground"
                    style={{ backgroundColor: /^#/.test(cardStyle.borderColor) ? cardStyle.borderColor : undefined }}
                  >
                    {!/^#/.test(cardStyle.borderColor) && "🎨"}
                  </div>
                </label>
              </div>
            </div>

            {/* Back color with gradient */}
            <div>
              <p className="font-bold text-sm mb-2">🃏 צבע גב הקלף</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {BACK_COLORS.map((c) => (
                  <button key={c.id}
                    onClick={() => { updateCardStyle("backColor", c.id); updateCardStyle("backColor2" as any, undefined); }}
                    className={`h-9 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      cardStyle.backColor === c.id
                        ? theme === "girl"
                          ? "bg-game-pink text-primary-foreground shadow-md"
                          : "bg-game-blue text-secondary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <label className="flex flex-col items-center gap-1 cursor-pointer">
                    <span className="text-[10px] text-muted-foreground font-bold">צבע 1</span>
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-muted shadow-sm">
                      <input type="color"
                        value={/^#/.test(cardStyle.backColor) ? cardStyle.backColor : "#ff6b9d"}
                        onChange={(e) => updateCardStyle("backColor", e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full h-full"
                        style={{ backgroundColor: /^#/.test(cardStyle.backColor) ? cardStyle.backColor : "#ff6b9d" }}
                      />
                    </div>
                  </label>
                  <span className="text-lg text-muted-foreground mt-4">→</span>
                  <label className="flex flex-col items-center gap-1 cursor-pointer">
                    <span className="text-[10px] text-muted-foreground font-bold">צבע 2</span>
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-muted shadow-sm">
                      <input type="color"
                        value={cardStyle.backColor2 && /^#/.test(cardStyle.backColor2) ? cardStyle.backColor2 : "#6366f1"}
                        onChange={(e) => {
                          if (!/^#/.test(cardStyle.backColor)) updateCardStyle("backColor", "#ff6b9d");
                          updateCardStyle("backColor2" as any, e.target.value);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full h-full"
                        style={{ backgroundColor: cardStyle.backColor2 && /^#/.test(cardStyle.backColor2) ? cardStyle.backColor2 : "#6366f1" }}
                      />
                    </div>
                  </label>
                </div>
                {/* Preview swatch */}
                {/^#/.test(cardStyle.backColor) && (
                  <div className="w-14 h-10 rounded-xl border-2 border-muted shadow-sm mt-4"
                    style={{
                      background: cardStyle.backColor2
                        ? `linear-gradient(135deg, ${cardStyle.backColor}, ${cardStyle.backColor2})`
                        : cardStyle.backColor,
                    }}
                  />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">בחרו 2 צבעים ליצירת גרדיאנט</p>
            </div>

            {/* Back icon / custom text */}
            <div>
              <p className="font-bold text-sm mb-2">✨ אייקון / טקסט על גב הקלף</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {BACK_ICONS.map((icon) => (
                  <button key={icon}
                    onClick={() => updateCardStyle("backIcon", icon)}
                    className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all active:scale-90 ${
                      cardStyle.backIcon === icon
                        ? theme === "girl"
                          ? "bg-game-pink/20 border-2 border-game-pink shadow-sm"
                          : "bg-game-blue/20 border-2 border-game-blue shadow-sm"
                        : "bg-muted border-2 border-transparent hover:bg-muted/80"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  maxLength={10}
                  placeholder="או הקלידו טקסט..."
                  value={BACK_ICONS.includes(cardStyle.backIcon) ? "" : cardStyle.backIcon}
                  onChange={(e) => updateCardStyle("backIcon", e.target.value || "⭐")}
                  className="flex-1 h-10 rounded-xl bg-muted px-3 text-sm font-bold text-center border-2 border-muted-foreground/20 focus:border-foreground/40 outline-none transition-colors placeholder:text-muted-foreground/50"
                  dir="auto"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">הקלידו שם, אות, או כל טקסט קצר</p>
            </div>
          </div>
        )}
      </div>

        {/* ═══ BIRTHDAYS TAB ═══ */}
        {activeTab === "birthdays" && (
          <BirthdayManager theme={theme} />
        )}

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
    </div>
  );
}
