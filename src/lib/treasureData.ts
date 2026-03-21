// Treasure Hunt game data — scenes, hidden items, and clues

export type Difficulty = "easy" | "medium" | "hard";

export interface HiddenItem {
  id: string;
  emoji: string;
  label: string; // Hebrew name
  voiceClue: string; // Voice clue in Hebrew
  visualClue: string; // Visual/text clue
}

export interface TreasureScene {
  id: string;
  name: string;
  emoji: string;
  background: string; // CSS gradient
  decorEmojis: string[]; // Scattered decoration emojis
  items: HiddenItem[];
}

export const TREASURE_SCENES: TreasureScene[] = [
  {
    id: "garden",
    name: "🌸 הגינה הקסומה",
    emoji: "🌸",
    background: "linear-gradient(180deg, #87CEEB 0%, #98FB98 60%, #228B22 100%)",
    decorEmojis: ["🌳", "🌿", "🌻", "🌺", "🍃", "🌾", "🦋", "🐝", "☀️", "⛅", "🌈", "🪴", "🍄", "🪨", "🌵"],
    items: [
      { id: "g1", emoji: "🐞", label: "חיפושית", voiceClue: "חפשו חרק אדום קטן עם נקודות שחורות!", visualClue: "🔴 אדום עם נקודות" },
      { id: "g2", emoji: "🐸", label: "צפרדע", voiceClue: "מי קופץ ואומר קווה קווה?", visualClue: "🟢 ירוק וקופץ" },
      { id: "g3", emoji: "🍎", label: "תפוח", voiceClue: "פרי אדום ומתוק שגדל על עץ!", visualClue: "🔴 פרי על עץ" },
      { id: "g4", emoji: "🦔", label: "קיפוד", voiceClue: "חיה קטנה עם קוצים על הגב!", visualClue: "🟤 קוצני וחמוד" },
      { id: "g5", emoji: "🐌", label: "חילזון", voiceClue: "מי נושא את הבית שלו על הגב?", visualClue: "🐚 איטי עם בית" },
      { id: "g6", emoji: "🌹", label: "ורד", voiceClue: "פרח יפהפה בצבע אדום!", visualClue: "❤️ פרח אדום" },
      { id: "g7", emoji: "🍓", label: "תות", voiceClue: "פרי קטן אדום עם גרגירים!", visualClue: "🔴 קטן ומתוק" },
      { id: "g8", emoji: "🐛", label: "זחל", voiceClue: "הוא זוחל על עלים ויום אחד יהפוך לפרפר!", visualClue: "🟢 זוחל על עלים" },
    ],
  },
  {
    id: "ocean",
    name: "🌊 עולם הים",
    emoji: "🌊",
    background: "linear-gradient(180deg, #0077B6 0%, #00B4D8 40%, #90E0EF 70%, #CAF0F8 100%)",
    decorEmojis: ["🌊", "🫧", "🐚", "🪸", "🌿", "💎", "⭐", "🔵", "💧", "🪨", "🐠", "🦀"],
    items: [
      { id: "o1", emoji: "🐙", label: "תמנון", voiceClue: "למי יש שמונה זרועות?", visualClue: "🟣 8 זרועות" },
      { id: "o2", emoji: "🐢", label: "צב ים", voiceClue: "הוא שוחה לאט עם שריון על הגב!", visualClue: "🟢 שריון וסנפירים" },
      { id: "o3", emoji: "🦈", label: "כריש", voiceClue: "דג גדול וחזק עם שיניים חדות!", visualClue: "🔵 גדול עם שיניים" },
      { id: "o4", emoji: "🐡", label: "דג קיפוד", voiceClue: "דג שמתנפח כשהוא מפחד!", visualClue: "🟡 מתנפח מפחד" },
      { id: "o5", emoji: "🦞", label: "לובסטר", voiceClue: "יצור אדום עם צבתות גדולות!", visualClue: "🔴 צבתות גדולות" },
      { id: "o6", emoji: "🐬", label: "דולפין", voiceClue: "יונק ים חכם שאוהב לקפוץ מהמים!", visualClue: "🔵 קופץ ומחייך" },
      { id: "o7", emoji: "🦑", label: "דיונון", voiceClue: "דומה לתמנון אבל עם עשר זרועות!", visualClue: "🟠 10 זרועות" },
      { id: "o8", emoji: "⚓", label: "עוגן", voiceClue: "עשוי ממתכת ומחזיק את הספינה במקום!", visualClue: "⬛ מתכת כבדה" },
    ],
  },
  {
    id: "space",
    name: "🚀 חלל החיצון",
    emoji: "🚀",
    background: "linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 40%, #2d1b69 70%, #0a0a2e 100%)",
    decorEmojis: ["⭐", "✨", "💫", "🌟", "✡️", "🔮", "🌙", "☄️", "🪐", "🌌", "💜", "🟣"],
    items: [
      { id: "s1", emoji: "🛸", label: "צלחת מעופפת", voiceClue: "כלי טיס של חייזרים!", visualClue: "🟢 מעופפת ומסתורית" },
      { id: "s2", emoji: "👽", label: "חייזר", voiceClue: "יצור ירוק מכוכב אחר!", visualClue: "🟢 עיניים גדולות" },
      { id: "s3", emoji: "🌍", label: "כדור הארץ", voiceClue: "הכוכב הכחול שלנו!", visualClue: "🔵 הבית שלנו" },
      { id: "s4", emoji: "🌕", label: "ירח", voiceClue: "הוא מאיר בלילה ומלא מכתשים!", visualClue: "⚪ מאיר בלילה" },
      { id: "s5", emoji: "🛰️", label: "לוויין", voiceClue: "מכשיר שמקיף את כדור הארץ בחלל!", visualClue: "🔧 מקיף את כדור הארץ" },
      { id: "s6", emoji: "🧑‍🚀", label: "אסטרונאוט", voiceClue: "אדם שלובש חליפה מיוחדת ומטייל בחלל!", visualClue: "👤 חליפה לבנה" },
      { id: "s7", emoji: "☄️", label: "שביט", voiceClue: "סלע שעף בחלל עם זנב של אש!", visualClue: "🔥 זנב של אור" },
      { id: "s8", emoji: "🔭", label: "טלסקופ", voiceClue: "מכשיר שעוזר לראות כוכבים רחוקים!", visualClue: "🔍 רואה רחוק" },
    ],
  },
  {
    id: "farm",
    name: "🐄 החווה השמחה",
    emoji: "🐄",
    background: "linear-gradient(180deg, #87CEEB 0%, #F0E68C 50%, #8B4513 90%, #654321 100%)",
    decorEmojis: ["🌾", "🌻", "🌽", "🥕", "🍂", "🌿", "☀️", "⛅", "🏡", "🪵", "🧱", "🌳"],
    items: [
      { id: "f1", emoji: "🐔", label: "תרנגולת", voiceClue: "מי מטילה ביצים ואומרת קוקוריקו?", visualClue: "🟤 מטילה ביצים" },
      { id: "f2", emoji: "🐷", label: "חזיר", voiceClue: "חיה ורודה שאוהבת להתגלגל בבוץ!", visualClue: "🩷 אוהב בוץ" },
      { id: "f3", emoji: "🐴", label: "סוס", voiceClue: "חיה גדולה שאפשר לרכב עליה!", visualClue: "🟤 דוהר ומהיר" },
      { id: "f4", emoji: "🐑", label: "כבשה", voiceClue: "חיה עם צמר לבן רך!", visualClue: "⚪ צמר רך" },
      { id: "f5", emoji: "🐓", label: "תרנגול", voiceClue: "הוא מעיר את כולם בבוקר!", visualClue: "🔴 קוקוריקו!" },
      { id: "f6", emoji: "🥚", label: "ביצה", voiceClue: "עגולה ולבנה, התרנגולת הטילה אותה!", visualClue: "⚪ עגולה ושבירה" },
      { id: "f7", emoji: "🌻", label: "חמנייה", voiceClue: "פרח צהוב גדול שפונה לשמש!", visualClue: "🟡 פונה לשמש" },
      { id: "f8", emoji: "🚜", label: "טרקטור", voiceClue: "כלי רכב גדול שעובד בשדה!", visualClue: "🟢 עובד בשדה" },
    ],
  },
  {
    id: "candy",
    name: "🍭 ארץ הממתקים",
    emoji: "🍭",
    background: "linear-gradient(180deg, #FFB6C1 0%, #FF69B4 30%, #FF1493 60%, #FFD700 100%)",
    decorEmojis: ["🍬", "🍫", "🧁", "🎂", "🍩", "🍪", "🌈", "⭐", "💖", "🎀", "✨", "🍡"],
    items: [
      { id: "c1", emoji: "🎂", label: "עוגה", voiceClue: "עליה יש נרות ואוכלים אותה ביום הולדת!", visualClue: "🎂 עם נרות" },
      { id: "c2", emoji: "🍦", label: "גלידה", voiceClue: "קרה ומתוקה, מושלמת לקיץ!", visualClue: "🍦 קרה ומתוקה" },
      { id: "c3", emoji: "🧁", label: "קאפקייק", voiceClue: "עוגה קטנטנה עם קרם למעלה!", visualClue: "🩷 עוגה קטנה" },
      { id: "c4", emoji: "🍩", label: "דונאט", voiceClue: "עגול עם חור באמצע ומצופה בשוקולד!", visualClue: "🟤 חור באמצע" },
      { id: "c5", emoji: "🍰", label: "פרוסת עוגה", voiceClue: "משולש מתוק מעוגה גדולה!", visualClue: "🔺 משולש מתוק" },
      { id: "c6", emoji: "🍭", label: "סוכרייה על מקל", voiceClue: "עגולה וצבעונית על מקל!", visualClue: "🌀 צבעונית על מקל" },
      { id: "c7", emoji: "🍪", label: "עוגייה", voiceClue: "עגולה עם שבבי שוקולד!", visualClue: "🟤 עם שבבים" },
      { id: "c8", emoji: "🎁", label: "מתנה", voiceClue: "קופסה עטופה עם סרט יפה!", visualClue: "🎁 עטופה בסרט" },
    ],
  },
  {
    id: "jungle",
    name: "🦁 הג'ונגל הפראי",
    emoji: "🦁",
    background: "linear-gradient(180deg, #2d5a27 0%, #3a7d32 30%, #228B22 60%, #1a4d1a 100%)",
    decorEmojis: ["🌴", "🌿", "🍃", "🌳", "🍂", "🌺", "🪺", "🍄", "🪵", "🌱", "💚", "🟤"],
    items: [
      { id: "j1", emoji: "🦁", label: "אריה", voiceClue: "מלך החיות עם רעמה גדולה!", visualClue: "🟡 מלך החיות" },
      { id: "j2", emoji: "🐒", label: "קוף", voiceClue: "חיה שאוהבת לטפס על עצים ולאכול בננות!", visualClue: "🟤 מטפס ומשחק" },
      { id: "j3", emoji: "🦜", label: "תוכי", voiceClue: "ציפור צבעונית שיודעת לדבר!", visualClue: "🟢🔴 ציפור מדברת" },
      { id: "j4", emoji: "🐍", label: "נחש", voiceClue: "ארוך וזוחל על הבטן!", visualClue: "🟢 ארוך וזוחל" },
      { id: "j5", emoji: "🦎", label: "לטאה", voiceClue: "זוחל קטן שמחליף צבעים!", visualClue: "🟢 מחליף צבעים" },
      { id: "j6", emoji: "🍌", label: "בננה", voiceClue: "פרי צהוב שקופים אוהבים!", visualClue: "🟡 פרי מעוקל" },
      { id: "j7", emoji: "🦋", label: "פרפר", voiceClue: "חרק יפהפה עם כנפיים צבעוניות!", visualClue: "🦋 כנפיים צבעוניות" },
      { id: "j8", emoji: "🐊", label: "תנין", voiceClue: "זוחל ירוק גדול עם שיניים חדות ליד המים!", visualClue: "🟢 שיניים חדות" },
    ],
  },
];

export function getItemsForDifficulty(scene: TreasureScene, difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy": return 3;
    case "medium": return 5;
    case "hard": return 8;
  }
}

export function getDecoyCount(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy": return 8;
    case "medium": return 15;
    case "hard": return 25;
  }
}

export function getTimeLimit(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy": return 60;
    case "medium": return 45;
    case "hard": return 30;
  }
}
