import { Button } from "@/components/ui/button";
import { ThemeType } from "@/lib/gameData";

interface ThemeSelectProps {
  onSelect: (theme: ThemeType) => void;
}

export default function ThemeSelect({ onSelect }: ThemeSelectProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4" dir="rtl">
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
  );
}