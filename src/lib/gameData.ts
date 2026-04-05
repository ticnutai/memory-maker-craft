export type ThemeType = "girl" | "boy";
export type CardSetType = "animals" | "fruits" | "vehicles" | "hebrew" | "real-animals" | "desserts" | "dinos" | "farm" | "real-vehicles" | "shapes" | "horses" | "sea" | "space" | "food" | "sports" | "music" | "flags" | "nature" | "abc" | "custom" | "pokemon" | "firesam" | "jungle" | "bugs" | "holidays" | "flowers" | "birds";

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
  musicVolume?: number;
  soundVolume?: number;
  speechVolume?: number;
  layoutPreset?: string;
  customVoiceEnabled?: boolean;
  sfxMode?: "builtin" | "elevenlabs" | "both";
  elevenLabsVoiceId?: string;
  elevenLabsEffectsEnabled?: boolean;
  speechLang?: "he" | "en" | "de";
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

// ── Realistic Animals (image-based) ──
import imgDog from "@/assets/cards/animals/dog.jpg";
import imgCat from "@/assets/cards/animals/cat.jpg";
import imgBunny from "@/assets/cards/animals/bunny.jpg";
import imgPanda from "@/assets/cards/animals/panda.jpg";
import imgPenguin from "@/assets/cards/animals/penguin.jpg";
import imgOwl from "@/assets/cards/animals/owl.jpg";
import imgFox from "@/assets/cards/animals/fox.jpg";
import imgKoala from "@/assets/cards/animals/koala.jpg";

export const REAL_ANIMALS: CardData[] = [
  { id: "real-dog", emoji: "🐕", label: "כלב", image: imgDog },
  { id: "real-cat", emoji: "🐱", label: "חתול", image: imgCat },
  { id: "real-bunny", emoji: "🐰", label: "ארנב", image: imgBunny },
  { id: "real-panda", emoji: "🐼", label: "פנדה", image: imgPanda },
  { id: "real-penguin", emoji: "🐧", label: "פינגווין", image: imgPenguin },
  { id: "real-owl", emoji: "🦉", label: "ינשוף", image: imgOwl },
  { id: "real-fox", emoji: "🦊", label: "שועל", image: imgFox },
  { id: "real-koala", emoji: "🐨", label: "קואלה", image: imgKoala },
];

// ── Desserts (image-based) ──
import imgCupcake from "@/assets/cards/desserts/cupcake.jpg";
import imgDonut from "@/assets/cards/desserts/donut.jpg";
import imgIcecream from "@/assets/cards/desserts/icecream.jpg";
import imgCake from "@/assets/cards/desserts/cake.jpg";
import imgMacarons from "@/assets/cards/desserts/macarons.jpg";
import imgCookies from "@/assets/cards/desserts/cookies.jpg";
import imgLollipop from "@/assets/cards/desserts/lollipop.jpg";
import imgChocolate from "@/assets/cards/desserts/chocolate.jpg";

export const DESSERTS: CardData[] = [
  { id: "cupcake", emoji: "🧁", label: "קאפקייק", image: imgCupcake },
  { id: "donut", emoji: "🍩", label: "דונאט", image: imgDonut },
  { id: "icecream", emoji: "🍦", label: "גלידה", image: imgIcecream },
  { id: "cake", emoji: "🎂", label: "עוגה", image: imgCake },
  { id: "macarons", emoji: "🍪", label: "מקרונים", image: imgMacarons },
  { id: "cookies", emoji: "🍪", label: "עוגיות", image: imgCookies },
  { id: "lollipop", emoji: "🍭", label: "סוכרייה", image: imgLollipop },
  { id: "chocolate", emoji: "🍫", label: "שוקולד", image: imgChocolate },
];

// ── Dinosaurs (image-based) ──
import imgTrex from "@/assets/cards/dinos/trex.jpg";
import imgTriceratops from "@/assets/cards/dinos/triceratops.jpg";
import imgBrachiosaurus from "@/assets/cards/dinos/brachiosaurus.jpg";
import imgStegosaurus from "@/assets/cards/dinos/stegosaurus.jpg";
import imgVelociraptor from "@/assets/cards/dinos/velociraptor.jpg";
import imgPterodactyl from "@/assets/cards/dinos/pterodactyl.jpg";
import imgSpinosaurus from "@/assets/cards/dinos/spinosaurus.jpg";
import imgAnkylosaurus from "@/assets/cards/dinos/ankylosaurus.jpg";

export const DINOS: CardData[] = [
  { id: "trex", emoji: "🦖", label: "טירנוזאורוס", image: imgTrex },
  { id: "triceratops", emoji: "🦕", label: "טריצרטופס", image: imgTriceratops },
  { id: "brachiosaurus", emoji: "🦕", label: "ברכיוזאורוס", image: imgBrachiosaurus },
  { id: "stegosaurus", emoji: "🦕", label: "סטגוזאורוס", image: imgStegosaurus },
  { id: "velociraptor", emoji: "🦖", label: "ולוצירפטור", image: imgVelociraptor },
  { id: "pterodactyl", emoji: "🦅", label: "טרודקטיל", image: imgPterodactyl },
  { id: "spinosaurus", emoji: "🦖", label: "ספינוזאורוס", image: imgSpinosaurus },
  { id: "ankylosaurus", emoji: "🦕", label: "אנקילוזאורוס", image: imgAnkylosaurus },
];

// ── Farm Animals (image-based) ──
import imgHorse from "@/assets/cards/farm/horse.jpg";
import imgElephant from "@/assets/cards/farm/elephant.jpg";
import imgMonkey from "@/assets/cards/farm/monkey.jpg";
import imgCow from "@/assets/cards/farm/cow.jpg";
import imgSheep from "@/assets/cards/farm/sheep.jpg";
import imgGoat from "@/assets/cards/farm/goat.jpg";
import imgDonkey from "@/assets/cards/farm/donkey.jpg";
import imgRooster from "@/assets/cards/farm/rooster.jpg";

export const FARM_ANIMALS: CardData[] = [
  { id: "horse", emoji: "🐴", label: "סוס", image: imgHorse },
  { id: "elephant", emoji: "🐘", label: "פיל", image: imgElephant },
  { id: "monkey", emoji: "🐒", label: "קוף", image: imgMonkey },
  { id: "cow", emoji: "🐄", label: "פרה", image: imgCow },
  { id: "sheep", emoji: "🐑", label: "כבשה", image: imgSheep },
  { id: "goat", emoji: "🐐", label: "עז", image: imgGoat },
  { id: "donkey", emoji: "🫏", label: "חמור", image: imgDonkey },
  { id: "rooster", emoji: "🐓", label: "תרנגול", image: imgRooster },
];

// ── Realistic Vehicles (image-based) ──
import imgCar from "@/assets/cards/vehicles/car.jpg";
import imgTractor from "@/assets/cards/vehicles/tractor.jpg";
import imgMotorcycle from "@/assets/cards/vehicles/motorcycle.jpg";
import imgShip from "@/assets/cards/vehicles/ship.jpg";
import imgFiretruck from "@/assets/cards/vehicles/firetruck.jpg";
import imgAirplane from "@/assets/cards/vehicles/airplane.jpg";
import imgBus from "@/assets/cards/vehicles/bus.jpg";
import imgTrain from "@/assets/cards/vehicles/train.jpg";

export const REAL_VEHICLES: CardData[] = [
  { id: "car", emoji: "🚗", label: "מכונית", image: imgCar },
  { id: "tractor", emoji: "🚜", label: "טרקטור", image: imgTractor },
  { id: "motorcycle", emoji: "🏍️", label: "אופנוע", image: imgMotorcycle },
  { id: "ship", emoji: "🚢", label: "אוניה", image: imgShip },
  { id: "firetruck", emoji: "🚒", label: "כבאית", image: imgFiretruck },
  { id: "airplane", emoji: "✈️", label: "מטוס", image: imgAirplane },
  { id: "bus", emoji: "🚌", label: "אוטובוס", image: imgBus },
  { id: "train", emoji: "🚂", label: "רכבת", image: imgTrain },
];

// ── Horses (image-based) ──
import imgWhiteHorse from "@/assets/cards/horses/white-horse.png";
import imgBrownHorse from "@/assets/cards/horses/brown-horse.png";
import imgBlackHorse from "@/assets/cards/horses/black-horse.png";
import imgPinkHorse from "@/assets/cards/horses/pink-horse.png";
import imgGoldenHorse from "@/assets/cards/horses/golden-horse.png";
import imgSpottedHorse from "@/assets/cards/horses/spotted-horse.png";
import imgGrayHorse from "@/assets/cards/horses/gray-horse.png";
import imgPony from "@/assets/cards/horses/pony.png";

export const HORSES: CardData[] = [
  { id: "horse-white", emoji: "🐴", label: "סוס לבן", image: imgWhiteHorse },
  { id: "horse-brown", emoji: "🐴", label: "סוס חום", image: imgBrownHorse },
  { id: "horse-black", emoji: "🐴", label: "סוס שחור", image: imgBlackHorse },
  { id: "horse-pink", emoji: "🐴", label: "סוס ורוד", image: imgPinkHorse },
  { id: "horse-golden", emoji: "🐴", label: "סוס זהוב", image: imgGoldenHorse },
  { id: "horse-spotted", emoji: "🐴", label: "סוס מנומר", image: imgSpottedHorse },
  { id: "horse-gray", emoji: "🐴", label: "סוס אפור", image: imgGrayHorse },
  { id: "horse-pony", emoji: "🐴", label: "פוני", image: imgPony },
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

// ── Shapes ──
export const SHAPES: CardData[] = [
  { id: "shape-triangle", emoji: "🔺", label: "משולש" },
  { id: "shape-square", emoji: "🟧", label: "ריבוע" },
  { id: "shape-circle", emoji: "🔵", label: "עיגול" },
  { id: "shape-diamond", emoji: "🔷", label: "מעוין" },
  { id: "shape-star", emoji: "⭐", label: "כוכב" },
  { id: "shape-heart", emoji: "❤️", label: "לב" },
  { id: "shape-hexagon", emoji: "⬡", label: "משושה" },
  { id: "shape-pentagon", emoji: "⬠", label: "מחומש" },
  { id: "shape-oval", emoji: "🥚", label: "אליפסה" },
  { id: "shape-crescent", emoji: "🌙", label: "סהר" },
  { id: "shape-cross", emoji: "✚", label: "פלוס" },
  { id: "shape-arrow", emoji: "➤", label: "חץ" },
  { id: "shape-red-circle", emoji: "🔴", label: "עיגול אדום" },
  { id: "shape-green-square", emoji: "🟩", label: "ריבוע ירוק" },
  { id: "shape-purple-diamond", emoji: "🟣", label: "עיגול סגול" },
  { id: "shape-yellow-triangle", emoji: "🔶", label: "מעוין כתום" },
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

// ── ABC Letters ──
export const ABC_LETTERS: CardData[] = [
  { id: "abc-A", emoji: "A", label: "Apple" },
  { id: "abc-B", emoji: "B", label: "Ball" },
  { id: "abc-C", emoji: "C", label: "Cat" },
  { id: "abc-D", emoji: "D", label: "Dog" },
  { id: "abc-E", emoji: "E", label: "Elephant" },
  { id: "abc-F", emoji: "F", label: "Fish" },
  { id: "abc-G", emoji: "G", label: "Giraffe" },
  { id: "abc-H", emoji: "H", label: "Horse" },
  { id: "abc-I", emoji: "I", label: "Ice cream" },
  { id: "abc-J", emoji: "J", label: "Jellyfish" },
  { id: "abc-K", emoji: "K", label: "Kite" },
  { id: "abc-L", emoji: "L", label: "Lion" },
  { id: "abc-M", emoji: "M", label: "Moon" },
  { id: "abc-N", emoji: "N", label: "Nest" },
  { id: "abc-O", emoji: "O", label: "Octopus" },
  { id: "abc-P", emoji: "P", label: "Penguin" },
];

// ── Fire Station (Fireman Sam theme) — images via Wikimedia Commons ──
export const FIRE_STATION: CardData[] = [
  { id: "fs-sam",     emoji: "👨‍🚒", label: "סמי הכבאי",   image: "/cards/firesam/sam.png" },
  { id: "fs-elvis",   emoji: "🎸",  label: "אלביס",         image: "/cards/firesam/elvis.png" },
  { id: "fs-penny",   emoji: "👩‍🚒", label: "פני",           image: "/cards/firesam/penny.png" },
  { id: "fs-steele",  emoji: "🎖️",  label: "סטיל",          image: "/cards/firesam/steele.png" },
  { id: "fs-norman",  emoji: "😈",  label: "נורמן",         image: "/cards/firesam/norman.png" },
  { id: "fs-dilys",   emoji: "👩",  label: "דיליס",         image: "/cards/firesam/dilys.png" },
  { id: "fs-trevor",  emoji: "🚌",  label: "טרבור",         image: "/cards/firesam/trevor.png" },
  { id: "fs-jupiter", emoji: "🚒",  label: "יופיטר",        image: "/cards/firesam/jupiter.jpg" },
  { id: "fs-wallaby", emoji: "🚁",  label: "וולבי",         image: "/cards/firesam/wallaby.png" },
  { id: "fs-tom",     emoji: "🧗",  label: "טום",           image: "/cards/firesam/tom.png" },
  { id: "fs-bella",   emoji: "🍕",  label: "בלה",           image: "/cards/firesam/bella.png" },
  { id: "fs-mike",    emoji: "🔧",  label: "מייק",          image: "/cards/firesam/mike.png" },
  { id: "fs-charlie", emoji: "🎣",  label: "צ'רלי",         image: "/cards/firesam/charlie.png" },
  { id: "fs-bronwyn", emoji: "👩‍🍳", label: "ברונווין",      image: "/cards/firesam/bronwyn.png" },
  { id: "fs-twins",   emoji: "👧",  label: "שרה וג'יימס",  image: "/cards/firesam/twins.png" },
  { id: "fs-mandy",   emoji: "🏃",  label: "מנדי",          image: "/cards/firesam/mandy.png" },
];

// ── Pokémon (free official artwork via PokeAPI CDN — no API key required) ──
export const POKEMON: CardData[] = [
  { id: "pkm-1",   emoji: "🌿", label: "בולבסאור",  image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png" },
  { id: "pkm-4",   emoji: "🔥", label: "צ'רמנדר",   image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png" },
  { id: "pkm-7",   emoji: "💧", label: "סקוורטל",   image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png" },
  { id: "pkm-25",  emoji: "⚡", label: "פיקאצ'ו",   image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" },
  { id: "pkm-39",  emoji: "🎤", label: "ג'יגלפאף",  image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png" },
  { id: "pkm-52",  emoji: "😸", label: "מיאות",     image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/52.png" },
  { id: "pkm-54",  emoji: "🦆", label: "פסידאק",    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/54.png" },
  { id: "pkm-79",  emoji: "😴", label: "סלופוק",    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/79.png" },
  { id: "pkm-94",  emoji: "👻", label: "גנגר",      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png" },
  { id: "pkm-113", emoji: "💖", label: "צ'נסי",     image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/113.png" },
  { id: "pkm-131", emoji: "🌊", label: "לפראס",     image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/131.png" },
  { id: "pkm-133", emoji: "⭐", label: "איבי",      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png" },
  { id: "pkm-143", emoji: "😴", label: "סנולקס",    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png" },
  { id: "pkm-147", emoji: "🐉", label: "דרטיני",    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/147.png" },
  { id: "pkm-175", emoji: "💕", label: "טוג'פי",    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/175.png" },
  { id: "pkm-196", emoji: "🌞", label: "אספיאון",   image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/196.png" },
];

// ── Jungle Animals ──
export const JUNGLE_ANIMALS: CardData[] = [
  { id: "jg-lion",     emoji: "🦁", label: "אריה" },
  { id: "jg-tiger",    emoji: "🐯", label: "נמר" },
  { id: "jg-elephant", emoji: "🐘", label: "פיל" },
  { id: "jg-giraffe",  emoji: "🦒", label: "ג'ירפה" },
  { id: "jg-zebra",    emoji: "🦓", label: "זברה" },
  { id: "jg-hippo",    emoji: "🦛", label: "היפופוטם" },
  { id: "jg-monkey",   emoji: "🐒", label: "קוף" },
  { id: "jg-parrot",   emoji: "🦜", label: "תוכי" },
  { id: "jg-snake",    emoji: "🐍", label: "נחש" },
  { id: "jg-croc",     emoji: "🐊", label: "תנין" },
  { id: "jg-gorilla",  emoji: "🦍", label: "גורילה" },
  { id: "jg-cheetah",  emoji: "🐆", label: "צ'יטה" },
  { id: "jg-flamingo", emoji: "🦩", label: "פלמינגו" },
  { id: "jg-rhino",    emoji: "🦏", label: "קרנף" },
  { id: "jg-panda",    emoji: "🐼", label: "פנדה" },
  { id: "jg-kangaroo", emoji: "🦘", label: "קנגורו" },
];

// ── Bugs & Insects ──
export const BUGS: CardData[] = [
  { id: "bug-butterfly",   emoji: "🦋", label: "פרפר" },
  { id: "bug-bee",         emoji: "🐝", label: "דבורה" },
  { id: "bug-ladybug",     emoji: "🐞", label: "פרת משה רבנו" },
  { id: "bug-ant",         emoji: "🐜", label: "נמלה" },
  { id: "bug-spider",      emoji: "🕷️", label: "עכביש" },
  { id: "bug-scorpion",    emoji: "🦂", label: "עקרב" },
  { id: "bug-mosquito",    emoji: "🦟", label: "יתוש" },
  { id: "bug-worm",        emoji: "🪱", label: "תולעת" },
  { id: "bug-beetle",      emoji: "🪲", label: "חיפושית" },
  { id: "bug-roach",       emoji: "🪳", label: "מקק" },
  { id: "bug-fly",         emoji: "🪰", label: "זבוב" },
  { id: "bug-snail",       emoji: "🐌", label: "חילזון" },
  { id: "bug-caterpillar", emoji: "🐛", label: "זחל" },
  { id: "bug-cricket",     emoji: "🦗", label: "צרצר" },
  { id: "bug-microbe",     emoji: "🦠", label: "חיידק" },
  { id: "bug-crab",        emoji: "🦀", label: "סרטן" },
];

// ── Jewish Holidays ──
export const JEWISH_HOLIDAYS: CardData[] = [
  { id: "hol-rosh",         emoji: "🍎", label: "ראש השנה" },
  { id: "hol-yomkippur",    emoji: "🤍", label: "יום כיפור" },
  { id: "hol-sukkot",       emoji: "🌿", label: "סוכות" },
  { id: "hol-simchat",      emoji: "📜", label: "שמחת תורה" },
  { id: "hol-hanukkah",     emoji: "🕎", label: "חנוכה" },
  { id: "hol-purim",        emoji: "🎭", label: "פורים" },
  { id: "hol-pesach",       emoji: "🌊", label: "פסח" },
  { id: "hol-shavuot",      emoji: "🌾", label: "שבועות" },
  { id: "hol-shabbat",      emoji: "🕯️", label: "שבת" },
  { id: "hol-tubishvat",    emoji: "🌳", label: "ט״ו בשבט" },
  { id: "hol-independence", emoji: "🇮🇱", label: "יום העצמאות" },
  { id: "hol-shofar",       emoji: "📯", label: "שופר" },
  { id: "hol-honey",        emoji: "🍯", label: "דבש" },
  { id: "hol-lagbaomer",    emoji: "🔥", label: "ל״ג בעומר" },
  { id: "hol-jerusalem",    emoji: "🏛️", label: "יום ירושלים" },
  { id: "hol-memorial",     emoji: "🕊️", label: "יום הזיכרון" },
];

// ── Real Flowers — images via Wikimedia Commons ──
export const REAL_FLOWERS: CardData[] = [
  { id: "fl-rose",      emoji: "🌹", label: "ורד",      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Rosa_rubiginosa.jpg" },
  { id: "fl-sunflower", emoji: "🌻", label: "חמנייה",   image: "https://commons.wikimedia.org/wiki/Special:FilePath/Helianthus_annuus.jpg" },
  { id: "fl-tulip",     emoji: "🌷", label: "צבעוני",   image: "https://commons.wikimedia.org/wiki/Special:FilePath/Tulipa_gesneriana.jpg" },
  { id: "fl-daisy",     emoji: "🌼", label: "חינניות",  image: "https://commons.wikimedia.org/wiki/Special:FilePath/Bellis_perennis_white_(aka).jpg" },
  { id: "fl-orchid",    emoji: "🌸", label: "סחלב",     image: "https://commons.wikimedia.org/wiki/Special:FilePath/Phalaenopsis_hybrid.jpg" },
  { id: "fl-lavender",  emoji: "💜", label: "לבנדר",    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lavandula_stoechas.jpg" },
  { id: "fl-lotus",     emoji: "🪷", label: "לוטוס",    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Nelumbo_nucifera_Gaertn_5.jpg" },
  { id: "fl-poppy",     emoji: "🌺", label: "כלנית",    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Papaver_rhoeas_1.jpg" },
  { id: "fl-lily",      emoji: "🌼", label: "שושן",     image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lilium_candidum.jpg" },
  { id: "fl-iris",      emoji: "💐", label: "אירוס",    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Iris_germanica.jpg" },
  { id: "fl-magnolia",  emoji: "🌸", label: "מגנוליה",  image: "https://commons.wikimedia.org/wiki/Special:FilePath/Magnolia_stellata.jpg" },
  { id: "fl-hyacinth",  emoji: "💐", label: "יקינתון",  image: "https://commons.wikimedia.org/wiki/Special:FilePath/Hyacinthus_orientalis.jpg" },
  { id: "fl-daffodil",  emoji: "🌼", label: "נרקיס",    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Narcissus_pseudonarcissus.jpg" },
  { id: "fl-dahlia",    emoji: "🌺", label: "דליה",     image: "https://commons.wikimedia.org/wiki/Special:FilePath/Dahlia_pinnata.jpg" },
  { id: "fl-marigold",  emoji: "🌼", label: "ציפורן",   image: "https://commons.wikimedia.org/wiki/Special:FilePath/Tagetes_patula.jpg" },
  { id: "fl-hydrangea", emoji: "💐", label: "הורטנזיה", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Hydrangea_macrophylla.jpg" },
];

// ── Real Birds — images via Wikimedia Commons ──
export const REAL_BIRDS: CardData[] = [
  { id: "bird-eagle",       emoji: "🦅", label: "נשר",      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Haliaeetus_leucocephalus.jpg" },
  { id: "bird-owl",         emoji: "🦉", label: "ינשוף",     image: "https://commons.wikimedia.org/wiki/Special:FilePath/Strix_aluco.jpg" },
  { id: "bird-parrot",      emoji: "🦜", label: "תוכי",      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Rainbow_lorikeet.jpg" },
  { id: "bird-penguin",     emoji: "🐧", label: "פינגווין",  image: "https://commons.wikimedia.org/wiki/Special:FilePath/Emperor_penguin.jpg" },
  { id: "bird-flamingo",    emoji: "🦩", label: "פלמינגו",   image: "https://commons.wikimedia.org/wiki/Special:FilePath/Phoenicopterus_roseus_Camargue_23.jpg" },
  { id: "bird-toucan",      emoji: "🐦", label: "טוקן",      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ramphastos_toco.jpg" },
  { id: "bird-peacock",     emoji: "🦚", label: "טווס",      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pavo_cristatus_Luc_Viatour.jpg" },
  { id: "bird-hummingbird", emoji: "🐦", label: "יונת דבש", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Rufous_hummingbird.jpg" },
  { id: "bird-robin",       emoji: "🐦", label: "רובין",     image: "https://commons.wikimedia.org/wiki/Special:FilePath/Erithacus_rubecula_with_cocked_head.jpg" },
  { id: "bird-swan",        emoji: "🦢", label: "ברבור",     image: "https://commons.wikimedia.org/wiki/Special:FilePath/Cygnus_olor.jpg" },
  { id: "bird-hawk",        emoji: "🦅", label: "נץ",        image: "https://commons.wikimedia.org/wiki/Special:FilePath/Buteo_buteo.jpg" },
  { id: "bird-pigeon",      emoji: "🕊️", label: "יונה",     image: "https://commons.wikimedia.org/wiki/Special:FilePath/Rock_dove.jpg" },
  { id: "bird-sparrow",     emoji: "🐦", label: "דרור",      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Passer_domesticus_male.jpg" },
  { id: "bird-crow",        emoji: "🐦", label: "עורב",      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Corvus_cornix.jpg" },
  { id: "bird-woodpecker",  emoji: "🐦", label: "נקר",       image: "https://commons.wikimedia.org/wiki/Special:FilePath/Dendrocopos_major.jpg" },
  { id: "bird-pelican",     emoji: "🐦", label: "פליקן",     image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pelecanus_onocrotalus.jpg" },
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
    {
      type: "real-animals", emoji: "📸", label: "חיות אמיתיות",
      color: "from-amber-400 to-orange-500",
      cards: REAL_ANIMALS,
    },
    {
      type: "desserts", emoji: "🍰", label: "קינוחים",
      color: "from-pink-400 to-rose-500",
      cards: DESSERTS,
    },
    {
      type: "dinos", emoji: "🦖", label: "דינוזאורים",
      color: "from-green-500 to-emerald-600",
      cards: DINOS,
    },
    {
      type: "farm", emoji: "🐴", label: "חיות חווה",
      color: "from-yellow-500 to-amber-600",
      cards: FARM_ANIMALS,
    },
    {
      type: "real-vehicles", emoji: "🚗", label: "כלי תחבורה",
      color: "from-sky-500 to-indigo-600",
      cards: REAL_VEHICLES,
    },
    {
      type: "horses", emoji: "🐴", label: "סוסים",
      color: "from-rose-400 to-pink-500",
      cards: HORSES,
    },
    {
      type: "shapes", emoji: "🔷", label: "צורות וצבעים",
      color: "from-violet-500 to-fuchsia-500",
      cards: SHAPES,
    },
    {
      type: "pokemon", emoji: "⚡", label: "פוקימון",
      color: "from-yellow-400 to-red-500",
      cards: POKEMON,
    },
    {
      type: "firesam", emoji: "🚒", label: "כבאים",
      color: "from-red-500 to-orange-500",
      cards: FIRE_STATION,
    },
    {
      type: "jungle", emoji: "🦁", label: "ג'ונגל",
      color: "from-green-500 to-lime-600",
      cards: JUNGLE_ANIMALS,
    },
    {
      type: "bugs", emoji: "🦋", label: "חרקים",
      color: "from-amber-500 to-yellow-600",
      cards: BUGS,
    },
    {
      type: "holidays", emoji: "🕎", label: "חגים",
      color: "from-blue-500 to-indigo-600",
      cards: JEWISH_HOLIDAYS,
    },
    {
      type: "flowers", emoji: "🌸", label: "פרחים",
      color: "from-pink-400 to-rose-500",
      cards: REAL_FLOWERS,
    },
    {
      type: "birds", emoji: "🦅", label: "ציפורים",
      color: "from-sky-400 to-cyan-500",
      cards: REAL_BIRDS,
    },
    {
      type: "abc", emoji: "🔤", label: "ABC אותיות",
      color: "from-cyan-400 to-violet-500",
      cards: ABC_LETTERS,
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
  const safePairCount = Math.min(cards.length, Math.max(0, Math.floor(pairCount)));
  if (safePairCount === 0) {
    return [];
  }

  // Shuffle source cards first so each game gets different ones
  const shuffledSource = shuffleArray([...cards]);
  const selected = shuffledSource.slice(0, safePairCount);
  const pairs = selected.flatMap((card) => [
    { ...card, uniqueId: `${card.id}-a`, isFlipped: false, isMatched: false },
    { ...card, uniqueId: `${card.id}-b`, isFlipped: false, isMatched: false },
  ]);
  return shuffleArray(pairs);
}