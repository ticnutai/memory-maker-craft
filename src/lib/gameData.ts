export type ThemeType = "girl" | "boy";
export type CardSetType = "animals" | "fruits" | "vehicles" | "hebrew" | "real-animals" | "desserts" | "dinos" | "custom";

export interface CardStyle {
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  backColor: string;
  backColor2?: string;
  backIcon: string;
  shape: string;
}

export interface CardPosition {
  x: number;
  y: number;
}

export interface GameSettings {
  pairCount: number;
  cardMaxW: number;
  emojiScale: number;
  soundEnabled: boolean;
  speechEnabled: boolean;
  speechRate: number;
  flipDuration: number;
  musicType: "none" | "builtin" | "custom" | "cloud";
  builtinMelodyId?: string;
  customMusic?: string;
  cardStyle: CardStyle;
  bgTheme?: string;
  layoutMode?: "grid" | "free";
  snapToGrid?: boolean;
  gridSize?: number;
  cardPositions?: CardPosition[];
  animationsEnabled?: boolean;
  layoutPreset?: string;
  customVoiceEnabled?: boolean;
}

export interface CardData {
  id: string;
  emoji: string;
  label?: string;
  image?: string;
}

export interface GameCard extends CardData {
  uniqueId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// ── Animal sets (expanded) ──
export const GIRL_ANIMALS: CardData[] = [
  { id: "bunny", emoji: "🐰" }, { id: "butterfly", emoji: "🦋" },
  { id: "cat", emoji: "🐱" }, { id: "unicorn", emoji: "🦄" },
  { id: "dolphin", emoji: "🐬" }, { id: "flamingo", emoji: "🦩" },
  { id: "panda", emoji: "🐼" }, { id: "owl", emoji: "🦉" },
  { id: "koala", emoji: "🐨" }, { id: "penguin", emoji: "🐧" },
  { id: "deer", emoji: "🦌" }, { id: "swan", emoji: "🦢" },
  { id: "hedgehog", emoji: "🦔" }, { id: "parrot", emoji: "🦜" },
  { id: "ladybug", emoji: "🐞" }, { id: "snail", emoji: "🐌" },
];

export const BOY_ANIMALS: CardData[] = [
  { id: "lion", emoji: "🦁" }, { id: "dinosaur", emoji: "🦕" },
  { id: "shark", emoji: "🦈" }, { id: "bear", emoji: "🐻" },
  { id: "dragon", emoji: "🐉" }, { id: "eagle", emoji: "🦅" },
  { id: "wolf", emoji: "🐺" }, { id: "octopus", emoji: "🐙" },
  { id: "gorilla", emoji: "🦍" }, { id: "crocodile", emoji: "🐊" },
  { id: "whale", emoji: "🐋" }, { id: "scorpion", emoji: "🦂" },
  { id: "bat", emoji: "🦇" }, { id: "rhino", emoji: "🦏" },
  { id: "trex", emoji: "🦖" }, { id: "snake", emoji: "🐍" },
];

// ── Fruits (expanded) ──
export const FRUITS: CardData[] = [
  { id: "apple", emoji: "🍎" }, { id: "banana", emoji: "🍌" },
  { id: "grapes", emoji: "🍇" }, { id: "strawberry", emoji: "🍓" },
  { id: "watermelon", emoji: "🍉" }, { id: "cherry", emoji: "🍒" },
  { id: "peach", emoji: "🍑" }, { id: "pineapple", emoji: "🍍" },
  { id: "mango", emoji: "🥭" }, { id: "kiwi", emoji: "🥝" },
  { id: "lemon", emoji: "🍋" }, { id: "coconut", emoji: "🥥" },
  { id: "avocado", emoji: "🥑" }, { id: "tomato", emoji: "🍅" },
  { id: "corn", emoji: "🌽" }, { id: "carrot", emoji: "🥕" },
];

// ── Vehicles (expanded) ──
export const VEHICLES: CardData[] = [
  { id: "car", emoji: "🚗" }, { id: "truck", emoji: "🚚" },
  { id: "bus", emoji: "🚌" }, { id: "train", emoji: "🚂" },
  { id: "airplane", emoji: "✈️" }, { id: "rocket", emoji: "🚀" },
  { id: "helicopter", emoji: "🚁" }, { id: "ship", emoji: "🚢" },
  { id: "motorcycle", emoji: "🏍️" }, { id: "bicycle", emoji: "🚲" },
  { id: "tractor", emoji: "🚜" }, { id: "ambulance", emoji: "🚑" },
  { id: "firetruck", emoji: "🚒" }, { id: "police", emoji: "🚓" },
  { id: "taxi", emoji: "🚕" }, { id: "sailboat", emoji: "⛵" },
];

// ── Hebrew letters (expanded) ──
export const HEBREW_LETTERS: CardData[] = [
  { id: "alef", emoji: "א", label: "אָלֶף" },
  { id: "bet", emoji: "ב", label: "בֵּית" },
  { id: "gimel", emoji: "ג", label: "גִּימֶל" },
  { id: "dalet", emoji: "ד", label: "דָּלֶת" },
  { id: "he", emoji: "ה", label: "הֵא" },
  { id: "vav", emoji: "ו", label: "וָו" },
  { id: "zayin", emoji: "ז", label: "זַיִן" },
  { id: "chet", emoji: "ח", label: "חֵית" },
  { id: "tet", emoji: "ט", label: "טֵית" },
  { id: "yod", emoji: "י", label: "יוֹד" },
  { id: "kaf", emoji: "כ", label: "כַּף" },
  { id: "lamed", emoji: "ל", label: "לָמֶד" },
  { id: "mem", emoji: "מ", label: "מֵם" },
  { id: "nun", emoji: "נ", label: "נוּן" },
  { id: "samekh", emoji: "ס", label: "סָמֶך" },
  { id: "ayin", emoji: "ע", label: "עַיִן" },
];

export interface CardSetInfo {
  type: CardSetType;
  emoji: string;
  label: string;
  color: string;
  cards: CardData[];
}

export function getCardSets(theme: ThemeType): CardSetInfo[] {
  return [
    {
      type: "animals", emoji: "🐾", label: "חיות",
      color: theme === "girl" ? "from-game-pink to-primary" : "from-game-blue to-secondary",
      cards: theme === "girl" ? GIRL_ANIMALS : BOY_ANIMALS,
    },
    {
      type: "fruits", emoji: "🍎", label: "פירות",
      color: "from-red-400 to-game-orange",
      cards: FRUITS,
    },
    {
      type: "vehicles", emoji: "🚀", label: "כלי רכב",
      color: "from-game-blue to-blue-600",
      cards: VEHICLES,
    },
    {
      type: "hebrew", emoji: "א", label: "אותיות",
      color: "from-accent to-emerald-500",
      cards: HEBREW_LETTERS,
    },
  ];
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createGameCards(cards: CardData[], pairCount: number = 4): GameCard[] {
  // Shuffle source cards first so each game gets different ones
  const shuffledSource = shuffleArray([...cards]);
  const selected = shuffledSource.slice(0, pairCount);
  const pairs = selected.flatMap((card) => [
    { ...card, uniqueId: `${card.id}-a`, isFlipped: false, isMatched: false },
    { ...card, uniqueId: `${card.id}-b`, isFlipped: false, isMatched: false },
  ]);
  return shuffleArray(pairs);
}