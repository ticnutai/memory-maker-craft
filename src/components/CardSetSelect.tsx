import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeType, CardData, CardSetType, GameSettings, getCardSets } from "@/lib/gameData";
import { BUILT_IN_MELODIES } from "@/lib/melodies";
import { Camera, Image, Upload, Volume2, VolumeX, Music, Trash2, Play, Cloud } from "lucide-react";
import CloudGallery from "@/components/CloudGallery";

interface CardSetSelectProps {
  theme: ThemeType;
  onSelectSet: (set: CardSetType, settings: GameSettings, customCards?: CardData[]) => void;
  onBack: () => void;
}

export default function CardSetSelect({ theme, onSelectSet, onBack }: CardSetSelectProps) {
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showCloudGallery, setShowCloudGallery] = useState(false);
  const [showCloudAudio, setShowCloudAudio] = useState(false);
  const [pairCount, setPairCount] = useState(4);
  const [cardMaxW, setCardMaxW] = useState(480);
  const [emojiScale, setEmojiScale] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flipDuration, setFlipDuration] = useState(1);
  const [musicType, setMusicType] = useState<"none" | "builtin" | "custom">("none");
  const [builtinMelodyId, setBuiltinMelodyId] = useState<string>("twinkle");
  const [customMusic, setCustomMusic] = useState<string | undefined>();
  const [customMusicName, setCustomMusicName] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const accentBtn = theme === "girl" ? "game-pink" as const : "game-blue" as const;
  const settings: GameSettings = { pairCount, cardMaxW, emojiScale, soundEnabled, flipDuration, musicType, builtinMelodyId, customMusic };

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

  const sliderTrack = theme === "girl" ? "accent-[hsl(var(--game-pink))]" : "accent-[hsl(var(--game-blue))]";

  return (
    <div className="flex flex-col items-center min-h-screen gap-5 px-4 py-6 overflow-y-auto" dir="rtl">
      <Button variant="ghost" onClick={onBack} className="self-start text-muted-foreground">
        → חזרה
      </Button>

      <h2 className="text-3xl sm:text-4xl font-black text-foreground text-center bounce-in">
        {theme === "girl" ? "👧 ערכה לבנות" : "👦 ערכה לבנים"}
      </h2>

      {/* Settings panel */}
      <div className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-lg border-2 border-muted space-y-4 bounce-in">
        {/* Difficulty */}
        <div>
          <p className="font-bold text-sm mb-2">🎯 רמת קושי</p>
          <div className="flex gap-2">
            {[
              { pairs: 3, label: "קל", emoji: "😊" },
              { pairs: 4, label: "בינוני", emoji: "🤔" },
              { pairs: 6, label: "קשה", emoji: "🔥" },
            ].map((lvl) => (
              <button
                key={lvl.pairs}
                onClick={() => setPairCount(lvl.pairs)}
                className={`flex-1 h-14 rounded-xl font-bold text-sm transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                  pairCount === lvl.pairs
                    ? theme === "girl"
                      ? "bg-game-pink text-primary-foreground shadow-md"
                      : "bg-game-blue text-secondary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span className="text-lg">{lvl.emoji}</span>
                <span>{lvl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card size slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-sm">📐 גודל קלפים</p>
            <span className="text-xs text-muted-foreground">{cardMaxW}px</span>
          </div>
          <input
            type="range" min={280} max={700} step={20}
            value={cardMaxW}
            onChange={(e) => setCardMaxW(Number(e.target.value))}
            className={`w-full h-2 rounded-full cursor-pointer ${sliderTrack}`}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>קטן</span><span>גדול</span>
          </div>
        </div>

        {/* Emoji scale slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-sm">🔤 גודל אלמנט</p>
            <span className="text-xs text-muted-foreground">×{emojiScale.toFixed(1)}</span>
          </div>
          <input
            type="range" min={0.5} max={2} step={0.1}
            value={emojiScale}
            onChange={(e) => setEmojiScale(Number(e.target.value))}
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
              <button
                key={opt.val}
                onClick={() => setFlipDuration(opt.val)}
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
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`w-full h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
            soundEnabled
              ? "bg-accent text-accent-foreground shadow-md"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          {soundEnabled ? "🔊 קולות פועלים" : "🔇 קולות כבויים"}
        </button>

        {/* Music selection */}
        <div>
          <p className="font-bold text-sm mb-2">🎵 מוזיקת רקע</p>
          
          {/* Music type tabs */}
          <div className="flex gap-1 mb-3 bg-muted rounded-xl p-1">
            {([
              { type: "none" as const, label: "ללא", emoji: "🔇" },
              { type: "builtin" as const, label: "שירים", emoji: "🎶" },
              { type: "custom" as const, label: "העלאה", emoji: "📁" },
            ]).map((opt) => (
              <button
                key={opt.type}
                onClick={() => setMusicType(opt.type)}
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

          {/* Built-in melodies grid */}
          {musicType === "builtin" && (
            <div className="grid grid-cols-2 gap-2">
              {BUILT_IN_MELODIES.map((mel) => (
                <button
                  key={mel.id}
                  onClick={() => setBuiltinMelodyId(mel.id)}
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

          {/* Custom upload */}
          {musicType === "custom" && (
            <div className="space-y-2">
              {customMusic ? (
                <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                  <Music className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-xs font-medium truncate flex-1">{customMusicName}</span>
                  <button
                    onClick={() => { setCustomMusic(undefined); setCustomMusicName(""); }}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => audioRef.current?.click()}
                  className="w-full h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-dashed border-muted-foreground/30"
                >
                  <Upload className="w-4 h-4" />
                  העלו MP3 / רינגטון / שיר
                </button>
              )}
              <input
                ref={audioRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setCustomMusicName(file.name);
                  const reader = new FileReader();
                  reader.onload = (ev) => setCustomMusic(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />
              <p className="text-[10px] text-muted-foreground text-center">
                MP3, WAV, M4A, רינגטונים, שירים ועוד
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card set selection grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {getCardSets(theme).map((set, i) => (
          <button
            key={set.type}
            onClick={() => onSelectSet(set.type, settings)}
            className={`bg-gradient-to-br ${set.color} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 active:scale-95 bounce-in text-primary-foreground`}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <span className="text-4xl drop-shadow-sm">{set.emoji}</span>
            <span className="font-bold text-sm">{set.label}</span>
          </button>
        ))}
        <button
          onClick={() => setShowUpload(true)}
          className="bg-gradient-to-br from-game-orange to-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 active:scale-95 bounce-in text-primary-foreground"
          style={{ animationDelay: "0.5s" }}
        >
          <span className="text-4xl drop-shadow-sm">📸</span>
          <span className="font-bold text-sm">תמונות מהמכשיר</span>
        </button>
        <button
          onClick={() => setShowCloudGallery(true)}
          className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 active:scale-95 bounce-in text-primary-foreground"
          style={{ animationDelay: "0.58s" }}
        >
          <span className="text-4xl drop-shadow-sm">☁️</span>
          <span className="font-bold text-sm">גלריית ענן</span>
        </button>
      </div>

      {showUpload && (
        <div className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-xl border-2 border-muted bounce-in space-y-4">
          <p className="font-bold text-center">העלו תמונות או GIF לזוגות</p>
          <p className="text-xs text-muted-foreground text-center">תומך בתמונות ו-GIF • מינימום 2, מקסימום 8</p>

          <div className="grid grid-cols-4 gap-2">
            {customImages.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-muted bounce-in">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
            {customImages.length < 8 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-[10px]">הוספה</span>
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,.gif"
            multiple
            onChange={handleFiles}
            className="hidden"
          />

          <Button
            variant={accentBtn}
            size="lg"
            className="w-full text-lg"
            disabled={customImages.length < 2}
            onClick={startCustom}
          >
            🎮 התחלת משחק ({customImages.length} תמונות)
          </Button>
        </div>
      )}

      {showCloudGallery && (
        <CloudGallery
          theme={theme}
          onClose={() => setShowCloudGallery(false)}
          onSelect={(urls) => {
            setShowCloudGallery(false);
            const cards: CardData[] = urls.map((url, i) => ({
              id: `cloud-${i}`,
              emoji: "☁️",
              image: url,
            }));
            const cloudPairCount = Math.min(pairCount, cards.length);
            onSelectSet("custom", { ...settings, pairCount: cloudPairCount }, cards);
          }}
        />
      )}
    </div>
  );
}