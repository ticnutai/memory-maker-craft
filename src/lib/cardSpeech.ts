// Hebrew text-to-speech for card names using Web Speech API

const CARD_NAMES_HE: Record<string, string> = {
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
};

// Build aliases for "real-" prefixed IDs
const BASE_NAMES = { ...CARD_NAMES_HE };
Object.keys(BASE_NAMES).forEach((key) => {
  CARD_NAMES_HE[`real-${key}`] = BASE_NAMES[key];
});

let lastSpoke = 0;

export function speakCardName(cardId: string, rate: number = 0.9) {
  const name = CARD_NAMES_HE[cardId];
  if (!name) return;

  const now = Date.now();
  if (now - lastSpoke < 400) return;
  lastSpoke = now;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(name);
  utterance.lang = "he-IL";
  utterance.rate = rate;
  utterance.pitch = 1.2;
  utterance.volume = 0.8;

  const voices = window.speechSynthesis.getVoices();
  const heVoice = voices.find(v => v.lang.startsWith("he")) || voices.find(v => v.lang.startsWith("iw"));
  if (heVoice) utterance.voice = heVoice;

  window.speechSynthesis.speak(utterance);
}

export function getCardNameHe(cardId: string): string | undefined {
  return CARD_NAMES_HE[cardId];
}
