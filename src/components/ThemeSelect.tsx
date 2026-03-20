import { Button } from "@/components/ui/button";
import { ThemeType } from "@/lib/gameData";

interface ThemeSelectProps {
  onSelect: (theme: ThemeType) => void;
}

const FLOATING_EMOJIS = ["🧸", "🎈", "🌈", "⭐", "🦄", "🎀", "🍭", "🌸", "💖", "🎪", "🐰", "🦋"];

export default function ThemeSelect({ onSelect }: ThemeSelectProps) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-8 px-4 relative overflow-hidden"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, #fce4ec 0%, #f3e5f5 25%, #e8eaf6 50%, #e0f7fa 75%, #fff9c4 100%)",
      }}
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
            <span
              key={i}
              className="absolute select-none"
              style={{
                fontSize: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                opacity: 0.25 + (i % 3) * 0.08,
                animation: `floatBg ${duration}s ease-in-out ${delay}s infinite alternate`,
              }}
            >
              {emoji}
            </span>
          );
        })}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <h1 className="text-4xl sm:text-5xl font-black text-foreground text-center leading-tight bounce-in">
          🎮 משחק זיכרון 🎮
        </h1>
        <p className="text-lg text-muted-foreground text-center" style={{ animationDelay: "0.1s" }}>
          בחרו ערכה להתחיל לשחק!
        </p>
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
          <Button
            variant="game-pink"
            size="xl"
            className="flex-1 text-2xl gap-3 bounce-in"
            style={{ animationDelay: "0.2s" }}
            onClick={() => onSelect("girl")}
          >
            👧 ערכה לבנות
          </Button>
          <Button
            variant="game-blue"
            size="xl"
            className="flex-1 text-2xl gap-3 bounce-in"
            style={{ animationDelay: "0.3s" }}
            onClick={() => onSelect("boy")}
          >
            👦 ערכה לבנים
          </Button>
        </div>
      </div>
    </div>
  );
}