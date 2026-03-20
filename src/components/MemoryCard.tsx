import { ThemeType } from "@/lib/gameData";

interface MemoryCardProps {
  emoji: string;
  image?: string;
  isFlipped: boolean;
  isMatched: boolean;
  theme: ThemeType;
  onClick: () => void;
}

export default function MemoryCard({ emoji, image, isFlipped, isMatched, theme, onClick }: MemoryCardProps) {
  const backColor = theme === "girl"
    ? "bg-gradient-to-br from-game-pink to-primary"
    : "bg-gradient-to-br from-game-blue to-secondary";

  return (
    <button
      onClick={onClick}
      disabled={isFlipped || isMatched}
      className={`card-flip w-full aspect-square ${isMatched ? "matched-card" : ""}`}
      aria-label={isFlipped ? emoji : "קלף הפוך"}
    >
      <div className={`card-flip-inner w-full h-full relative ${isFlipped ? "flipped" : ""}`}>
        {/* Back of card (face down) */}
        <div className={`card-face rounded-2xl ${backColor} flex items-center justify-center shadow-lg border-4 border-background cursor-pointer hover:brightness-110 transition-all`}>
          <span className="text-3xl sm:text-4xl opacity-80">⭐</span>
        </div>
        {/* Front of card (face up) */}
        <div className={`card-face card-face-back rounded-2xl bg-card flex items-center justify-center shadow-lg border-4 ${isMatched ? "border-accent" : "border-muted"}`}>
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="text-4xl sm:text-5xl md:text-6xl select-none">{emoji}</span>
          )}
        </div>
      </div>
    </button>
  );
}