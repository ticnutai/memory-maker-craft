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
  { id: "b16", emoji: "📸", text: "הזיכרונות שאנחנו יוצרים יחד לעולם לא נשכחים" },
  { id: "b17", emoji: "💞", text: "אהבת ההורים היא האהבה הכי טהורה" },
  { id: "b18", emoji: "🫶", text: "הבית מתמלא באהבה כשהמשפחה מתאספת" },
  { id: "b19", emoji: "🧡", text: "משפחה זה לא רק קשר דם, זה קשר של נפש" },
  { id: "b20", emoji: "🔥", text: "החום של הבית מתחיל באנשים שבתוכו" },
  { id: "b21", emoji: "🤗", text: "המשפחה היא המקום שמקבלים אותך תמיד" },
  { id: "b22", emoji: "🌈", text: "כשהמשפחה ביחד שום דבר לא חסר" },
  { id: "b23", emoji: "🥰", text: "האושר אמיתי כשמשתפים אותו עם המשפחה" },
  { id: "b24", emoji: "👼", text: "אמא ואבא הם המלאכים הראשונים של הילד" },
  { id: "b25", emoji: "❤️", text: "במשפחה לומדים את השיעור הכי חשוב, לאהוב" },
  { id: "b26", emoji: "🌞", text: "כל חיוך של ילד מאיר את הבית" },
  { id: "b27", emoji: "📖", text: "המשפחה היא הסיפור הכי יפה שלנו" },
  { id: "b28", emoji: "🍀", text: "מי שיש לו משפחה אוהבת, הוא העשיר באמת" },
  { id: "b29", emoji: "🕊️", text: "השלום הכי גדול נמצא בחיק המשפחה" },
  { id: "b30", emoji: "🎶", text: "המשפחה היא המנגינה שמלווה אותנו תמיד" },
  { id: "b31", emoji: "🌺", text: "אהבה משפחתית פורחת בכל עונה" },
  { id: "b32", emoji: "☕", text: "הרגעים הקטנים ביחד הם הכי גדולים" },
  { id: "b33", emoji: "🤍", text: "כשהמשפחה מאוחדת, אין דבר שאי אפשר לעבור" },
  { id: "b34", emoji: "🪴", text: "המשפחה היא השורשים שלנו והכנפיים שלנו" },
  { id: "b35", emoji: "💌", text: "מילה טובה במשפחה שווה יותר מזהב" },
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
