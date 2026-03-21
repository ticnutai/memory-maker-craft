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
  // Hebrew letters
  alef: "אָלֶף", bet: "בֵּית", gimel: "גִּימֶל", dalet: "דָּלֶת",
  he: "הֵא", vav: "וָו", zayin: "זַיִן", chet: "חֵית",
  tet: "טֵית", yod: "יוֹד", kaf: "כַּף", lamed: "לָמֶד",
  mem: "מֵם", nun: "נוּן", samekh: "סָמֶך", ayin: "עַיִן",
};

let lastSpoke = 0;

// Global speech volume multiplier (0-1)
let _speechVolumeMultiplier = 0.5;
export function setSpeechVolumeMultiplier(v: number) { _speechVolumeMultiplier = Math.max(0, Math.min(1, v)); }

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
  utterance.volume = 0.8 * _speechVolumeMultiplier;

  const voices = window.speechSynthesis.getVoices();
  const heVoice = voices.find(v => v.lang.startsWith("he")) || voices.find(v => v.lang.startsWith("iw"));
  if (heVoice) utterance.voice = heVoice;

  window.speechSynthesis.speak(utterance);
}

export function getCardNameHe(cardId: string): string | undefined {
  return CARD_NAMES_HE[cardId];
}
