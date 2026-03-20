import { ThemeType } from "@/lib/gameData";

interface MemoryCardProps {
  emoji: string;
  label?: string;
  image?: string;
  isFlipped: boolean;
  isMatched: boolean;
  theme: ThemeType;
  emojiScale: number;
  onClick: () => void;
}

export default function MemoryCard({ emoji, label, image, isFlipped, isMatched, theme, emojiScale, onClick }: MemoryCardProps) {
  const backColor = theme === "girl"
    ? "bg-gradient-to-br from-game-pink to-primary"
    : "bg-gradient-to-br from-game-blue to-secondary";

  const isLetter = emoji.length === 1 && /[\u0590-\u05FF]/.test(emoji);
  const baseFontSize = 3; // rem
  const fontSize = baseFontSize * emojiScale;

  return (
    <button
      onClick={onClick}
      disabled={isFlipped || isMatched}
      className={`card-flip w-full aspect-square ${isMatched ? "matched-card" : ""}`}
      aria-label={isFlipped ? (label || emoji) : "קלף הפוך"}
    >
      <div className={`card-flip-inner w-full h-full relative ${isFlipped ? "flipped" : ""}`}>
        <div className={`card-face rounded-2xl ${backColor} flex items-center justify-center shadow-lg border-4 border-background cursor-pointer hover:brightness-110 hover:scale-[1.03] transition-all duration-200`}>
          <span className="text-3xl sm:text-4xl opacity-80 drop-shadow-sm">⭐</span>
        </div>
        <div className={`card-face card-face-back rounded-2xl bg-card flex flex-col items-center justify-center shadow-lg border-4 transition-colors duration-300 ${isMatched ? "border-accent bg-accent/5" : "border-muted"}`}>
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : isLetter ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="select-none font-black" style={{ fontSize: `${fontSize}rem`, lineHeight: 1.1 }}>
                {emoji}
              </span>
              {label && <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{label}</span>}
            </div>
          ) : (
            <span className="select-none drop-shadow-sm" style={{ fontSize: `${fontSize}rem`, lineHeight: 1.1 }}>
              {emoji}
            </span>
          )}
          {isMatched && (
            <span className="absolute bottom-1 left-1 text-lg opacity-60 pointer-events-none">✓</span>
          )}
        </div>
      </div>
    </button>
  );
}