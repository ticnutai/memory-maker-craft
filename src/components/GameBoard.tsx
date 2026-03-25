import { useMemoryGame } from "@/hooks/useMemoryGame";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { useCloudSettings } from "@/hooks/useCloudSettings";
import { useGameAnimations } from "@/hooks/useGameAnimations";
import { ThemeType, CardData, GameSettings, CardSetType, getCardSets, CardPosition } from "@/lib/gameData";
import { BUILT_IN_MELODIES } from "@/lib/melodies";
import MemoryCard from "@/components/MemoryCard";
import Confetti from "@/components/Confetti";
import ThemeBackground from "@/components/ThemeBackground";
import { BgThemeId } from "@/components/ThemeBackground";
import LayoutPicker, { LayoutPreset } from "@/components/LayoutPicker";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, useCallback } from "react";
import { RotateCcw, Home, Music, VolumeX, Volume2, Mic, MicOff, Grid3X3, Move, Lock, Unlock, Save, Copy, AudioLines, Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GameBoardProps {
  theme: ThemeType;
  settings: GameSettings;
  cardSetType: CardSetType;
  customCards?: CardData[];
  onHome: () => void;
}

export default function GameBoard({ theme, settings, cardSetType, customCards, onHome }: GameBoardProps) {
  const { settings: liveCloud, toGameSettings, updateSetting } = useCloudSettings("girl");
  const liveSettings = { ...settings, ...toGameSettings() };
  const soundOn = liveSettings.soundEnabled;
  const speechOn = liveSettings.speechEnabled;
  const setInfo = getCardSets(theme).find((s) => s.type === cardSetType);
  const cardData = customCards || setInfo?.cards || getCardSets(theme)[0].cards;
  const pairCount = Math.min(liveSettings.pairCount, cardData.length);
  const { cards, moves, matchedCount, isGameOver, flipCard, startGame } = useMemoryGame(pairCount, soundOn, speechOn, liveSettings.flipDuration, liveSettings.speechRate, liveSettings.customVoiceEnabled !== false);
  const activeMelody = liveSettings.musicType === "builtin"
    ? BUILT_IN_MELODIES.find((m) => m.id === liveSettings.builtinMelodyId)
    : undefined;
  const customUrl = (liveSettings.musicType === "custom" || liveSettings.musicType === "cloud") ? liveSettings.customMusic : undefined;
  const { isPlaying: musicPlaying, toggle: toggleMusic, stop: stopMusic } = useBackgroundMusic(activeMelody, customUrl);
  const { showingAnimation, triggerAnimation, dismiss: dismissAnimation } = useGameAnimations();

  const isFreeLayout = liveSettings.layoutMode === "free";
  const snapEnabled = liveSettings.snapToGrid !== false;
  const gridSize = liveSettings.gridSize || 20;

  // Layout preset
  const activePreset = liveSettings.layoutPreset || "grid-3";

  // Card positions for free layout
  const [positions, setPositions] = useState<Record<string, CardPosition>>({});
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [alignLines, setAlignLines] = useState<{ x?: number; y?: number }>({});
  const [saveFlash, setSaveFlash] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const prevMatchedRef = useRef(0);

  // Trigger custom animations on match / win
  useEffect(() => {
    if (matchedCount > prevMatchedRef.current && matchedCount > 0) {
      triggerAnimation("match");
    }
    prevMatchedRef.current = matchedCount;
  }, [matchedCount, triggerAnimation]);

  useEffect(() => {
    if (isGameOver) triggerAnimation("win");
  }, [isGameOver, triggerAnimation]);

  useEffect(() => {
    if (isFreeLayout) setEditMode(true);
    else setEditMode(false);
  }, [isFreeLayout]);

  useEffect(() => {
    startGame(cardData);
  }, []);

  useEffect(() => {
    if (isFreeLayout && cards.length > 0 && Object.keys(positions).length === 0) {
      const savedPosArr = liveSettings.cardPositions || [];
      if (Array.isArray(savedPosArr) && savedPosArr.length > 0) {
        const init: Record<string, CardPosition> = {};
        cards.forEach((c, i) => {
          if (savedPosArr[i]) init[c.uniqueId] = savedPosArr[i];
        });
        if (Object.keys(init).length > 0) {
          setPositions(init);
          return;
        }
      }
      const cols = Math.ceil(Math.sqrt(cards.length));
      const cardW = freeCardSize;
      const cardH = Math.round(freeCardSize * 1.2);
      const gap = 16;
      const startX = 20;
      const startY = 20;
      const init: Record<string, CardPosition> = {};
      cards.forEach((c, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        init[c.uniqueId] = { x: startX + col * (cardW + gap), y: startY + row * (cardH + gap) };
      });
      setPositions(init);
    }
  }, [isFreeLayout, cards, positions, liveSettings.cardPositions]);

  const snapValue = (val: number) => {
    if (!snapEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  };

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
    y = Math.max(0, Math.min(y, rect.height - 20));
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

  const getDeviceId = () => localStorage.getItem("memory-game-device-id") || "unknown";

  const saveLayout = () => {
    const posArr = cards.map(c => positions[c.uniqueId] || { x: 0, y: 0 });
    updateSetting("cardPositions" as any, posArr);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  };

  const duplicateLayout = async () => {
    const name = window.prompt("שם לפריסה החדשה:");
    if (!name?.trim()) return;
    const posArr = cards.map(c => positions[c.uniqueId] || { x: 0, y: 0 });
    await (supabase as any).from("layout_presets").insert({
      device_id: getDeviceId(),
      name: name.trim(),
      positions: posArr,
      pair_count: pairCount,
    } as any);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  };

  const restart = () => {
    setPositions({});
    startGame(cardData);
  };

  const cardMaxW = liveSettings.cardMaxW;
  const freeCardSize = Math.max(60, Math.min(200, Math.round(cardMaxW / 4)));

  // ──── Layout preset logic ────
  const totalCards = pairCount * 2;

  const getGridColsFromPreset = (presetId: string): string => {
    const preset = presetId;
    if (preset === "grid-2") return "grid-cols-2";
    if (preset === "grid-4") return "grid-cols-4";
    return "grid-cols-3 sm:grid-cols-4";
  };

  const getSpecialPositions = (pattern: string, count: number, containerW: number, containerH: number, cardW: number): { x: number; y: number }[] => {
    const positions: { x: number; y: number }[] = [];
    const cardH = cardW * 1.25;
    const cx = containerW / 2;
    const cy = containerH / 2;

    switch (pattern) {
      case "circle": {
        const r = Math.min(containerW, containerH) * 0.35;
        for (let i = 0; i < count; i++) {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2;
          positions.push({ x: cx + r * Math.cos(angle) - cardW / 2, y: cy + r * Math.sin(angle) - cardH / 2 });
        }
        break;
      }
      case "wave": {
        const cols = 4;
        const rows = Math.ceil(count / cols);
        const gapX = (containerW - cols * cardW) / (cols + 1);
        const gapY = (containerH - rows * cardH) / (rows + 1);
        for (let i = 0; i < count; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const waveY = Math.sin((col / (cols - 1)) * Math.PI) * 30;
          positions.push({
            x: gapX + col * (cardW + gapX),
            y: gapY + row * (cardH + gapY) + waveY,
          });
        }
        break;
      }
      case "diamond": {
        const maxPerRow = Math.ceil(Math.sqrt(count));
        let idx = 0;
        const rowCounts: number[] = [];
        let left = count;
        for (let r = 1; r <= maxPerRow && left > 0; r++) {
          const c = Math.min(r, left);
          rowCounts.push(c);
          left -= c;
        }
        for (let r = maxPerRow - 1; r >= 1 && left > 0; r--) {
          const c = Math.min(r, left);
          rowCounts.push(c);
          left -= c;
        }
        const totalRows = rowCounts.length;
        const rowH = (containerH - 20) / totalRows;
        for (let r = 0; r < totalRows; r++) {
          const cols = rowCounts[r];
          const rowW = cols * (cardW + 8);
          const startX = (containerW - rowW) / 2;
          for (let c = 0; c < cols && idx < count; c++) {
            positions.push({ x: startX + c * (cardW + 8), y: 10 + r * rowH });
            idx++;
          }
        }
        break;
      }
      case "spiral": {
        for (let i = 0; i < count; i++) {
          const angle = i * 0.8;
          const r = 20 + i * Math.min(containerW, containerH) * 0.03;
          positions.push({
            x: cx + r * Math.cos(angle) - cardW / 2,
            y: cy + r * Math.sin(angle) - cardH / 2,
          });
        }
        break;
      }
      case "random": {
        const margin = 10;
        const usedAreas: { x: number; y: number }[] = [];
        for (let i = 0; i < count; i++) {
          let best = { x: margin, y: margin };
          for (let attempt = 0; attempt < 20; attempt++) {
            const tx = margin + Math.random() * (containerW - cardW - margin * 2);
            const ty = margin + Math.random() * (containerH - cardH - margin * 2);
            const tooClose = usedAreas.some(a => Math.abs(a.x - tx) < cardW * 0.7 && Math.abs(a.y - ty) < cardH * 0.7);
            if (!tooClose) { best = { x: tx, y: ty }; break; }
            best = { x: tx, y: ty };
          }
          positions.push(best);
          usedAreas.push(best);
        }
        break;
      }
    }
    return positions;
  };

  const isSpecialLayout = ["circle", "wave", "diamond", "spiral", "random"].includes(activePreset.replace("grid-", ""));
  const activePresetObj = (() => {
    const map: Record<string, string> = {
      "grid-2": "grid", "grid-3": "grid", "grid-4": "grid",
      circle: "circle", wave: "wave", diamond: "diamond", spiral: "spiral", random: "random",
    };
    return map[activePreset] || "grid";
  })();

  const handlePresetSelect = (preset: LayoutPreset) => {
    updateSetting("layoutPreset" as any, preset.id);
  };

  const gridCols = getGridColsFromPreset(activePreset);
  const bgThemeId = (liveSettings.bgTheme || "default") as BgThemeId;

  const stars = Array.from({ length: matchedCount }, (_, i) => (
    <span key={i} className="text-xl bounce-in" style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
  ));

  const animationsOff = liveSettings.animationsEnabled === false;

  // Special layout positions
  const specialContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 400, h: 500 });

  useEffect(() => {
    if (specialContainerRef.current) {
      const rect = specialContainerRef.current.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    }
  }, [activePreset, cards.length]);

  const specialCardW = Math.max(50, Math.min(120, Math.round(containerSize.w / (Math.ceil(Math.sqrt(totalCards)) + 1))));
  const specialPositions = isSpecialLayout && !isFreeLayout
    ? getSpecialPositions(activePresetObj, totalCards, containerSize.w, containerSize.h, specialCardW)
    : [];

  return (
    <div dir="rtl" className={animationsOff ? "no-animations" : ""}>
      <ThemeBackground themeId={bgThemeId} girlTheme={theme === "girl"} className="flex flex-col">
        <Confetti active={isGameOver && !animationsOff} />

        {/* Header */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-card/80 backdrop-blur-sm border-b border-muted shadow-sm gap-1">
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
            <Button variant="ghost" size="sm" className="w-8 h-8 sm:w-9 sm:h-9 p-0" onClick={() => { stopMusic(); onHome(); }}>
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            {/* Sound effects toggle */}
            <Button variant="ghost" size="sm" className={`w-8 h-8 sm:w-9 sm:h-9 p-0 ${soundOn ? "text-yellow-500" : "text-muted-foreground"}`} onClick={() => updateSetting("soundEnabled", !soundOn)} title="אפקטי צליל">
              {soundOn ? <Bell className="w-4 h-4 sm:w-5 sm:h-5" /> : <BellOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
            {/* Background music toggle */}
            <Button variant="ghost" size="sm" className={`w-8 h-8 sm:w-9 sm:h-9 p-0 ${musicPlaying ? "text-accent" : "text-muted-foreground"}`} onClick={toggleMusic} title="מוזיקת רקע">
              <Music className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            {/* Speech toggle */}
            <Button variant="ghost" size="sm" className={`w-8 h-8 sm:w-9 sm:h-9 p-0 ${speechOn ? "text-accent" : "text-muted-foreground"}`} onClick={() => updateSetting("speechEnabled", !speechOn)} title="הכרזה קולית">
              {speechOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
            {/* Custom voice toggle */}
            <Button variant="ghost" size="sm" className={`w-8 h-8 sm:w-9 sm:h-9 p-0 ${liveSettings.customVoiceEnabled !== false ? "text-accent" : "text-muted-foreground"}`} onClick={() => updateSetting("customVoiceEnabled" as any, !(liveSettings.customVoiceEnabled !== false))} title="הקלטות אישיות">
              <AudioLines className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            {isFreeLayout && (
              <>
                <Button variant="ghost" size="sm" className={`w-8 h-8 sm:w-9 sm:h-9 p-0 ${editMode ? "text-game-orange font-bold" : "text-muted-foreground"}`} onClick={() => setEditMode(!editMode)} title="מצב עריכה">
                  {editMode ? <Unlock className="w-4 h-4 sm:w-5 sm:h-5" /> : <Lock className="w-4 h-4 sm:w-5 sm:h-5" />}
                </Button>
                <Button variant="ghost" size="sm" className={`w-8 h-8 sm:w-9 sm:h-9 p-0 ${showGrid ? "text-game-blue" : "text-muted-foreground"}`} onClick={() => setShowGrid(!showGrid)} title="גריד">
                  <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                {editMode && (
                  <>
                    <Button variant="ghost" size="sm" className={`w-8 h-8 sm:w-9 sm:h-9 p-0 ${saveFlash ? "text-green-500" : "text-muted-foreground"}`} onClick={saveLayout} title="שמור">
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-8 h-8 sm:w-9 sm:h-9 p-0 text-muted-foreground" onClick={duplicateLayout} title="שכפל">
                      <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold shrink-0">
            <span>🎯 {matchedCount}/{pairCount}</span>
            <span>🔄 {moves}</span>
          </div>
          <Button variant="ghost" size="sm" className="w-8 h-8 sm:w-9 sm:h-9 p-0" onClick={restart}>
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Edit mode banner */}
        {isFreeLayout && (
          <div className="flex items-center justify-center gap-2 py-1.5 bg-game-orange/20 text-game-orange text-xs font-bold">
            <Move className="w-3.5 h-3.5" />
            <span>{editMode ? "מצב גרירה פעיל — גררו קלפים למיקום הרצוי" : "מצב חופשי — לחצו 🔓 לגרירת קלפים"}</span>
          </div>
        )}

        {/* Stars row */}
        {matchedCount > 0 && (
          <div className="flex justify-center gap-1 py-2">{stars}</div>
        )}

        {/* Game area */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative">
          {isFreeLayout ? (
            /* ──── FREE LAYOUT ──── */
            <div
              ref={boardRef}
              className="relative w-full h-full"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: "none", minHeight: "calc(100vh - 160px)" }}
            >
              {showGrid && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.12 }}>
                  <defs>
                    <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                      <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              )}

              {editMode && alignLines.x !== undefined && (
                <div className="absolute top-0 bottom-0 w-px bg-game-blue/50 z-30 pointer-events-none" style={{ left: alignLines.x + 50 }} />
              )}
              {editMode && alignLines.y !== undefined && (
                <div className="absolute left-0 right-0 h-px bg-game-blue/50 z-30 pointer-events-none" style={{ top: alignLines.y + 55 }} />
              )}

              {cards.map((card, i) => {
                const pos = positions[card.uniqueId] || { x: (i % 4) * (freeCardSize + 16) + 20, y: Math.floor(i / 4) * (freeCardSize * 1.2 + 16) + 20 };
                return (
                  <div
                    key={card.uniqueId}
                    className={`absolute bounce-in ${editMode ? "cursor-grab" : ""} ${dragging === card.uniqueId ? "z-20 scale-105 cursor-grabbing" : "z-10"}`}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: freeCardSize,
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
                      emojiScale={liveSettings.emojiScale}
                      cardStyle={liveSettings.cardStyle}
                      onClick={() => { if (!editMode) flipCard(card.uniqueId); }}
                    />
                  </div>
                );
              })}
            </div>
          ) : isSpecialLayout ? (
            /* ──── SPECIAL LAYOUT (circle, wave, diamond, spiral, random) ──── */
            <div
              ref={specialContainerRef}
              className="relative w-full"
              style={{ maxWidth: `${cardMaxW}px`, minHeight: "calc(100vh - 200px)" }}
            >
              {cards.map((card, i) => {
                const pos = specialPositions[i] || { x: 0, y: 0 };
                return (
                  <div
                    key={card.uniqueId}
                    className="absolute bounce-in"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: specialCardW,
                      animationDelay: `${i * 0.06}s`,
                      transition: "left 0.4s ease, top 0.4s ease",
                    }}
                  >
                    <MemoryCard
                      emoji={card.emoji}
                      label={card.label}
                      image={card.image}
                      isFlipped={card.isFlipped}
                      isMatched={card.isMatched}
                      theme={theme}
                      emojiScale={liveSettings.emojiScale}
                      cardStyle={liveSettings.cardStyle}
                      onClick={() => flipCard(card.uniqueId)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* ──── GRID LAYOUT ──── */
            <div className={`grid ${gridCols} gap-2 sm:gap-3 md:gap-4 w-full`} style={{ maxWidth: `${cardMaxW}px` }}>
              {cards.map((card, i) => (
                <div key={card.uniqueId} className="bounce-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <MemoryCard
                    emoji={card.emoji}
                    label={card.label}
                    image={card.image}
                    isFlipped={card.isFlipped}
                    isMatched={card.isMatched}
                    theme={theme}
                    emojiScale={liveSettings.emojiScale}
                    cardStyle={liveSettings.cardStyle}
                    onClick={() => flipCard(card.uniqueId)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Layout Picker FAB */}
        {!isFreeLayout && (
          <div className="fixed bottom-16 sm:bottom-20 right-3 sm:right-4 z-40">
            <LayoutPicker current={activePreset} onSelect={handlePresetSelect} />
          </div>
        )}

        {/* Win overlay */}
        {isGameOver && (
          <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-sm w-full text-center shadow-2xl bounce-in space-y-3 sm:space-y-4">
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
