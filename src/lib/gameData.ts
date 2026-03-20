export type ThemeType = "girl" | "boy";
export type CardSetType = "animals" | "fruits" | "vehicles" | "hebrew" | "custom";
export type CardSize = "small" | "medium" | "large";

export interface GameSettings {
  pairCount: number;
  cardSize: CardSize;
  soundEnabled: boolean;
  flipDuration: number;
  customMusic?: string;
}

export interface CardData {
  id: string;
  emoji: string;
  label?: string; // for hebrew letters
  image?: string;
}

export interface GameCard extends CardData {
  uniqueId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// ── Animal sets ──
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

// ── Fruits ──
export const FRUITS: CardData[] = [
  { id: "apple", emoji: "🍎" },
  { id: "banana", emoji: "🍌" },
  { id: "grapes", emoji: "🍇" },
  { id: "strawberry", emoji: "🍓" },
  { id: "watermelon", emoji: "🍉" },
  { id: "cherry", emoji: "🍒" },
  { id: "peach", emoji: "🍑" },
  { id: "pineapple", emoji: "🍍" },
];

// ── Vehicles ──
export const VEHICLES: CardData[] = [
  { id: "car", emoji: "🚗" },
  { id: "truck", emoji: "🚚" },
  { id: "bus", emoji: "🚌" },
  { id: "train", emoji: "🚂" },
  { id: "airplane", emoji: "✈️" },
  { id: "rocket", emoji: "🚀" },
  { id: "helicopter", emoji: "🚁" },
  { id: "ship", emoji: "🚢" },
];

// ── Hebrew letters ──
export const HEBREW_LETTERS: CardData[] = [
  { id: "alef", emoji: "א", label: "אָלֶף" },
  { id: "bet", emoji: "ב", label: "בֵּית" },
  { id: "gimel", emoji: "ג", label: "גִּימֶל" },
  { id: "dalet", emoji: "ד", label: "דָּלֶת" },
  { id: "he", emoji: "ה", label: "הֵא" },
  { id: "vav", emoji: "ו", label: "וָו" },
  { id: "zayin", emoji: "ז", label: "זַיִן" },
  { id: "chet", emoji: "ח", label: "חֵית" },
];

export interface CardSetInfo {
  type: CardSetType;
  emoji: string;
  label: string;
  color: string; // tailwind classes
  cards: CardData[];
}

export function getCardSets(theme: ThemeType): CardSetInfo[] {
  return [
    {
      type: "animals",
      emoji: "🐾",
      label: "חיות",
      color: theme === "girl" ? "from-game-pink to-primary" : "from-game-blue to-secondary",
      cards: theme === "girl" ? GIRL_ANIMALS : BOY_ANIMALS,
    },
    {
      type: "fruits",
      emoji: "🍎",
      label: "פירות",
      color: "from-red-400 to-game-orange",
      cards: FRUITS,
    },
    {
      type: "vehicles",
      emoji: "🚀",
      label: "כלי רכב",
      color: "from-game-blue to-blue-600",
      cards: VEHICLES,
    },
    {
      type: "hebrew",
      emoji: "א",
      label: "אותיות",
      color: "from-accent to-emerald-500",
      cards: HEBREW_LETTERS,
    },
  ];
}

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