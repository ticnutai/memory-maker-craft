export type ThemeType = "girl" | "boy";
export type CardSetType = "animals" | "custom";
export type CardSize = "small" | "medium" | "large";

export interface GameSettings {
  pairCount: number;
  cardSize: CardSize;
  soundEnabled: boolean;
}

export interface CardData {
  id: string;
  emoji: string;
  image?: string;
}

export interface GameCard extends CardData {
  uniqueId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const GIRL_ANIMALS: CardData[] = [
  { id: "bunny", emoji: "🐰" },
  { id: "butterfly", emoji: "🦋" },
  { id: "cat", emoji: "🐱" },
  { id: "unicorn", emoji: "🦄" },
  { id: "dolphin", emoji: "🐬" },
  { id: "flamingo", emoji: "🦩" },
  { id: "panda", emoji: "🐼" },
  { id: "owl", emoji: "🦉" },
];

export const BOY_ANIMALS: CardData[] = [
  { id: "lion", emoji: "🦁" },
  { id: "dinosaur", emoji: "🦕" },
  { id: "shark", emoji: "🦈" },
  { id: "bear", emoji: "🐻" },
  { id: "dragon", emoji: "🐉" },
  { id: "eagle", emoji: "🦅" },
  { id: "wolf", emoji: "🐺" },
  { id: "octopus", emoji: "🐙" },
];

export const CARD_SIZE_CONFIG: Record<CardSize, { maxW: string; cardClass: string; emojiClass: string }> = {
  small: { maxW: "max-w-sm", cardClass: "", emojiClass: "text-3xl sm:text-4xl" },
  medium: { maxW: "max-w-lg", cardClass: "", emojiClass: "text-4xl sm:text-5xl md:text-6xl" },
  large: { maxW: "max-w-2xl", cardClass: "", emojiClass: "text-5xl sm:text-6xl md:text-7xl" },
};

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