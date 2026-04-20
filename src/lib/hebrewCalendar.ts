import { HDate, HebrewCalendar, flags, Sedra } from "@hebcal/core";

export interface HebDayInfo {
  hebDay: string;          // "ט״ו"
  hebMonth: string;        // "תשרי"
  hebFull: string;         // "ט״ו תשרי תשפ״ה"
  isRoshChodesh: boolean;
  roshChodeshOf?: string;  // name of the new month
  isShabbat: boolean;
  parsha?: string;         // Hebrew parsha name (Saturday only)
  holidays: { name: string; emoji: string; isYomTov: boolean }[];
}

// ── Hebrew month names ──
const HEB_MONTH_NAMES: Record<string, string> = {
  Nisan: "ניסן", Iyyar: "אייר", Sivan: "סיון", Tamuz: "תמוז",
  Av: "אב", Elul: "אלול", Tishrei: "תשרי", Cheshvan: "חשון",
  Kislev: "כסלו", Tevet: "טבת", "Sh'vat": "שבט", Adar: "אדר",
  "Adar I": "אדר א׳", "Adar II": "אדר ב׳",
};

// ── Holiday emoji map ──
const HOLIDAY_EMOJI: Record<string, string> = {
  "Rosh Hashana": "🍎", "Yom Kippur": "🕊️", "Sukkot": "🌿",
  "Shmini Atzeret": "📜", "Simchat Torah": "📜",
  "Chanukah": "🕎", "Tu BiShvat": "🌳", "Purim": "🎭",
  "Shushan Purim": "🎭", "Pesach": "🍷", "Yom HaAtzma'ut": "🇮🇱",
  "Yom HaZikaron": "🕯️", "Yom HaShoah": "🕯️",
  "Lag BaOmer": "🔥", "Yom Yerushalayim": "🕍",
  "Shavuot": "🌾", "Tish'a B'Av": "😢", "Tu B'Av": "💕",
  "Rosh Chodesh": "🌙", "Erev": "🌅",
};

// ── Holiday Hebrew translations ──
const HOLIDAY_HE: Record<string, string> = {
  "Rosh Hashana": "ראש השנה", "Yom Kippur": "יום כיפור",
  "Erev Yom Kippur": "ערב יום כיפור", "Erev Rosh Hashana": "ערב ראש השנה",
  "Sukkot": "סוכות", "Erev Sukkot": "ערב סוכות",
  "Shmini Atzeret": "שמיני עצרת", "Simchat Torah": "שמחת תורה",
  "Chanukah": "חנוכה", "Tu BiShvat": "ט״ו בשבט",
  "Purim": "פורים", "Shushan Purim": "שושן פורים",
  "Erev Purim": "ערב פורים", "Ta'anit Esther": "תענית אסתר",
  "Pesach": "פסח", "Erev Pesach": "ערב פסח",
  "Yom HaAtzma'ut": "יום העצמאות", "Yom HaZikaron": "יום הזיכרון",
  "Yom HaShoah": "יום השואה", "Lag BaOmer": "ל״ג בעומר",
  "Yom Yerushalayim": "יום ירושלים", "Shavuot": "שבועות",
  "Erev Shavuot": "ערב שבועות", "Tish'a B'Av": "תשעה באב",
  "Tu B'Av": "ט״ו באב", "Rosh Chodesh": "ראש חודש",
  "Fast of Gedaliah": "צום גדליה", "Asara B'Tevet": "עשרה בטבת",
  "Sigd": "סיגד", "Ta'anit Bechorot": "תענית בכורות",
  "Leil Selichot": "ליל סליחות",
};

function translateHolidayName(en: string): string {
  // try exact match
  if (HOLIDAY_HE[en]) return HOLIDAY_HE[en];
  // try base (e.g. "Pesach VII" → "Pesach")
  for (const key of Object.keys(HOLIDAY_HE)) {
    if (en.startsWith(key)) {
      const suffix = en.slice(key.length).trim();
      return suffix ? `${HOLIDAY_HE[key]} ${suffix}` : HOLIDAY_HE[key];
    }
  }
  return en;
}

function getHolidayEmoji(en: string): string {
  for (const key of Object.keys(HOLIDAY_EMOJI)) {
    if (en.includes(key)) return HOLIDAY_EMOJI[key];
  }
  return "✨";
}

// ── Hebrew numerals (gematria) ──
const GEMATRIA_LETTERS = [
  "", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט",
  "י", "יא", "יב", "יג", "יד", "טו", "טז", "יז", "יח", "יט",
  "כ", "כא", "כב", "כג", "כד", "כה", "כו", "כז", "כח", "כט", "ל",
];
function toHebrewNumeral(n: number): string {
  if (n < 1 || n > 30) return String(n);
  const s = GEMATRIA_LETTERS[n];
  if (s.length === 1) return s + "׳";
  return s.slice(0, -1) + "״" + s.slice(-1);
}

// ── Parsha translations (basic, common ones) ──
const PARSHA_HE: Record<string, string> = {
  "Bereshit": "בראשית", "Noach": "נח", "Lech-Lecha": "לך לך",
  "Vayera": "וירא", "Chayei Sara": "חיי שרה", "Toldot": "תולדות",
  "Vayetzei": "ויצא", "Vayishlach": "וישלח", "Vayeshev": "וישב",
  "Miketz": "מקץ", "Vayigash": "ויגש", "Vayechi": "ויחי",
  "Shemot": "שמות", "Vaera": "וארא", "Bo": "בא", "Beshalach": "בשלח",
  "Yitro": "יתרו", "Mishpatim": "משפטים", "Terumah": "תרומה",
  "Tetzaveh": "תצוה", "Ki Tisa": "כי תשא", "Vayakhel": "ויקהל",
  "Pekudei": "פקודי", "Vayikra": "ויקרא", "Tzav": "צו",
  "Shmini": "שמיני", "Tazria": "תזריע", "Metzora": "מצורע",
  "Achrei Mot": "אחרי מות", "Kedoshim": "קדושים", "Emor": "אמור",
  "Behar": "בהר", "Bechukotai": "בחקתי", "Bamidbar": "במדבר",
  "Nasso": "נשא", "Beha'alotcha": "בהעלתך", "Sh'lach": "שלח",
  "Korach": "קרח", "Chukat": "חקת", "Balak": "בלק",
  "Pinchas": "פינחס", "Matot": "מטות", "Masei": "מסעי",
  "Devarim": "דברים", "Vaetchanan": "ואתחנן", "Eikev": "עקב",
  "Re'eh": "ראה", "Shoftim": "שופטים", "Ki Teitzei": "כי תצא",
  "Ki Tavo": "כי תבוא", "Nitzavim": "נצבים", "Vayeilech": "וילך",
  "Ha'azinu": "האזינו", "Vezot Haberakhah": "וזאת הברכה",
};

function translateParsha(en: string): string {
  // handle double parshiot like "Vayakhel-Pekudei"
  const parts = en.split("-");
  return parts.map(p => PARSHA_HE[p.trim()] || p).join(" - ");
}

// ── Sedra cache per year (Israel) ──
const sedraCache = new Map<number, Sedra>();
function getCachedSedra(hebYear: number): Sedra {
  let s = sedraCache.get(hebYear);
  if (!s) {
    s = new Sedra(hebYear, true /* il */);
    sedraCache.set(hebYear, s);
  }
  return s;
}

// ── Main: per-day info ──
export function getHebDayInfo(date: Date): HebDayInfo {
  const hd = new HDate(date);
  const hebDay = toHebrewNumeral(hd.getDate());
  const monthName = hd.getMonthName(); // English
  const hebMonth = HEB_MONTH_NAMES[monthName] || monthName;
  
  const hebFull = `${hebDay} ${hebMonth}`;
  const isShabbat = date.getDay() === 6;

  // Holidays
  const events = HebrewCalendar.getHolidaysOnDate(hd, true /* il */) || [];
  const holidays: HebDayInfo["holidays"] = [];
  let isRoshChodesh = false;
  let roshChodeshOf: string | undefined;

  for (const ev of events) {
    const desc = ev.getDesc();
    const f = ev.getFlags();
    if (f & flags.ROSH_CHODESH) {
      isRoshChodesh = true;
      // extract month name from "Rosh Chodesh Tishrei"
      const m = desc.replace("Rosh Chodesh ", "").trim();
      roshChodeshOf = HEB_MONTH_NAMES[m] || m;
      continue;
    }
    if (f & (flags.MINOR_FAST | flags.MAJOR_FAST | flags.CHAG | flags.MODERN_HOLIDAY | flags.MINOR_HOLIDAY | flags.CHANUKAH_CANDLES | flags.SPECIAL_SHABBAT)) {
      const isYomTov = !!(f & flags.CHAG);
      holidays.push({
        name: translateHolidayName(desc),
        emoji: getHolidayEmoji(desc),
        isYomTov,
      });
    }
  }

  // Parsha (only Saturday)
  let parsha: string | undefined;
  if (isShabbat) {
    try {
      const sedra = getCachedSedra(hd.getFullYear());
      const result = sedra.lookup(hd);
      if (result && !result.chag && result.parsha && result.parsha.length) {
        parsha = result.parsha.map(translateParsha).join(" - ");
      }
    } catch { /* ignore */ }
  }

  return {
    hebDay,
    hebMonth,
    hebFull,
    isRoshChodesh,
    roshChodeshOf,
    isShabbat,
    parsha,
    holidays,
  };
}

// ── Get Hebrew month label for display ──
export function getHebMonthLabel(date: Date): string {
  const hd = new HDate(date);
  const monthName = hd.getMonthName();
  return HEB_MONTH_NAMES[monthName] || monthName;
}

// ── Hebrew month options ──
export interface HebMonthOption {
  index: number;
  name: string;
}

const HEB_MONTHS_ORDER: { idx: number; name: string }[] = [
  { idx: 7, name: "תשרי" },
  { idx: 8, name: "חשון" },
  { idx: 9, name: "כסלו" },
  { idx: 10, name: "טבת" },
  { idx: 11, name: "שבט" },
  { idx: 12, name: "אדר" },
  { idx: 13, name: "אדר ב׳" },
  { idx: 1, name: "ניסן" },
  { idx: 2, name: "אייר" },
  { idx: 3, name: "סיון" },
  { idx: 4, name: "תמוז" },
  { idx: 5, name: "אב" },
  { idx: 6, name: "אלול" },
];

export function getHebMonthsForYear(hyear: number): HebMonthOption[] {
  const isLeap = HDate.isLeapYear(hyear);
  return HEB_MONTHS_ORDER
    .filter(m => {
      if (!isLeap && m.idx === 13) return false;
      return true;
    })
    .map(m => ({
      index: m.idx,
      name: isLeap && m.idx === 12 ? "אדר א׳" : m.name,
    }));
}

export function hebrewToGregorian(hyear: number, hmonth: number, hday: number): Date {
  const hd = new HDate(hday, hmonth, hyear);
  return hd.greg();
}

export function getCurrentHebYear(): number {
  return new HDate(new Date()).getFullYear();
}

export function daysInHebMonth(hyear: number, hmonthIdx: number): number {
  try {
    return HDate.daysInMonth(hmonthIdx, hyear);
  } catch {
    return 30;
  }
}

export function gregorianToHebrew(date: Date): { hyear: number; hmonth: number; hday: number } {
  const hd = new HDate(date);
  return { hyear: hd.getFullYear(), hmonth: hd.getMonth(), hday: hd.getDate() };
}
