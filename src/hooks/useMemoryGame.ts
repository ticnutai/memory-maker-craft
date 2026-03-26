import { useState, useCallback, useRef, useEffect } from "react";
import { GameCard, CardData, createGameCards } from "@/lib/gameData";
import { playFlipSound, playMatchSound, playMismatchSound, playWinSound, playStarSound } from "@/lib/sounds";
import { playCardSound } from "@/lib/cardSounds";
import { speakCardName, setSpeechLang, VOICE_EFFECTS, type SpeechLang } from "@/lib/cardSpeech";
import { supabase } from "@/integrations/supabase/client";
import { elevenLabsSfx, elevenLabsSpeak } from "@/lib/elevenLabs";

interface VoiceRec {
  event_type: string;
  audio_url: string;
  is_active: boolean;
}

type SfxMode = "builtin" | "elevenlabs" | "both";

export function useMemoryGame(
  pairCount: number = 4,
  soundEnabled: boolean = true,
  speechEnabled: boolean = true,
  flipDuration: number = 1,
  speechRate: number = 0.9,
  customVoiceEnabled: boolean = true,
  sfxMode: SfxMode = "builtin",
  elevenLabsEffectsEnabled: boolean = false,
  speechLang: SpeechLang = "he"
) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const voiceRecsRef = useRef<VoiceRec[]>([]);

  // Load custom voice recordings
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("voice_recordings")
        .select("event_type, audio_url, is_active")
        .eq("is_active", true);
      voiceRecsRef.current = (data as VoiceRec[]) || [];
    };
    load();
  }, []);

  const playCustomVoice = useCallback((eventType: string) => {
    const recs = voiceRecsRef.current.filter((r) => r.event_type === eventType);
    if (recs.length === 0) return false;
    const rec = recs[Math.floor(Math.random() * recs.length)];
    try {
      new Audio(rec.audio_url).play();
    } catch {
      return false;
    }
    return true;
  }, []);

  // Play SFX based on mode
  const playSfx = useCallback((eventType: string, builtinFn: () => void) => {
    if (!soundEnabled) return;

    // Custom voice recordings take priority
    if (customVoiceEnabled && playCustomVoice(eventType)) {
      if (sfxMode !== "both") return;
    }

    if (sfxMode === "elevenlabs" || sfxMode === "both") {
      elevenLabsSfx(eventType).catch(() => {});
      if (sfxMode === "elevenlabs") return;
    }

    // Built-in Web Audio
    builtinFn();
  }, [soundEnabled, sfxMode, customVoiceEnabled, playCustomVoice]);

  // Set speech language
  useEffect(() => {
    setSpeechLang(speechLang);
  }, [speechLang]);

  // Play ElevenLabs voice effect (encouragement)
  const playVoiceEffect = useCallback((eventType: string) => {
    if (!elevenLabsEffectsEnabled || !soundEnabled) return;
    const langPhrases = VOICE_EFFECTS[speechLang];
    const phrases = langPhrases?.[eventType];
    if (!phrases) return;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    setTimeout(() => {
      elevenLabsSpeak(phrase).catch(() => {});
    }, 400);
  }, [elevenLabsEffectsEnabled, soundEnabled, speechLang]);

  const startGame = useCallback((cardData: CardData[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCards(createGameCards(cardData, pairCount));
    setFlippedIds([]);
    setMoves(0);
    setMatchedCount(0);
    setIsChecking(false);
    setIsGameOver(false);
  }, [pairCount]);

  const flipCard = useCallback((uniqueId: string) => {
    if (isChecking) return;

    const card = cards.find((c) => c.uniqueId === uniqueId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (flippedIds.length >= 2) return;

    if (soundEnabled) {
      playSfx("flip", playFlipSound);
      playCardSound(card.id);
    }
    if (speechEnabled) {
      setTimeout(() => speakCardName(card.id, speechRate), 150);
    }

    const newFlipped = [...flippedIds, uniqueId];
    setFlippedIds(newFlipped);
    setCards((prev) =>
      prev.map((c) => (c.uniqueId === uniqueId ? { ...c, isFlipped: true } : c))
    );

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves((m) => m + 1);

      const [firstId, secondId] = newFlipped;
      const first = cards.find((c) => c.uniqueId === firstId)!;
      const second = cards.find((c) => c.uniqueId === secondId)!;

      if (first.id === second.id) {
        timeoutRef.current = setTimeout(() => {
          playSfx("match", playMatchSound);
          playVoiceEffect("match");
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id ? { ...c, isMatched: true, isFlipped: true } : c
            )
          );
          const newMatched = matchedCount + 1;
          setMatchedCount(newMatched);
          if (soundEnabled) setTimeout(() => playStarSound(), 300);
          setFlippedIds([]);
          setIsChecking(false);
          if (newMatched === pairCount) {
            setTimeout(() => {
              setIsGameOver(true);
              playSfx("win", playWinSound);
              playVoiceEffect("win");
            }, 500);
          }
        }, 600);
      } else {
        timeoutRef.current = setTimeout(() => {
          playSfx("mismatch", playMismatchSound);
          playVoiceEffect("mismatch");
          setCards((prev) =>
            prev.map((c) =>
              newFlipped.includes(c.uniqueId) ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIds([]);
          setIsChecking(false);
        }, flipDuration * 1000);
      }
    }
  }, [cards, flippedIds, isChecking, matchedCount, pairCount, soundEnabled, speechEnabled, speechRate, flipDuration, playSfx, playVoiceEffect]);

  return { cards, moves, matchedCount, isGameOver, flipCard, startGame };
}
