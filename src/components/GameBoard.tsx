import { useMemoryGame } from "@/hooks/useMemoryGame";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { useCloudSettings } from "@/hooks/useCloudSettings";
import { ThemeType, CardData, GameSettings, CardSetType, getCardSets, CardPosition } from "@/lib/gameData";
import { BUILT_IN_MELODIES } from "@/lib/melodies";
import MemoryCard from "@/components/MemoryCard";
import Confetti from "@/components/Confetti";
import ThemeBackground from "@/components/ThemeBackground";
import { BgThemeId } from "@/components/ThemeBackground";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, useCallback } from "react";
import { RotateCcw, Home, Music, VolumeX, Mic, MicOff, Grid3X3, Move, Lock, Unlock } from "lucide-react";

interface GameBoardProps {
  theme: ThemeType;
  settings: GameSettings;
  cardSetType: CardSetType;
  customCards?: CardData[];
  onHome: () => void;
}

export default function GameBoard({ theme, settings, cardSetType, customCards, onHome }: GameBoardProps) {
  const { settings: liveCloud, toGameSettings } = useCloudSettings("girl");
  const liveSettings = { ...settings, ...toGameSettings() };
  const [speechOn, setSpeechOn] = useState(settings.speechEnabled);
  const setInfo = getCardSets(theme).find((s) => s.type === cardSetType);
  const cardData = customCards || setInfo?.cards || getCardSets(theme)[0].cards;
  const pairCount = Math.min(settings.pairCount, cardData.length);
  const { cards, moves, matchedCount, isGameOver, flipCard, startGame } = useMemoryGame(pairCount, settings.soundEnabled, speechOn, settings.flipDuration, settings.speechRate);
  const activeMelody = settings.musicType === "builtin"
    ? BUILT_IN_MELODIES.find((m) => m.id === settings.builtinMelodyId)
    : undefined;
  const customUrl = (settings.musicType === "custom" || settings.musicType === "cloud") ? settings.customMusic : undefined;
  const { isPlaying: musicPlaying, toggle: toggleMusic, stop: stopMusic } = useBackgroundMusic(activeMelody, customUrl);

  const isFreeLayout = settings.layoutMode === "free";
  const snapEnabled = settings.snapToGrid !== false;
  const gridSize = settings.gridSize || 20;

  // Card positions for free layout
  const [positions, setPositions] = useState<Record<string, CardPosition>>({});
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [alignLines, setAlignLines] = useState<{ x?: number; y?: number }>({});
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startGame(cardData);
  }, []);

  // Initialize positions when cards change in free mode
  useEffect(() => {
    if (isFreeLayout && cards.length > 0 && Object.keys(positions).length === 0) {
      const savedPos = settings.cardPositions || {};
      if (Object.keys(savedPos).length > 0) {
        setPositions(savedPos);
      } else {
        // Auto-arrange in grid initially
        const cols = Math.ceil(Math.sqrt(cards.length));
        const cardW = 110;
        const cardH = 130;
        const gap = 16;
        const startX = 40;
        const startY = 20;
        const init: Record<string, CardPosition> = {};
        cards.forEach((c, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          init[c.uniqueId] = { x: startX + col * (cardW + gap), y: startY + row * (cardH + gap) };
        });
        setPositions(init);
      }
    }
  }, [isFreeLayout, cards, positions, settings.cardPositions]);

  const snapValue = (val: number) => {
    if (!snapEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  };

  // Find alignment guides
  const getAlignGuides = useCallback((id: string, x: number, y: number) => {
    const guides: { x?: number; y?: number } = {};
    const threshold = 8;
    for (const [cid, pos] of Object.entries(positions)) {
      if (cid === id) continue;
      if (Math.abs(pos.x - x) < threshold) guides.x = pos.x;
      if (Math.abs(pos.y - y) < threshold) guides.y = pos.y;
    }
    return guides;
  }, [positions]);

  const handlePointerDown = (e: React.PointerEvent, cardId: string) => {
    if (!editMode || !isFreeLayout) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = positions[cardId] || { x: 0, y: 0 };
    setDragOffset({ x: e.clientX - pos.x - rect.left, y: e.clientY - pos.y - rect.top });
    setDragging(cardId);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left - dragOffset.x;
    let y = e.clientY - rect.top - dragOffset.y;
    x = Math.max(0, Math.min(x, rect.width - 100));
    y = Math.max(0, Math.min(y, rect.height - 120));
    x = snapValue(x);
    y = snapValue(y);
    const guides = getAlignGuides(dragging, x, y);
    if (guides.x !== undefined) x = guides.x;
    if (guides.y !== undefined) y = guides.y;
    setAlignLines(guides);
    setPositions((prev) => ({ ...prev, [dragging]: { x, y } }));
  };

  const handlePointerUp = () => {
    setDragging(null);
    setAlignLines({});
  };

  const restart = () => {
    setPositions({});
    startGame(cardData);
  };

  const cardMaxW = liveSettings.cardMaxW;

  // Grid columns based on total cards
  const totalCards = pairCount * 2;
  let gridCols = "grid-cols-3";
  if (totalCards <= 4) gridCols = "grid-cols-2";
  else if (totalCards <= 6) gridCols = "grid-cols-3";
  else if (totalCards <= 8) gridCols = "grid-cols-4";
  else if (totalCards <= 12) gridCols = "grid-cols-3 sm:grid-cols-4";
  else gridCols = "grid-cols-4";

  const bgThemeId = (liveSettings.bgTheme || "default") as BgThemeId;

  const stars = Array.from({ length: matchedCount }, (_, i) => (
    <span key={i} className="text-xl bounce-in" style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
  ));

  const animationsOff = settings.animationsEnabled === false;

  return (
    <div dir="rtl" className={animationsOff ? "no-animations" : ""}>
      <ThemeBackground themeId={bgThemeId} girlTheme={theme === "girl"} className="flex flex-col">
        <Confetti active={isGameOver && !animationsOff} />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm border-b border-muted shadow-sm">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => { stopMusic(); onHome(); }}>
              <Home className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleMusic}
              className={musicPlaying ? "text-accent" : "text-muted-foreground"} title="מוזיקת רקע">
              {musicPlaying ? <Music className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSpeechOn(!speechOn)}
              className={speechOn ? "text-accent" : "text-muted-foreground"} title="הכרזה קולית">
              {speechOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
            {isFreeLayout && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)}
                  className={editMode ? "text-game-orange" : "text-muted-foreground"} title="מצב עריכה">
                  {editMode ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </Button>
                {editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setShowGrid(!showGrid)}
                    className={showGrid ? "text-game-blue" : "text-muted-foreground"} title="הצג גריד">
                    <Grid3X3 className="w-5 h-5" />
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm font-bold">
            <span>🎯 {matchedCount}/{pairCount}</span>
            <span>🔄 {moves}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        {/* Edit mode banner */}
        {isFreeLayout && editMode && (
          <div className="flex items-center justify-center gap-2 py-1.5 bg-game-orange/20 text-game-orange text-xs font-bold">
            <Move className="w-3.5 h-3.5" />
            <span>מצב עריכה — גררו קלפים למיקום הרצוי</span>
          </div>
        )}

        {/* Stars row */}
        {matchedCount > 0 && (
          <div className="flex justify-center gap-1 py-2">{stars}</div>
        )}

        {/* Game area */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          {isFreeLayout ? (
            /* ──── FREE LAYOUT ──── */
            <div
              ref={boardRef}
              className="relative w-full h-full min-h-[400px]"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: editMode ? "none" : "auto" }}
            >
              {/* Grid overlay */}
              {editMode && showGrid && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.12 }}>
                  <defs>
                    <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                      <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              )}

              {/* Alignment guide lines */}
              {editMode && alignLines.x !== undefined && (
                <div className="absolute top-0 bottom-0 w-px bg-game-blue/50 z-30 pointer-events-none" style={{ left: alignLines.x + 50 }} />
              )}
              {editMode && alignLines.y !== undefined && (
                <div className="absolute left-0 right-0 h-px bg-game-blue/50 z-30 pointer-events-none" style={{ top: alignLines.y + 55 }} />
              )}

              {/* Cards */}
              {cards.map((card, i) => {
                const pos = positions[card.uniqueId] || { x: (i % 4) * 120 + 20, y: Math.floor(i / 4) * 140 + 20 };
                return (
                  <div
                    key={card.uniqueId}
                    className={`absolute bounce-in ${editMode ? "cursor-grab" : ""} ${dragging === card.uniqueId ? "z-20 scale-105 cursor-grabbing" : "z-10"}`}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: 100,
                      animationDelay: `${i * 0.04}s`,
                      transition: dragging === card.uniqueId ? "none" : "left 0.2s, top 0.2s",
                    }}
                    onPointerDown={(e) => handlePointerDown(e, card.uniqueId)}
                  >
                    <MemoryCard
                      emoji={card.emoji}
                      label={card.label}
                      image={card.image}
                      isFlipped={card.isFlipped}
                      isMatched={card.isMatched}
                      theme={theme}
                      emojiScale={settings.emojiScale}
                      cardStyle={settings.cardStyle}
                      onClick={() => { if (!editMode) flipCard(card.uniqueId); }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* ──── GRID LAYOUT ──── */
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
          )}
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
              <p className="text-muted-foreground text-lg">סיימתם ב-{moves} ניסיונות!</p>
              <div className="flex flex-col gap-3 pt-2">
                <Button variant={theme === "girl" ? "game-pink" : "game-blue"} size="lg" onClick={restart} className="text-lg">
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
