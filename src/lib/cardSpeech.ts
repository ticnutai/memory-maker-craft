// Multilingual text-to-speech for card names

export type SpeechLang = "he" | "en" | "de";

const CARD_NAMES: Record<SpeechLang, Record<string, string>> = {
  he: {
    // Girl animals
    bunny: "ארנב", butterfly: "פרפר", cat: "חתול", unicorn: "חד קרן",
    dolphin: "דולפין", flamingo: "פלמינגו", panda: "פנדה", owl: "ינשוף",
    koala: "קואלה", penguin: "פינגווין", deer: "אייל", swan: "ברבור",
    hedgehog: "קיפוד", parrot: "תוכי", ladybug: "חיפושית", snail: "חילזון",
    // Boy animals
    lion: "אריה", dinosaur: "דינוזאור", shark: "כריש", bear: "דוב",
    dragon: "דרקון", eagle: "נשר", wolf: "זאב", octopus: "תמנון",
    gorilla: "גורילה", crocodile: "תנין", whale: "לווייתן", scorpion: "עקרב",
    bat: "עטלף", rhino: "קרנף", trex: "טירנוזאורוס", snake: "נחש",
    // Fruits
    apple: "תפוח", banana: "בננה", grapes: "ענבים", strawberry: "תות",
    watermelon: "אבטיח", cherry: "דובדבן", peach: "אפרסק", pineapple: "אננס",
    mango: "מנגו", kiwi: "קיווי", lemon: "לימון", coconut: "קוקוס",
    avocado: "אבוקדו", tomato: "עגבנייה", corn: "תירס", carrot: "גזר",
    // Vehicles
    car: "מכונית", truck: "משאית", bus: "אוטובוס", train: "רכבת",
    airplane: "מטוס", rocket: "טיל", helicopter: "מסוק", ship: "ספינה",
    motorcycle: "אופנוע", bicycle: "אופניים", tractor: "טרקטור", ambulance: "אמבולנס",
    firetruck: "כבאית", police: "ניידת", taxi: "מונית", sailboat: "מפרשית",
    // Farm animals
    horse: "סוס", elephant: "פיל", monkey: "קוף", cow: "פרה",
    sheep: "כבשה", goat: "עז", donkey: "חמור", rooster: "תרנגול",
    // Dinos
    triceratops: "טריצרטופס", brachiosaurus: "ברכיוזאורוס", stegosaurus: "סטגוזאורוס",
    velociraptor: "ולוצירפטור", pterodactyl: "טרודקטיל", spinosaurus: "ספינוזאורוס",
    ankylosaurus: "אנקילוזאורוס",
    // Desserts
    cupcake: "קאפקייק", donut: "דונאט", icecream: "גלידה", cake: "עוגה",
    macarons: "מקרונים", cookies: "עוגיות", lollipop: "סוכרייה", chocolate: "שוקולד",
    // Hebrew letters
    alef: "אָלֶף", bet: "בֵּית", gimel: "גִּימֶל", dalet: "דָּלֶת",
    he: "הֵא", vav: "וָו", zayin: "זַיִן", chet: "חֵית",
    tet: "טֵית", yod: "יוֹד", kaf: "כַּף", lamed: "לָמֶד",
    mem: "מֵם", nun: "נוּן", samekh: "סָמֶך", ayin: "עַיִן",
    // Shapes
    "shape-triangle": "משולש", "shape-square": "ריבוע", "shape-circle": "עיגול",
    "shape-diamond": "מעוין", "shape-star": "כוכב", "shape-heart": "לב",
    "shape-hexagon": "משושה", "shape-pentagon": "מחומש", "shape-oval": "אליפסה",
    "shape-crescent": "סהר", "shape-cross": "פלוס", "shape-arrow": "חץ",
    "shape-red-circle": "עיגול אדום", "shape-green-square": "ריבוע ירוק",
    "shape-purple-diamond": "עיגול סגול", "shape-yellow-triangle": "מעוין כתום",
    // Horses
    "horse-white": "סוס לבן", "horse-brown": "סוס חום", "horse-black": "סוס שחור",
    "horse-pink": "סוס ורוד", "horse-golden": "סוס זהוב", "horse-spotted": "סוס מנומר",
    "horse-gray": "סוס אפור", "horse-pony": "פוני",
  },
  en: {
    bunny: "bunny", butterfly: "butterfly", cat: "cat", unicorn: "unicorn",
    dolphin: "dolphin", flamingo: "flamingo", panda: "panda", owl: "owl",
    koala: "koala", penguin: "penguin", deer: "deer", swan: "swan",
    hedgehog: "hedgehog", parrot: "parrot", ladybug: "ladybug", snail: "snail",
    lion: "lion", dinosaur: "dinosaur", shark: "shark", bear: "bear",
    dragon: "dragon", eagle: "eagle", wolf: "wolf", octopus: "octopus",
    gorilla: "gorilla", crocodile: "crocodile", whale: "whale", scorpion: "scorpion",
    bat: "bat", rhino: "rhino", trex: "tyrannosaurus", snake: "snake",
    apple: "apple", banana: "banana", grapes: "grapes", strawberry: "strawberry",
    watermelon: "watermelon", cherry: "cherry", peach: "peach", pineapple: "pineapple",
    mango: "mango", kiwi: "kiwi", lemon: "lemon", coconut: "coconut",
    avocado: "avocado", tomato: "tomato", corn: "corn", carrot: "carrot",
    car: "car", truck: "truck", bus: "bus", train: "train",
    airplane: "airplane", rocket: "rocket", helicopter: "helicopter", ship: "ship",
    motorcycle: "motorcycle", bicycle: "bicycle", tractor: "tractor", ambulance: "ambulance",
    firetruck: "fire truck", police: "police car", taxi: "taxi", sailboat: "sailboat",
    horse: "horse", elephant: "elephant", monkey: "monkey", cow: "cow",
    sheep: "sheep", goat: "goat", donkey: "donkey", rooster: "rooster",
    triceratops: "triceratops", brachiosaurus: "brachiosaurus", stegosaurus: "stegosaurus",
    velociraptor: "velociraptor", pterodactyl: "pterodactyl", spinosaurus: "spinosaurus",
    ankylosaurus: "ankylosaurus",
    cupcake: "cupcake", donut: "donut", icecream: "ice cream", cake: "cake",
    macarons: "macarons", cookies: "cookies", lollipop: "lollipop", chocolate: "chocolate",
    alef: "alef", bet: "bet", gimel: "gimel", dalet: "dalet",
    he: "he", vav: "vav", zayin: "zayin", chet: "chet",
    tet: "tet", yod: "yod", kaf: "kaf", lamed: "lamed",
    mem: "mem", nun: "nun", samekh: "samekh", ayin: "ayin",
    "shape-triangle": "triangle", "shape-square": "square", "shape-circle": "circle",
    "shape-diamond": "diamond", "shape-star": "star", "shape-heart": "heart",
    "shape-hexagon": "hexagon", "shape-pentagon": "pentagon", "shape-oval": "oval",
    "shape-crescent": "crescent", "shape-cross": "plus", "shape-arrow": "arrow",
    "shape-red-circle": "red circle", "shape-green-square": "green square",
    "shape-purple-diamond": "purple diamond", "shape-yellow-triangle": "yellow triangle",
    "horse-white": "white horse", "horse-brown": "brown horse", "horse-black": "black horse",
    "horse-pink": "pink horse", "horse-golden": "golden horse", "horse-spotted": "spotted horse",
    "horse-gray": "gray horse", "horse-pony": "pony",
  },
  de: {
    bunny: "Hase", butterfly: "Schmetterling", cat: "Katze", unicorn: "Einhorn",
    dolphin: "Delfin", flamingo: "Flamingo", panda: "Panda", owl: "Eule",
    koala: "Koala", penguin: "Pinguin", deer: "Hirsch", swan: "Schwan",
    hedgehog: "Igel", parrot: "Papagei", ladybug: "Marienkäfer", snail: "Schnecke",
    lion: "Löwe", dinosaur: "Dinosaurier", shark: "Hai", bear: "Bär",
    dragon: "Drache", eagle: "Adler", wolf: "Wolf", octopus: "Oktopus",
    gorilla: "Gorilla", crocodile: "Krokodil", whale: "Wal", scorpion: "Skorpion",
    bat: "Fledermaus", rhino: "Nashorn", trex: "Tyrannosaurus", snake: "Schlange",
    apple: "Apfel", banana: "Banane", grapes: "Trauben", strawberry: "Erdbeere",
    watermelon: "Wassermelone", cherry: "Kirsche", peach: "Pfirsich", pineapple: "Ananas",
    mango: "Mango", kiwi: "Kiwi", lemon: "Zitrone", coconut: "Kokosnuss",
    avocado: "Avocado", tomato: "Tomate", corn: "Mais", carrot: "Karotte",
    car: "Auto", truck: "Lastwagen", bus: "Bus", train: "Zug",
    airplane: "Flugzeug", rocket: "Rakete", helicopter: "Hubschrauber", ship: "Schiff",
    motorcycle: "Motorrad", bicycle: "Fahrrad", tractor: "Traktor", ambulance: "Krankenwagen",
    firetruck: "Feuerwehr", police: "Polizei", taxi: "Taxi", sailboat: "Segelboot",
    horse: "Pferd", elephant: "Elefant", monkey: "Affe", cow: "Kuh",
    sheep: "Schaf", goat: "Ziege", donkey: "Esel", rooster: "Hahn",
    triceratops: "Triceratops", brachiosaurus: "Brachiosaurus", stegosaurus: "Stegosaurus",
    velociraptor: "Velociraptor", pterodactyl: "Pterodaktylus", spinosaurus: "Spinosaurus",
    ankylosaurus: "Ankylosaurus",
    cupcake: "Cupcake", donut: "Donut", icecream: "Eis", cake: "Kuchen",
    macarons: "Macarons", cookies: "Kekse", lollipop: "Lutscher", chocolate: "Schokolade",
    alef: "Alef", bet: "Bet", gimel: "Gimel", dalet: "Dalet",
    he: "He", vav: "Vav", zayin: "Zayin", chet: "Chet",
    tet: "Tet", yod: "Jod", kaf: "Kaf", lamed: "Lamed",
    mem: "Mem", nun: "Nun", samekh: "Samech", ayin: "Ajin",
    "shape-triangle": "Dreieck", "shape-square": "Quadrat", "shape-circle": "Kreis",
    "shape-diamond": "Raute", "shape-star": "Stern", "shape-heart": "Herz",
    "shape-hexagon": "Sechseck", "shape-pentagon": "Fünfeck", "shape-oval": "Oval",
    "shape-crescent": "Halbmond", "shape-cross": "Plus", "shape-arrow": "Pfeil",
    "shape-red-circle": "roter Kreis", "shape-green-square": "grünes Quadrat",
    "shape-purple-diamond": "lila Raute", "shape-yellow-triangle": "gelbes Dreieck",
    "horse-white": "weißes Pferd", "horse-brown": "braunes Pferd", "horse-black": "schwarzes Pferd",
    "horse-pink": "rosa Pferd", "horse-golden": "goldenes Pferd", "horse-spotted": "geflecktes Pferd",
    "horse-gray": "graues Pferd", "horse-pony": "Pony",
  },
};

// Build aliases for "real-" prefixed IDs for all languages
for (const lang of Object.keys(CARD_NAMES) as SpeechLang[]) {
  const base = { ...CARD_NAMES[lang] };
  Object.keys(base).forEach((key) => {
    CARD_NAMES[lang][`real-${key}`] = base[key];
  });
}

const LANG_CODES: Record<SpeechLang, string> = { he: "he-IL", en: "en-US", de: "de-DE" };

// Voice encouragement phrases per language
export const VOICE_EFFECTS: Record<SpeechLang, Record<string, string[]>> = {
  he: {
    match: ["כל הכבוד!", "יופי!", "מצוין!", "נהדר!", "וואו!"],
    win: ["ניצחת! מדהים!", "אלוף!", "שיחקת מעולה!", "כוכב!"],
    mismatch: ["נסה שוב!", "לא נורא!", "קדימה!"],
  },
  en: {
    match: ["Great job!", "Awesome!", "Excellent!", "Wonderful!", "Wow!"],
    win: ["You won! Amazing!", "Champion!", "You played great!", "Star!"],
    mismatch: ["Try again!", "No worries!", "Keep going!"],
  },
  de: {
    match: ["Toll gemacht!", "Super!", "Ausgezeichnet!", "Wunderbar!", "Wow!"],
    win: ["Du hast gewonnen! Toll!", "Champion!", "Gut gespielt!", "Stern!"],
    mismatch: ["Versuch nochmal!", "Kein Problem!", "Weiter so!"],
  },
};

let lastSpoke = 0;
let useElevenLabs = true;
let currentLang: SpeechLang = "he";

export function setSpeechLang(lang: SpeechLang) {
  currentLang = lang;
}

export function speakCardName(cardId: string, rate: number = 0.9, lang?: SpeechLang) {
  const useLang = lang || currentLang;
  const name = CARD_NAMES[useLang]?.[cardId];
  if (!name) return;

  const now = Date.now();
  if (now - lastSpoke < 400) return;
  lastSpoke = now;

  if (useElevenLabs) {
    import("@/lib/elevenLabs").then(({ elevenLabsSpeak }) => {
      elevenLabsSpeak(name).then((success) => {
        if (!success) speakWithBrowser(name, rate, useLang);
      });
    }).catch(() => speakWithBrowser(name, rate, useLang));
    return;
  }

  speakWithBrowser(name, rate, useLang);
}

function speakWithBrowser(name: string, rate: number, lang: SpeechLang = "he") {
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(name);
  utterance.lang = LANG_CODES[lang];
  utterance.rate = rate;
  utterance.pitch = 1.2;
  utterance.volume = 0.8;

  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang === "he" ? "he" : lang === "de" ? "de" : "en";
  const altPrefix = lang === "he" ? "iw" : undefined;
  const voice = voices.find(v => v.lang.startsWith(langPrefix)) || (altPrefix ? voices.find(v => v.lang.startsWith(altPrefix)) : undefined);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export function setElevenLabsTTS(enabled: boolean) {
  useElevenLabs = enabled;
}

export function getCardNameHe(cardId: string): string | undefined {
  return CARD_NAMES.he[cardId];
}

export function getCardName(cardId: string, lang?: SpeechLang): string | undefined {
  return CARD_NAMES[lang || currentLang]?.[cardId];
}
