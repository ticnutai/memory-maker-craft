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
import { RotateCcw, Home, Music, VolumeX, Volume2, Mic, MicOff, Grid3X3, Move, Lock, Unlock, Save, Copy, Lightbulb, Timer, Eye, Users, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setSoundVolumeMultiplier, playSirenMatch, playFireCrackle } from "@/lib/sounds";
import { setSpeechVolumeMultiplier, setElevenLabsTTS } from "@/lib/cardSpeech";

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
  const [speechOn, setSpeechOn] = useState(settings.speechEnabled);
  const [globalMute, setGlobalMute] = useState(false);
  const setInfo = getCardSets(theme).find((s) => s.type === cardSetType);
  const cardData = customCards || setInfo?.cards || getCardSets(theme)[0].cards;
  const pairCount = Math.min(liveSettings.pairCount, cardData.length);
  const effectiveSoundOn = liveSettings.soundEnabled && !globalMute;
  const effectiveSpeechOn = speechOn && !globalMute;
  const { cards, moves, matchedCount, isGameOver, flipCard, startGame } = useMemoryGame(pairCount, effectiveSoundOn, effectiveSpeechOn, liveSettings.flipDuration, liveSettings.speechRate, liveSettings.customVoiceEnabled !== false, (liveSettings.sfxMode as any) || "builtin", liveSettings.elevenLabsEffectsEnabled === true, (liveSettings.speechLang as any) || "he");
  const activeMelody = liveSettings.musicType === "builtin"
    ? BUILT_IN_MELODIES.find((m) => m.id === liveSettings.builtinMelodyId)
    : undefined;
  const customUrl = (liveSettings.musicType === "custom" || liveSettings.musicType === "cloud") ? liveSettings.customMusic : undefined;
  const { isPlaying: musicPlaying, toggle: toggleMusic, stop: stopMusic } = useBackgroundMusic(
    globalMute ? undefined : activeMelody,
    globalMute ? undefined : customUrl,
    (liveCloud.musicVolume ?? 50) / 100
  );

  const isFreeLayout = liveSettings.layoutMode === "free";
  const snapEnabled = liveSettings.snapToGrid !== false;
  const gridSize = liveSettings.gridSize || 20;

  // Card positions for free layout
  const [positions, setPositions] = useState<Record<string, CardPosition>>({});
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [alignLines, setAlignLines] = useState<{ x?: number; y?: number }>({});
  const [saveFlash, setSaveFlash] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // ── Timer ──
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // ── Hint ──
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintCards, setHintCards] = useState<string[]>([]);

  // ── Memory Training Mode ──
  const [trainingMode, setTrainingMode] = useState(false);
  const [trainingCountdown, setTrainingCountdown] = useState(0);

  // ── Two Player Mode ──
  const [twoPlayerMode, setTwoPlayerMode] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  // ── Volume slider popup ──
  const [volumePopup, setVolumePopup] = useState<"music" | "sound" | "speech" | null>(null);
  const volumePopupTimer = useRef<ReturnType<typeof setTimeout>>();

  // Volume values from cloud (0-100)
  const musicVolume = liveCloud.musicVolume ?? 50;
  const soundVolume = liveCloud.soundVolume ?? 50;
  const speechVolume = liveCloud.speechVolume ?? 50;

  // Sync volume multipliers to sound engines
  useEffect(() => { setSoundVolumeMultiplier(soundVolume / 100); }, [soundVolume]);
  useEffect(() => { setSpeechVolumeMultiplier(speechVolume / 100); }, [speechVolume]);

  // Sync ElevenLabs TTS flag with current sfxMode setting
  useEffect(() => {
    const mode = (liveSettings.sfxMode as string) || "builtin";
    setElevenLabsTTS(mode === "elevenlabs" || mode === "both");
  }, [liveSettings.sfxMode]);

  // Preload card images for smooth reveal
  useEffect(() => {
    const images = cardData.map(c => c.image).filter(Boolean) as string[];
    images.forEach(src => { const img = new Image(); img.src = src; });
  }, [cardData]);

  // Close volume popup on outside click
  useEffect(() => {
    if (!volumePopup) return;
    const close = () => setVolumePopup(null);
    const timer = setTimeout(() => document.addEventListener("click", close), 100);
    return () => { clearTimeout(timer); document.removeEventListener("click", close); };
  }, [volumePopup]);

  // ── Previous state refs for detecting match/mismatch ──
  const prevMatchedRef = useRef(matchedCount);
  const prevMovesRef = useRef(moves);

  // ── Timer logic ──
  useEffect(() => {
    // Load best time from localStorage
    const key = `best-time-${cardSetType}-${pairCount}`;
    const stored = localStorage.getItem(key);
    if (stored) setBestTime(parseInt(stored, 10));
    // Load best moves from localStorage
    const movesKey = `best-moves-${cardSetType}-${pairCount}`;
    const storedMoves = localStorage.getItem(movesKey);
    if (storedMoves) setBestMoves(parseInt(storedMoves, 10));
  }, [cardSetType, pairCount]);

  useEffect(() => {
    if (isGameOver) {
      // Stop timer
      if (timerRef.current) clearInterval(timerRef.current);
      // Save best time
      const timeKey = `best-time-${cardSetType}-${pairCount}`;
      if (bestTime === null || timerSeconds < bestTime) {
        localStorage.setItem(timeKey, timerSeconds.toString());
        setBestTime(timerSeconds);
      }
      // Save best moves
      const movesKey = `best-moves-${cardSetType}-${pairCount}`;
      if (bestMoves === null || moves < bestMoves) {
        localStorage.setItem(movesKey, moves.toString());
        setBestMoves(moves);
      }
      return;
    }
    if (isPaused) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = undefined; }
      return;
    }
    if (moves > 0 && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s + 1 >= 600) {
            clearInterval(timerRef.current!);
            timerRef.current = undefined;
            setIsTimedOut(true);
            return s + 1;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = undefined; } };
  }, [moves, isGameOver, isPaused]);

  // ── Escape key to toggle pause ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isGameOver && !isTimedOut && moves > 0) {
        setIsPaused((p) => !p);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isGameOver, isTimedOut, moves]);

  // ── Hint logic ──
  const useHint = () => {
    if (hintsLeft <= 0) return;
    const unmatched = cards.filter((c) => !c.isMatched && !c.isFlipped);
    if (unmatched.length < 2) return;
    // Find a pair among unmatched
    const pairMap = new Map<string, string[]>();
    unmatched.forEach((c) => {
      const arr = pairMap.get(c.id) || [];
      arr.push(c.uniqueId);
      pairMap.set(c.id, arr);
    });
    let hintPair: string[] = [];
    for (const [, ids] of pairMap) {
      if (ids.length >= 2) { hintPair = [ids[0], ids[1]]; break; }
    }
    if (hintPair.length === 0) return;
    setHintCards(hintPair);
    setHintsLeft((h) => h - 1);
    setTimeout(() => setHintCards([]), 1200);
  };

  // ── Training mode ──
  const startTraining = () => {
    setTrainingMode(true);
    setTrainingCountdown(5);
  };

  useEffect(() => {
    if (!trainingMode || trainingCountdown <= 0) return;
    const t = setTimeout(() => setTrainingCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [trainingMode, trainingCountdown]);

  useEffect(() => {
    if (trainingMode && trainingCountdown === 0) {
      setTrainingMode(false);
    }
  }, [trainingMode, trainingCountdown]);

  // ── Two-player: detect match/mismatch to switch turns & score ──
  useEffect(() => {
    if (!twoPlayerMode) return;
    const newMatched = matchedCount;
    const newMoves = moves;
    if (newMatched > prevMatchedRef.current) {
      // A match happened — current player scores
      setScores((prev) => currentPlayer === 1 ? { ...prev, p1: prev.p1 + 1 } : { ...prev, p2: prev.p2 + 1 });
    } else if (newMoves > prevMovesRef.current) {
      // A mismatch happened — switch player
      setCurrentPlayer((p) => (p === 1 ? 2 : 1));
    }
    prevMatchedRef.current = newMatched;
    prevMovesRef.current = newMoves;
  }, [matchedCount, moves, twoPlayerMode, currentPlayer]);

  // ── Fireman Sam: fire sounds on match ──
  useEffect(() => {
    if (cardSetType === "firesam" && matchedCount > 0) playSirenMatch();
  }, [matchedCount, cardSetType]);

  // הפעל מצב עריכה אוטומטית כשעוברים למצב חופשי
  useEffect(() => {
    if (isFreeLayout) setEditMode(true);
    else setEditMode(false);
  }, [isFreeLayout]);

  useEffect(() => {
    startGame(cardData);
  }, []);

  // Initialize positions when cards change in free mode
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
      // Auto-arrange in grid initially with dynamic card size
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
    await supabase.from("layout_presets").insert({
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
    setTimerSeconds(0);
    setIsPaused(false);
    setIsTimedOut(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = undefined; }
    setHintsLeft(3);
    setHintCards([]);
    setTrainingMode(false);
    setTrainingCountdown(0);
    setCurrentPlayer(1);
    setScores({ p1: 0, p2: 0 });
    prevMatchedRef.current = 0;
    prevMovesRef.current = 0;
    startGame(cardData);
  };

  const cardMaxW = liveSettings.cardMaxW;

  // גודל קלף בודד במצב חופשי — בין 60px ל-200px לפי cardMaxW
  const freeCardSize = Math.max(60, Math.min(200, Math.round(cardMaxW / 4)));

  // Grid columns based on total cards
  const totalCards = pairCount * 2;
  let gridCols = "grid-cols-2 sm:grid-cols-3";
  if (totalCards <= 4) gridCols = "grid-cols-2";
  else if (totalCards <= 6) gridCols = "grid-cols-2 sm:grid-cols-3";
  else if (totalCards <= 8) gridCols = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
  else if (totalCards <= 12) gridCols = "grid-cols-3 sm:grid-cols-4";
  else gridCols = "grid-cols-3 sm:grid-cols-4";

  const bgThemeId = (liveSettings.bgTheme || "default") as BgThemeId;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const stars = Array.from({ length: matchedCount }, (_, i) => (
    <span key={i} className="text-xl bounce-in" style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
  ));

  const animationsOff = liveSettings.animationsEnabled === false;

  return (
    <div dir="rtl" className={animationsOff ? "no-animations" : ""}>
      <ThemeBackground themeId={bgThemeId} girlTheme={theme === "girl"} className="flex flex-col">
        <Confetti active={isGameOver && !animationsOff} />

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-card/80 backdrop-blur-sm border-b border-muted shadow-sm relative gap-y-1">
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => { stopMusic(); onHome(); }}>
              <Home className="w-5 h-5" />
            </Button>
            {/* Global mute */}
            <Button variant="ghost" size="sm" onClick={() => { setGlobalMute(!globalMute); if (!globalMute) stopMusic(); }}
              className={globalMute ? "text-destructive" : "text-green-500"} title={globalMute ? "הפעל הכל" : "השתק הכל"}>
              {globalMute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            {/* Music — click toggle, double-click volume */}
            <div className="relative">
              <Button variant="ghost" size="sm" disabled={globalMute}
                onClick={toggleMusic}
                onDoubleClick={(e) => { e.stopPropagation(); setVolumePopup(volumePopup === "music" ? null : "music"); }}
                className={musicPlaying && !globalMute ? "text-accent" : "text-muted-foreground"} title="לחיצה: הפעל/כבה | לחיצה כפולה: עוצמה">
                {musicPlaying && !globalMute ? <Music className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              {volumePopup === "music" && (
                <div className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-40 sm:w-44 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>🎵 עוצמת מוזיקה</span>
                    <span className="text-muted-foreground">{musicVolume}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={musicVolume}
                    onChange={(e) => updateSetting("musicVolume" as any, Number(e.target.value))}
                    className="w-full h-2 rounded-full cursor-pointer accent-pink-500" />
                  <div className="flex justify-between text-[9px] text-muted-foreground"><span>🔇</span><span>🔊</span></div>
                </div>
              )}
            </div>
            {/* Sound effects — click toggle, double-click volume */}
            <div className="relative">
              <Button variant="ghost" size="sm" disabled={globalMute}
                onClick={() => updateSetting("soundEnabled", !liveSettings.soundEnabled)}
                onDoubleClick={(e) => { e.stopPropagation(); setVolumePopup(volumePopup === "sound" ? null : "sound"); }}
                className={liveSettings.soundEnabled && !globalMute ? "text-accent" : "text-muted-foreground"} title="לחיצה: הפעל/כבה | לחיצה כפולה: עוצמה">
                {liveSettings.soundEnabled && !globalMute ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-[10px] mr-0.5">🔊</span>
              </Button>
              {volumePopup === "sound" && (
                <div className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-40 sm:w-44 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>🔊 עוצמת צלילים</span>
                    <span className="text-muted-foreground">{soundVolume}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={soundVolume}
                    onChange={(e) => updateSetting("soundVolume" as any, Number(e.target.value))}
                    className="w-full h-2 rounded-full cursor-pointer accent-pink-500" />
                  <div className="flex justify-between text-[9px] text-muted-foreground"><span>🔇</span><span>🔊</span></div>
                </div>
              )}
            </div>
            {/* Speech — click toggle, double-click volume */}
            <div className="relative">
              <Button variant="ghost" size="sm" disabled={globalMute}
                onClick={() => setSpeechOn(!speechOn)}
                onDoubleClick={(e) => { e.stopPropagation(); setVolumePopup(volumePopup === "speech" ? null : "speech"); }}
                className={speechOn && !globalMute ? "text-accent" : "text-muted-foreground"} title="לחיצה: הפעל/כבה | לחיצה כפולה: עוצמה">
                {speechOn && !globalMute ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
              {volumePopup === "speech" && (
                <div className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-40 sm:w-44 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>🗣️ עוצמת הכרזה</span>
                    <span className="text-muted-foreground">{speechVolume}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={speechVolume}
                    onChange={(e) => updateSetting("speechVolume" as any, Number(e.target.value))}
                    className="w-full h-2 rounded-full cursor-pointer accent-pink-500" />
                  <div className="flex justify-between text-[9px] text-muted-foreground"><span>🔇</span><span>🔊</span></div>
                </div>
              )}
            </div>
            {isFreeLayout && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)}
                  className={editMode ? "text-game-orange font-bold" : "text-muted-foreground"} title="מצב עריכה (גרירה)">
                  {editMode ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  <span className="text-xs ml-1">{editMode ? "גרירה" : "נעול"}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowGrid(!showGrid)}
                  className={showGrid ? "text-game-blue" : "text-muted-foreground"} title="הצג/הסתר גריד">
                  <Grid3X3 className="w-5 h-5" />
                </Button>
                {editMode && (
                  <>
                    <Button variant="ghost" size="sm" onClick={saveLayout}
                      className={saveFlash ? "text-green-500" : "text-muted-foreground"} title="שמור פריסה (דורס)">
                      <Save className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={duplicateLayout}
                      className="text-muted-foreground" title="שכפל ושמור">
                      <Copy className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm font-bold">
            <span>{isPaused ? "⏸️" : "⏱️"} {formatTime(timerSeconds)}</span>
            <span>🎯 {matchedCount}/{pairCount}</span>
            <span>🔄 {moves}</span>
            {twoPlayerMode && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${currentPlayer === 1 ? "bg-blue-500/20 text-blue-400" : "bg-pink-500/20 text-pink-400"}`}>
                שחקן {currentPlayer}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Hint */}
            <Button variant="ghost" size="sm" onClick={useHint} disabled={hintsLeft <= 0 || isGameOver}
              className="text-yellow-500" title={`רמז (${hintsLeft} נותרו)`}>
              <Lightbulb className="w-5 h-5" />
              <span className="text-xs mr-0.5">{hintsLeft}</span>
            </Button>
            {/* Training mode */}
            <Button variant="ghost" size="sm" onClick={startTraining} disabled={trainingMode || isGameOver}
              className={trainingMode ? "text-purple-500" : "text-muted-foreground"} title="מצב אימון — חשפו את כל הקלפים">
              <Eye className="w-5 h-5" />
            </Button>
            {/* Two-player toggle */}
            <Button variant="ghost" size="sm" onClick={() => { setTwoPlayerMode(!twoPlayerMode); setCurrentPlayer(1); setScores({ p1: 0, p2: 0 }); }}
              className={twoPlayerMode ? "text-green-500" : "text-muted-foreground"} title="מצב שני שחקנים">
              <Users className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsPaused((p) => !p)} disabled={isGameOver || isTimedOut || moves === 0}
              className={isPaused ? "text-yellow-500" : "text-muted-foreground"} title={isPaused ? "המשך" : "השהה"}>
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={restart}>
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
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

        {/* Two-player indicator */}
        {twoPlayerMode && !isGameOver && (
          <div className={`flex items-center justify-center gap-2 sm:gap-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold flex-wrap ${currentPlayer === 1 ? "bg-blue-500/15 text-blue-400" : "bg-pink-500/15 text-pink-400"}`}>
            <span>👤 תור שחקן {currentPlayer}</span>
            <span className="hidden sm:inline">|</span>
            <span>שחקן 1: {scores.p1}</span>
            <span>שחקן 2: {scores.p2}</span>
          </div>
        )}

        {/* Training countdown overlay */}
        {trainingMode && trainingCountdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="bg-purple-600/90 text-white rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-2xl bounce-in">
              <span className="text-4xl font-black">{trainingCountdown}</span>
              <span className="text-xs">שננו!</span>
            </div>
          </div>
        )}

        {/* Game area */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          {isFreeLayout ? (
            /* ──── FREE LAYOUT ──── */
            <div
              ref={boardRef}
              className="relative w-full h-full"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: isFreeLayout ? "none" : "auto", minHeight: "calc(100vh - 160px)" }}
            >
              {/* Grid overlay — מוצג תמיד במצב חופשי */}
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

              {/* Alignment guide lines */}
              {editMode && alignLines.x !== undefined && (
                <div className="absolute top-0 bottom-0 w-px bg-game-blue/50 z-30 pointer-events-none" style={{ left: alignLines.x + 50 }} />
              )}
              {editMode && alignLines.y !== undefined && (
                <div className="absolute left-0 right-0 h-px bg-game-blue/50 z-30 pointer-events-none" style={{ top: alignLines.y + 55 }} />
              )}

              {/* Cards */}
              {cards.map((card, i) => {
                const pos = positions[card.uniqueId] || { x: (i % 4) * (freeCardSize + 16) + 20, y: Math.floor(i / 4) * (freeCardSize * 1.2 + 16) + 20 };
                const isHinted = hintCards.includes(card.uniqueId);
                const showInTraining = trainingMode && trainingCountdown > 0 && !card.isMatched;
                return (
                  <div
                    key={card.uniqueId}
                    className={`absolute bounce-in ${editMode ? "cursor-grab" : ""} ${dragging === card.uniqueId ? "z-20 scale-105 cursor-grabbing" : "z-10"} ${isHinted ? "ring-4 ring-yellow-400 rounded-2xl" : ""}`}
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
                      isFlipped={card.isFlipped || isHinted || showInTraining}
                      isMatched={card.isMatched}
                      theme={theme}
                      emojiScale={liveSettings.emojiScale}
                      cardStyle={liveSettings.cardStyle}
                      onClick={() => { if (!editMode && !trainingMode && !isPaused) { flipCard(card.uniqueId); if (cardSetType === "firesam") playFireCrackle(); } }}
                      extraMatchClass={cardSetType === "firesam" ? "fire-matched-glow" : undefined}
                      sparkleEmojis={cardSetType === "firesam" ? ["🔥", "💧", "🚒", "⛑️"] : undefined}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* ──── GRID LAYOUT ──── */
            <div className={`grid ${gridCols} gap-2 sm:gap-3 md:gap-4 w-full`} style={{ maxWidth: `${cardMaxW}px` }}>
              {cards.map((card, i) => {
                const isHinted = hintCards.includes(card.uniqueId);
                const showInTraining = trainingMode && trainingCountdown > 0 && !card.isMatched;
                return (
                  <div key={card.uniqueId} className={`bounce-in ${isHinted ? "ring-4 ring-yellow-400 rounded-2xl" : ""}`} style={{ animationDelay: `${i * 0.04}s` }}>
                    <MemoryCard
                      emoji={card.emoji}
                      label={card.label}
                      image={card.image}
                      isFlipped={card.isFlipped || isHinted || showInTraining}
                      isMatched={card.isMatched}
                      theme={theme}
                      emojiScale={liveSettings.emojiScale}
                      cardStyle={liveSettings.cardStyle}
                      onClick={() => { if (!trainingMode && !isPaused) { flipCard(card.uniqueId); if (cardSetType === "firesam") playFireCrackle(); } }}
                      extraMatchClass={cardSetType === "firesam" ? "fire-matched-glow" : undefined}
                      sparkleEmojis={cardSetType === "firesam" ? ["🔥", "💧", "🚒", "⛑️"] : undefined}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pause overlay */}
        {isPaused && !isGameOver && (
          <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl bounce-in space-y-4">
              <div className="text-6xl">⏸️</div>
              <h2 className="text-2xl font-black text-foreground">המשחק מושהה</h2>
              <div className="flex flex-col gap-3 pt-2">
                <Button variant={theme === "girl" ? "game-pink" : "game-blue"} size="lg" onClick={() => setIsPaused(false)} className="text-lg">
                  ▶️ המשך
                </Button>
                <Button variant="outline" size="lg" onClick={restart} className="text-lg">
                  🔄 התחל מחדש
                </Button>
                <Button variant="outline" size="lg" onClick={() => { stopMusic(); onHome(); }} className="text-lg">
                  🏠 חזרה הביתה
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Timed out overlay */}
        {isTimedOut && !isGameOver && (
          <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl bounce-in space-y-4">
              <div className="text-6xl">⌛</div>
              <h2 className="text-2xl font-black text-foreground">הזמן נגמר!</h2>
              <p className="text-muted-foreground">מצאתם {matchedCount} מתוך {pairCount} זוגות</p>
              <div className="flex flex-col gap-3 pt-2">
                <Button variant={theme === "girl" ? "game-pink" : "game-blue"} size="lg" onClick={restart} className="text-lg">
                  🔄 נסו שוב
                </Button>
                <Button variant="outline" size="lg" onClick={() => { stopMusic(); onHome(); }} className="text-lg">
                  🏠 חזרה הביתה
                </Button>
              </div>
            </div>
          </div>
        )}

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
              <div className="flex justify-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span>⏱️ זמן: {formatTime(timerSeconds)}</span>
                {bestTime !== null && <span>🥇 שיא זמן: {formatTime(bestTime)}</span>}
                {bestMoves !== null && <span>🎯 שיא ניסיונות: {bestMoves}</span>}
              </div>
              {((bestTime !== null && timerSeconds <= bestTime) || (bestMoves !== null && moves <= bestMoves)) && (
                <p className="text-yellow-500 font-bold text-lg bounce-in">🎊 שיא חדש! 🎊</p>
              )}
              {twoPlayerMode && (
                <div className="flex justify-center gap-6 text-base font-bold">
                  <span className={scores.p1 >= scores.p2 ? "text-blue-400" : "text-muted-foreground"}>
                    שחקן 1: {scores.p1}
                  </span>
                  <span className={scores.p2 >= scores.p1 ? "text-pink-400" : "text-muted-foreground"}>
                    שחקן 2: {scores.p2}
                  </span>
                </div>
              )}
              {twoPlayerMode && scores.p1 !== scores.p2 && (
                <p className="font-bold text-lg">
                  🏅 {scores.p1 > scores.p2 ? "שחקן 1 ניצח!" : "שחקן 2 ניצח!"}
                </p>
              )}
              {twoPlayerMode && scores.p1 === scores.p2 && (
                <p className="font-bold text-lg">🤝 תיקו!</p>
              )}
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
