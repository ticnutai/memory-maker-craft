export type ActivityCategory = "game" | "creative" | "outdoor" | "connection";

export interface FamilyActivityIdea {
  id: string;
  title: string;
  durationMin: number;
  category: ActivityCategory;
  description: string;
}

export interface WeeklyPlanItem {
  weekday: string;
  idea: FamilyActivityIdea;
}

export const FAMILY_ACTIVITY_IDEAS: FamilyActivityIdea[] = [
  {
    id: "memory-challenge",
    title: "אליפות משחק הזיכרון המשפחתי",
    durationMin: 25,
    category: "game",
    description: "תחרות ידידותית במצב זיכרון, עם סבב נצחונות לכל גיל.",
  },
  {
    id: "train-quiz",
    title: "רכבת שאלות ומשימות",
    durationMin: 20,
    category: "game",
    description: "עוברים תחנה-תחנה עם שאלות משפחתיות ואתגרי צחוק קצרים.",
  },
  {
    id: "treasure-hunt",
    title: "חפש את המטמון בבית",
    durationMin: 30,
    category: "game",
    description: "מסלול רמזים קצר בין חדרים עם הפתעה קטנה בסוף.",
  },
  {
    id: "family-chef",
    title: "מטבח משפחתי - מנה אחת ביחד",
    durationMin: 45,
    category: "connection",
    description: "כל אחד אחראי על שלב אחר במתכון ומצלמים את התהליך.",
  },
  {
    id: "photo-story",
    title: "סיפור בתמונות",
    durationMin: 20,
    category: "creative",
    description: "בוחרים 5 תמונות מהקולאז׳ ומרכיבים מהן סיפור קצר.",
  },
  {
    id: "movement-party",
    title: "מסיבת תנועה קצרה",
    durationMin: 15,
    category: "outdoor",
    description: "מוזיקה, תנועה ואתגרי קצב למשפחה.",
  },
  {
    id: "gratitude-circle",
    title: "מעגל תודה שבועי",
    durationMin: 10,
    category: "connection",
    description: "כל אחד אומר דבר אחד טוב שקרה לו השבוע.",
  },
  {
    id: "lego-mission",
    title: "משימת בנייה יצירתית",
    durationMin: 25,
    category: "creative",
    description: "בונים דגם משותף לפי נושא שנבחר בתחילת הפעילות.",
  },
  {
    id: "walk-and-talk",
    title: "הליכה משפחתית ושאלות",
    durationMin: 30,
    category: "outdoor",
    description: "יציאה קצרה עם קלפי שאלות לשיחה פתוחה.",
  },
  {
    id: "talent-night",
    title: "ערב כישרונות ביתי",
    durationMin: 35,
    category: "creative",
    description: "הופעה קצרה לכל אחד: שיר, קסם, ציור או סיפור.",
  },
];

const WEEKDAY_LABELS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"] as const;

function normalizeDate(input?: Date | string): Date {
  if (!input) return new Date();
  if (input instanceof Date) return new Date(input.getTime());
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function daySeed(date: Date, salt = 0): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return y * 10000 + m * 100 + d + salt;
}

export function pickActivityOfTheDay(inputDate?: Date | string): FamilyActivityIdea {
  const date = normalizeDate(inputDate);
  const idx = Math.abs(daySeed(date)) % FAMILY_ACTIVITY_IDEAS.length;
  return FAMILY_ACTIVITY_IDEAS[idx];
}

export function buildWeeklyFamilyPlan(inputDate?: Date | string): WeeklyPlanItem[] {
  const start = normalizeDate(inputDate);
  const pool = [...FAMILY_ACTIVITY_IDEAS];
  const result: WeeklyPlanItem[] = [];

  for (let i = 0; i < WEEKDAY_LABELS_HE.length; i += 1) {
    const dayDate = new Date(start.getTime());
    dayDate.setDate(start.getDate() + i);

    const label = WEEKDAY_LABELS_HE[dayDate.getDay()];
    const idx = Math.abs(daySeed(dayDate, i * 17)) % pool.length;
    const idea = pool.splice(idx, 1)[0] ?? FAMILY_ACTIVITY_IDEAS[i % FAMILY_ACTIVITY_IDEAS.length];
    result.push({ weekday: label, idea });
  }

  return result;
}

export function getQuickGameSuggestions(): FamilyActivityIdea[] {
  return FAMILY_ACTIVITY_IDEAS.filter((idea) => idea.category === "game").slice(0, 3);
}
