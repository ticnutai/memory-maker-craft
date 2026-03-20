export type ThemeType = "girl" | "boy";
export type CardSetType = "animals" | "custom";

export interface CardData {
  id: string;
  emoji: string;
  image?: string; // for custom photos
}

export interface GameCard extends CardData {
  uniqueId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Animal sets — emoji-based for simplicity and delight
export const GIRL_ANIMALS: CardData[] = [
  { id: "bunny", emoji: "🐰" },
  { id: "butterfly", emoji: "🦋" },
  { id: "cat", emoji: "🐱" },
  { id: "unicorn", emoji: "🦄" },
  { id: "dolphin", emoji: "🐬" },
  { id: "flamingo", emoji: "🦩" },
];

export const BOY_ANIMALS: CardData[] = [
  { id: "lion", emoji: "🦁" },
  { id: "dinosaur", emoji: "🦕" },
  { id: "shark", emoji: "🦈" },
  { id: "bear", emoji: "🐻" },
  { id: "dragon", emoji: "🐉" },
  { id: "eagle", emoji: "🦅" },
];

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createGameCards(cards: CardData[], pairCount: number = 4): GameCard[] {
  const selected = cards.slice(0, pairCount);
  const pairs = selected.flatMap((card) => [
    { ...card, uniqueId: `${card.id}-a`, isFlipped: false, isMatched: false },
    { ...card, uniqueId: `${card.id}-b`, isFlipped: false, isMatched: false },
  ]);
  return shuffleArray(pairs);
}