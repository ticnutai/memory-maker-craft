import { useMemoryGame } from "@/hooks/useMemoryGame";
import { ThemeType, CardData, GIRL_ANIMALS, BOY_ANIMALS } from "@/lib/gameData";
import MemoryCard from "@/components/MemoryCard";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { RotateCcw, Home } from "lucide-react";

interface GameBoardProps {
  theme: ThemeType;
  customCards?: CardData[];
  onHome: () => void;
}

export default function GameBoard({ theme, customCards, onHome }: GameBoardProps) {
  const cardData = customCards || (theme === "girl" ? GIRL_ANIMALS : BOY_ANIMALS);
  const pairCount = Math.min(cardData.length, 6);
  const { cards, moves, matchedCount, isGameOver, flipCard, startGame } = useMemoryGame(pairCount);

  useEffect(() => {
    startGame(cardData);
  }, []);

  const restart = () => startGame(cardData);

  // Grid columns based on pair count
  const gridCols = pairCount <= 4 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-4";

  const bgClass = theme === "girl"
    ? "from-game-pink/10 to-background"
    : "from-game-blue/10 to-background";

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgClass} flex flex-col`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm border-b border-muted shadow-sm">
        <Button variant="ghost" size="sm" onClick={onHome}>
          <Home className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4 text-sm font-bold">
          <span>🎯 זוגות: {matchedCount}/{pairCount}</span>
          <span>🔄 ניסיונות: {moves}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={restart}>
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Game Grid */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`grid ${gridCols} gap-3 sm:gap-4 w-full max-w-lg`}>
          {cards.map((card, i) => (
            <div key={card.uniqueId} className="bounce-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <MemoryCard
                emoji={card.emoji}
                image={card.image}
                isFlipped={card.isFlipped}
                isMatched={card.isMatched}
                theme={theme}
                onClick={() => flipCard(card.uniqueId)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Win overlay */}
      {isGameOver && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl bounce-in space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-black text-foreground">כל הכבוד!</h2>
            <p className="text-muted-foreground text-lg">
              סיימתם ב-{moves} ניסיונות!
            </p>
            <div className="flex flex-col gap-3">
              <Button
                variant={theme === "girl" ? "game-pink" : "game-blue"}
                size="lg"
                onClick={restart}
                className="text-lg"
              >
                🔄 שחקו שוב
              </Button>
              <Button variant="outline" size="lg" onClick={onHome} className="text-lg">
                🏠 חזרה הביתה
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}