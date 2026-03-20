import { useState, useCallback, useRef } from "react";
import { GameCard, CardData, createGameCards } from "@/lib/gameData";
import { playFlipSound, playMatchSound, playMismatchSound, playWinSound } from "@/lib/sounds";

export function useMemoryGame(pairCount: number = 4, soundEnabled: boolean = true) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

    if (soundEnabled) playFlipSound();

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
          if (soundEnabled) playMatchSound();
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id ? { ...c, isMatched: true, isFlipped: true } : c
            )
          );
          const newMatched = matchedCount + 1;
          setMatchedCount(newMatched);
          setFlippedIds([]);
          setIsChecking(false);
          if (newMatched === pairCount) {
            setIsGameOver(true);
            if (soundEnabled) playWinSound();
          }
        }, 600);
      } else {
        timeoutRef.current = setTimeout(() => {
          if (soundEnabled) playMismatchSound();
          setCards((prev) =>
            prev.map((c) =>
              newFlipped.includes(c.uniqueId) ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIds([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [cards, flippedIds, isChecking, matchedCount, pairCount, soundEnabled]);

  return { cards, moves, matchedCount, isGameOver, flipCard, startGame };
}