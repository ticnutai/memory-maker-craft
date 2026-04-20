// Family quotes — built-in pool + user-added custom quotes (localStorage)
export interface FamilyQuote {
  id: string;
  text: string;
  emoji?: string;
}

export const BUILTIN_FAMILY_QUOTES: FamilyQuote[] = [
  { id: "b1",  emoji: "💖", text: "המשפחה היא הכל" },
  { id: "b2",  emoji: "🏠", text: "הבית הוא איפה שהלב נמצא" },
  { id: "b3",  emoji: "✨", text: "במשפחה אהבה לא מתחלקת, היא מוכפלת" },
  { id: "b4",  emoji: "💪", text: "ביחד אנחנו חזקים יותר" },
  { id: "b5",  emoji: "⚓", text: "המשפחה היא חוף מבטחים בכל סערה" },
  { id: "b6",  emoji: "🌟", text: "אין דבר חשוב יותר ממשפחה" },
  { id: "b7",  emoji: "🎁", text: "בני משפחה הם המתנות הכי יקרות בחיים" },
  { id: "b8",  emoji: "♾️", text: "האהבה במשפחה היא נצח" },
  { id: "b9",  emoji: "🍽️", text: "הזיכרונות הכי יפים נוצרים סביב שולחן המשפחה" },
  { id: "b10", emoji: "👶", text: "ילדים הם הברכה הגדולה ביותר" },
  { id: "b11", emoji: "😊", text: "הצחוק של ילדים הוא המוסיקה הכי יפה בבית" },
  { id: "b12", emoji: "👵", text: "סבא וסבתא, אהבה בלי גבולות" },
  { id: "b13", emoji: "🤝", text: "אחים ואחיות, חברים לכל החיים" },
  { id: "b14", emoji: "💝", text: "המשפחה היא העוגן של הלב" },
  { id: "b15", emoji: "💎", text: "כל רגע ביחד הוא אוצר לנצח" },
];

const CUSTOM_KEY = "family-custom-quotes";

export function loadCustomQuotes(): FamilyQuote[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveCustomQuotes(quotes: FamilyQuote[]) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(quotes));
    window.dispatchEvent(new CustomEvent("family-quotes-updated"));
  } catch { /* ignore */ }
}

export function addCustomQuote(text: string, emoji = "💫"): FamilyQuote {
  const t = text.trim();
  if (!t) throw new Error("Empty quote");
  const q: FamilyQuote = { id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: t, emoji };
  const list = loadCustomQuotes();
  list.unshift(q);
  saveCustomQuotes(list);
  return q;
}

export function removeCustomQuote(id: string) {
  const list = loadCustomQuotes().filter(q => q.id !== id);
  saveCustomQuotes(list);
}

export function getAllQuotes(): FamilyQuote[] {
  return [...BUILTIN_FAMILY_QUOTES, ...loadCustomQuotes()];
}

// Quote rotation interval (ms) - configurable
const ROTATION_KEY = "family-quote-rotation-ms";
export function loadQuoteRotationMs(): number {
  try {
    const v = parseInt(localStorage.getItem(ROTATION_KEY) ?? "", 10);
    return Number.isFinite(v) && v >= 2000 ? v : 6000;
  } catch { return 6000; }
}
export function saveQuoteRotationMs(ms: number) {
  localStorage.setItem(ROTATION_KEY, String(Math.max(2000, ms)));
  window.dispatchEvent(new CustomEvent("family-quotes-updated"));
}
