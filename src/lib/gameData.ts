export type ThemeType = "girl" | "boy";
export type CardSetType = "animals" | "fruits" | "vehicles" | "hebrew" | "custom" | "sea" | "space" | "food" | "sports" | "music" | "flags" | "nature";

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

// ── Sea Creatures ──
export const SEA_CREATURES: CardData[] = [
  { id: "tropical-fish", emoji: "🐠" }, { id: "blowfish", emoji: "🐡" },
  { id: "jellyfish", emoji: "🪼" }, { id: "seal", emoji: "🦭" },
  { id: "whale2", emoji: "🐳" }, { id: "shrimp", emoji: "🦐" },
  { id: "crab", emoji: "🦀" }, { id: "lobster", emoji: "🦞" },
  { id: "squid", emoji: "🦑" }, { id: "shell", emoji: "🐚" },
  { id: "turtle", emoji: "🐢" }, { id: "starfish", emoji: "⭐" },
  { id: "coral", emoji: "🪸" }, { id: "seahorse", emoji: "🐴" },
  { id: "otter", emoji: "🦦" }, { id: "oyster", emoji: "🦪" },
];

// ── Space ──
export const SPACE: CardData[] = [
  { id: "earth", emoji: "🌍" }, { id: "moon", emoji: "🌙" },
  { id: "sun", emoji: "☀️" }, { id: "star2", emoji: "🌟" },
  { id: "rocket2", emoji: "🚀" }, { id: "satellite", emoji: "🛸" },
  { id: "meteor", emoji: "☄️" }, { id: "telescope", emoji: "🔭" },
  { id: "astronaut", emoji: "👨‍🚀" }, { id: "saturn", emoji: "🪐" },
  { id: "milkyway", emoji: "🌌" }, { id: "orbit", emoji: "🛰️" },
  { id: "alien", emoji: "👽" }, { id: "constellation", emoji: "✨" },
  { id: "eclipse", emoji: "🌑" }, { id: "aurora", emoji: "🌈" },
];

// ── Food & Sweets ──
export const FOOD: CardData[] = [
  { id: "pizza", emoji: "🍕" }, { id: "burger", emoji: "🍔" },
  { id: "fries", emoji: "🍟" }, { id: "hotdog", emoji: "🌭" },
  { id: "icecream", emoji: "🍦" }, { id: "cake", emoji: "🎂" },
  { id: "donut", emoji: "🍩" }, { id: "cookie", emoji: "🍪" },
  { id: "candy", emoji: "🍬" }, { id: "chocolate", emoji: "🍫" },
  { id: "lollipop", emoji: "🍭" }, { id: "cupcake", emoji: "🧁" },
  { id: "popcorn", emoji: "🍿" }, { id: "waffle", emoji: "🧇" },
  { id: "pancakes", emoji: "🥞" }, { id: "pie", emoji: "🥧" },
];

// ── Sports ──
export const SPORTS: CardData[] = [
  { id: "soccer", emoji: "⚽" }, { id: "basketball", emoji: "🏀" },
  { id: "football", emoji: "🏈" }, { id: "baseball", emoji: "⚾" },
  { id: "tennis", emoji: "🎾" }, { id: "volleyball", emoji: "🏐" },
  { id: "rugby", emoji: "🏉" }, { id: "pingpong", emoji: "🏓" },
  { id: "badminton", emoji: "🏸" }, { id: "hockey", emoji: "🏒" },
  { id: "skiing", emoji: "⛷️" }, { id: "surfing", emoji: "🏄" },
  { id: "swimming", emoji: "🏊" }, { id: "cycling", emoji: "🚴" },
  { id: "skateboard", emoji: "🛹" }, { id: "bowling", emoji: "🎳" },
];

// ── Musical Instruments ──
export const MUSIC_INSTRUMENTS: CardData[] = [
  { id: "guitar", emoji: "🎸" }, { id: "piano", emoji: "🎹" },
  { id: "violin", emoji: "🎻" }, { id: "drum", emoji: "🥁" },
  { id: "trumpet", emoji: "🎺" }, { id: "saxophone", emoji: "🎷" },
  { id: "microphone", emoji: "🎤" }, { id: "headphones", emoji: "🎧" },
  { id: "banjo", emoji: "🪕" }, { id: "accordion", emoji: "🪗" },
  { id: "flute", emoji: "🪈" }, { id: "maracas", emoji: "🪇" },
  { id: "notes", emoji: "🎵" }, { id: "dj", emoji: "🎶" },
  { id: "radio", emoji: "📻" }, { id: "speaker", emoji: "🔊" },
];

// ── Flags ──
export const FLAGS: CardData[] = [
  { id: "israel", emoji: "🇮🇱", label: "ישראל" }, { id: "usa", emoji: "🇺🇸", label: "ארה\"ב" },
  { id: "uk", emoji: "🇬🇧", label: "בריטניה" }, { id: "france", emoji: "🇫🇷", label: "צרפת" },
  { id: "germany", emoji: "🇩🇪", label: "גרמניה" }, { id: "italy", emoji: "🇮🇹", label: "איטליה" },
  { id: "spain", emoji: "🇪🇸", label: "ספרד" }, { id: "japan", emoji: "🇯🇵", label: "יפן" },
  { id: "brazil", emoji: "🇧🇷", label: "ברזיל" }, { id: "canada", emoji: "🇨🇦", label: "קנדה" },
  { id: "australia", emoji: "🇦🇺", label: "אוסטרליה" }, { id: "india", emoji: "🇮🇳", label: "הודו" },
  { id: "china", emoji: "🇨🇳", label: "סין" }, { id: "mexico", emoji: "🇲🇽", label: "מקסיקו" },
  { id: "southkorea", emoji: "🇰🇷", label: "דרום קוריאה" }, { id: "turkey", emoji: "🇹🇷", label: "טורקיה" },
];

// ── Nature ──
export const NATURE: CardData[] = [
  { id: "sunflower", emoji: "🌻" }, { id: "rose", emoji: "🌹" },
  { id: "tulip", emoji: "🌷" }, { id: "cherry-blossom", emoji: "🌸" },
  { id: "cactus", emoji: "🌵" }, { id: "tree", emoji: "🌳" },
  { id: "palm", emoji: "🌴" }, { id: "mushroom", emoji: "🍄" },
  { id: "leaf", emoji: "🍃" }, { id: "clover", emoji: "🍀" },
  { id: "rainbow2", emoji: "🌈" }, { id: "volcano", emoji: "🌋" },
  { id: "wave", emoji: "🌊" }, { id: "snowflake", emoji: "❄️" },
  { id: "fire", emoji: "🔥" }, { id: "mountain", emoji: "🏔️" },
];

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
    {
      type: "sea", emoji: "🐠", label: "עולם הים",
      color: "from-cyan-400 to-blue-500",
      cards: SEA_CREATURES,
    },
    {
      type: "space", emoji: "🚀", label: "חלל",
      color: "from-indigo-500 to-purple-700",
      cards: SPACE,
    },
    {
      type: "food", emoji: "🍕", label: "אוכל ומתוקים",
      color: "from-amber-400 to-orange-500",
      cards: FOOD,
    },
    {
      type: "sports", emoji: "⚽", label: "ספורט",
      color: "from-green-400 to-emerald-600",
      cards: SPORTS,
    },
    {
      type: "music", emoji: "🎸", label: "מוזיקה",
      color: "from-violet-400 to-fuchsia-500",
      cards: MUSIC_INSTRUMENTS,
    },
    {
      type: "flags", emoji: "🇮🇱", label: "דגלים",
      color: "from-sky-400 to-blue-600",
      cards: FLAGS,
    },
    {
      type: "nature", emoji: "🌿", label: "טבע",
      color: "from-lime-400 to-green-500",
      cards: NATURE,
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