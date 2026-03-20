import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeType, CardData, CardSetType } from "@/lib/gameData";
import { Camera, Image, Upload } from "lucide-react";

interface CardSetSelectProps {
  theme: ThemeType;
  onSelectSet: (set: CardSetType, customCards?: CardData[]) => void;
  onBack: () => void;
}

export default function CardSetSelect({ theme, onSelectSet, onBack }: CardSetSelectProps) {
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const accentBtn = theme === "girl" ? "game-pink" as const : "game-blue" as const;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomImages((prev) => {
          if (prev.length >= 6) return prev;
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
    if (customImages.length < 3) return;
    const cards: CardData[] = customImages.map((img, i) => ({
      id: `custom-${i}`,
      emoji: "📷",
      image: img,
    }));
    onSelectSet("custom", cards);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 py-8" dir="rtl">
      <Button variant="ghost" onClick={onBack} className="self-start text-muted-foreground">
        → חזרה
      </Button>

      <h2 className="text-3xl sm:text-4xl font-black text-foreground text-center bounce-in">
        {theme === "girl" ? "👧 ערכה לבנות" : "👦 ערכה לבנים"}
      </h2>
      <p className="text-muted-foreground text-center">בחרו סוג קלפים</p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button
          variant={accentBtn}
          size="lg"
          className="text-xl gap-3 bounce-in"
          style={{ animationDelay: "0.1s" }}
          onClick={() => onSelectSet("animals")}
        >
          <Image className="w-6 h-6" />
          🐾 חיות
        </Button>

        <Button
          variant="game-orange"
          size="lg"
          className="text-xl gap-3 bounce-in"
          style={{ animationDelay: "0.2s" }}
          onClick={() => setShowUpload(true)}
        >
          <Camera className="w-6 h-6" />
          📸 תמונות אישיות
        </Button>
      </div>

      {showUpload && (
        <div className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-xl border-2 border-muted bounce-in space-y-4">
          <p className="font-bold text-center">העלו 3-6 תמונות לזוגות</p>
          
          <div className="grid grid-cols-3 gap-3">
            {customImages.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-muted bounce-in">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
            {customImages.length < 6 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs">הוספה</span>
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />

          <Button
            variant={accentBtn}
            size="lg"
            className="w-full text-lg"
            disabled={customImages.length < 3}
            onClick={startCustom}
          >
            🎮 התחלת משחק ({customImages.length}/3-6)
          </Button>
        </div>
      )}
    </div>
  );
}