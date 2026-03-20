import { ThemeType, CardSize, CARD_SIZE_CONFIG } from "@/lib/gameData";

interface MemoryCardProps {
  emoji: string;
  label?: string;
  image?: string;
  isFlipped: boolean;
  isMatched: boolean;
  theme: ThemeType;
  cardSize: CardSize;
  onClick: () => void;
}

export default function MemoryCard({ emoji, label, image, isFlipped, isMatched, theme, cardSize, onClick }: MemoryCardProps) {
  const backColor = theme === "girl"
    ? "bg-gradient-to-br from-game-pink to-primary"
    : "bg-gradient-to-br from-game-blue to-secondary";

  const sizeConfig = CARD_SIZE_CONFIG[cardSize];
  const isLetter = emoji.length === 1 && /[\u0590-\u05FF]/.test(emoji);

  return (
    <button
      onClick={onClick}
      disabled={isFlipped || isMatched}
      className={`card-flip w-full aspect-square ${isMatched ? "matched-card" : ""}`}
      aria-label={isFlipped ? (label || emoji) : "קלף הפוך"}
    >
      <div className={`card-flip-inner w-full h-full relative ${isFlipped ? "flipped" : ""}`}>
        {/* Back (face down) */}
        <div className={`card-face rounded-2xl ${backColor} flex items-center justify-center shadow-lg border-4 border-background cursor-pointer hover:brightness-110 hover:scale-[1.03] transition-all duration-200`}>
          <span className="text-3xl sm:text-4xl opacity-80 drop-shadow-sm">⭐</span>
        </div>
        {/* Front (face up) */}
        <div className={`card-face card-face-back rounded-2xl bg-card flex flex-col items-center justify-center shadow-lg border-4 transition-colors duration-300 ${isMatched ? "border-accent bg-accent/5" : "border-muted"}`}>
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : isLetter ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className={`${sizeConfig.emojiClass} select-none font-black`}
                    style={{ fontFamily: "'Rubik', sans-serif" }}>
                {emoji}
              </span>
              {label && <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{label}</span>}
            </div>
          ) : (
            <span className={`${sizeConfig.emojiClass} select-none drop-shadow-sm`}>
              {emoji}
            </span>
          )}
          {isMatched && (
            <div className="absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none">
              <span className="text-lg opacity-60 absolute bottom-1 left-1">✓</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}