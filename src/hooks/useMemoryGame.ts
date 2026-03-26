import { useState, useCallback, useRef, useEffect } from "react";
import { GameCard, CardData, createGameCards } from "@/lib/gameData";
import { playFlipSound, playMatchSound, playMismatchSound, playWinSound, playStarSound } from "@/lib/sounds";
import { playCardSound } from "@/lib/cardSounds";
import { speakCardName } from "@/lib/cardSpeech";
import { supabase } from "@/integrations/supabase/client";

interface VoiceRec {
  event_type: string;
  audio_url: string;
  is_active: boolean;
}

function getDeviceId(): string {
  return localStorage.getItem("memory-game-device-id") || "unknown";
}

export function useMemoryGame(pairCount: number = 4, soundEnabled: boolean = true, speechEnabled: boolean = true, flipDuration: number = 1, speechRate: number = 0.9, customVoiceEnabled: boolean = true) {
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
      playFlipSound();
      playCardSound(card.id);
    }
    if (speechEnabled) {
      setTimeout(() => speakCardName(card.id, speechRate), 150);
    }
    // Custom flip voice
    if (soundEnabled && customVoiceEnabled) playCustomVoice("flip");

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
          if (soundEnabled) {
            if (!(customVoiceEnabled && playCustomVoice("match"))) playMatchSound();
          }
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
              if (soundEnabled) {
                if (!(customVoiceEnabled && playCustomVoice("win"))) playWinSound();
              }
            }, 500);
          }
        }, 600);
      } else {
        timeoutRef.current = setTimeout(() => {
          if (soundEnabled) {
            if (!(customVoiceEnabled && playCustomVoice("mismatch"))) playMismatchSound();
          }
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
  }, [cards, flippedIds, isChecking, matchedCount, pairCount, soundEnabled, speechEnabled, speechRate, flipDuration, customVoiceEnabled, playCustomVoice]);

  return { cards, moves, matchedCount, isGameOver, flipCard, startGame };
}