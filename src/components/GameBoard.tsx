import { useMemoryGame } from "@/hooks/useMemoryGame";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { ThemeType, CardData, GameSettings, CardSetType, getCardSets } from "@/lib/gameData";
import { BUILT_IN_MELODIES } from "@/lib/melodies";
import MemoryCard from "@/components/MemoryCard";
import Confetti from "@/components/Confetti";
import ThemeBackground from "@/components/ThemeBackground";
import { BgThemeId } from "@/components/ThemeBackground";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { RotateCcw, Home, Music, VolumeX, Mic, MicOff } from "lucide-react";

interface GameBoardProps {
  theme: ThemeType;
  settings: GameSettings;
  cardSetType: CardSetType;
  customCards?: CardData[];
  onHome: () => void;
}

export default function GameBoard({ theme, settings, cardSetType, customCards, onHome }: GameBoardProps) {
  const setInfo = getCardSets(theme).find((s) => s.type === cardSetType);
  const cardData = customCards || setInfo?.cards || getCardSets(theme)[0].cards;
  const pairCount = Math.min(settings.pairCount, cardData.length);
  const { cards, moves, matchedCount, isGameOver, flipCard, startGame } = useMemoryGame(pairCount, settings.soundEnabled, settings.speechEnabled, settings.flipDuration, settings.speechRate);
  const activeMelody = settings.musicType === "builtin"
    ? BUILT_IN_MELODIES.find((m) => m.id === settings.builtinMelodyId)
    : undefined;
  const customUrl = (settings.musicType === "custom" || settings.musicType === "cloud") ? settings.customMusic : undefined;
  const { isPlaying: musicPlaying, toggle: toggleMusic, stop: stopMusic } = useBackgroundMusic(activeMelody, customUrl);

  useEffect(() => {
    startGame(cardData);
  }, []);

  const restart = () => startGame(cardData);

  const cardMaxW = settings.cardMaxW;

  // Grid columns based on total cards
  const totalCards = pairCount * 2;
  let gridCols = "grid-cols-3";
  if (totalCards <= 4) gridCols = "grid-cols-2";
  else if (totalCards <= 6) gridCols = "grid-cols-3";
  else if (totalCards <= 8) gridCols = "grid-cols-4";
  else if (totalCards <= 12) gridCols = "grid-cols-3 sm:grid-cols-4";
  else gridCols = "grid-cols-4";

  const bgThemeId = (settings.bgTheme || "default") as BgThemeId;

  // Stars for matched pairs
  const stars = Array.from({ length: matchedCount }, (_, i) => (
    <span key={i} className="text-xl bounce-in" style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
  ));

  return (
    <div dir="rtl">
    <ThemeBackground themeId={bgThemeId} girlTheme={theme === "girl"} className="flex flex-col" >
      <Confetti active={isGameOver} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm border-b border-muted shadow-sm">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => { stopMusic(); onHome(); }}>
            <Home className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMusic}
            className={musicPlaying ? "text-accent" : "text-muted-foreground"}
          >
            {musicPlaying ? <Music className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>
        <div className="flex items-center gap-3 text-sm font-bold">
          <span>🎯 {matchedCount}/{pairCount}</span>
          <span>🔄 {moves}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={restart}>
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Stars row */}
      {matchedCount > 0 && (
        <div className="flex justify-center gap-1 py-2">
          {stars}
        </div>
      )}

      {/* Game Grid */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`grid ${gridCols} gap-3 sm:gap-4 w-full`} style={{ maxWidth: `${cardMaxW}px` }}>
          {cards.map((card, i) => (
            <div key={card.uniqueId} className="bounce-in" style={{ animationDelay: `${i * 0.04}s` }}>
              <MemoryCard
                emoji={card.emoji}
                label={card.label}
                image={card.image}
                isFlipped={card.isFlipped}
                isMatched={card.isMatched}
                theme={theme}
                emojiScale={settings.emojiScale}
                cardStyle={settings.cardStyle}
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
            <div className="text-7xl bounce-in">🏆</div>
            <div className="flex justify-center gap-1 text-3xl">
              {"⭐".repeat(Math.min(pairCount, 6)).split("").map((s, i) => (
                <span key={i} className="bounce-in" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>{s}</span>
              ))}
            </div>
            <h2 className="text-3xl font-black text-foreground">🎉 כל הכבוד! 🎉</h2>
            <p className="text-muted-foreground text-lg">
              סיימתם ב-{moves} ניסיונות!
            </p>
            <div className="flex flex-col gap-3 pt-2">
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
    </ThemeBackground>
    </div>
  );
}