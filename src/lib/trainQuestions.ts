// ── Train Game Trivia Questions ──

export type AgeGroup = 3 | 4 | 5 | 6;
export type QuestionType = "color-match" | "counting" | "animal-sound" | "shape" | "odd-one-out" | "custom";

export interface TrainQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: { label: string; emoji?: string; color?: string }[];
  correctIndex: number;
  ageGroup: AgeGroup[];
  difficulty: number; // 1-3
}

// ── Color matching questions ──
const COLOR_QUESTIONS: TrainQuestion[] = [
  {
    id: "c1", type: "color-match", question: "איזה צבע זה? 🔴",
    options: [{ label: "אדום", color: "#ef4444" }, { label: "כחול", color: "#3b82f6" }, { label: "ירוק", color: "#22c55e" }],
    correctIndex: 0, ageGroup: [3, 4], difficulty: 1,
  },
  {
    id: "c2", type: "color-match", question: "איזה צבע זה? 🔵",
    options: [{ label: "צהוב", color: "#eab308" }, { label: "כחול", color: "#3b82f6" }, { label: "ורוד", color: "#ec4899" }],
    correctIndex: 1, ageGroup: [3, 4], difficulty: 1,
  },
  {
    id: "c3", type: "color-match", question: "איזה צבע זה? 🟢",
    options: [{ label: "ירוק", color: "#22c55e" }, { label: "סגול", color: "#a855f7" }, { label: "כתום", color: "#f97316" }],
    correctIndex: 0, ageGroup: [3, 4], difficulty: 1,
  },
  {
    id: "c4", type: "color-match", question: "איזה צבע זה? 🟡",
    options: [{ label: "לבן", color: "#f5f5f5" }, { label: "צהוב", color: "#eab308" }, { label: "אדום", color: "#ef4444" }],
    correctIndex: 1, ageGroup: [3, 4], difficulty: 1,
  },
  {
    id: "c5", type: "color-match", question: "איזה צבע יוצא מערבוב אדום וכחול?",
    options: [{ label: "ירוק", color: "#22c55e" }, { label: "כתום", color: "#f97316" }, { label: "סגול", color: "#a855f7" }],
    correctIndex: 2, ageGroup: [5, 6], difficulty: 2,
  },
  {
    id: "c6", type: "color-match", question: "איזה צבע יוצא מערבוב אדום וצהוב?",
    options: [{ label: "כתום", color: "#f97316" }, { label: "סגול", color: "#a855f7" }, { label: "חום", color: "#92400e" }],
    correctIndex: 0, ageGroup: [5, 6], difficulty: 2,
  },
  {
    id: "c7", type: "color-match", question: "מה הצבע של השמיים ביום בהיר?",
    options: [{ label: "ירוק", color: "#22c55e" }, { label: "כחול", color: "#3b82f6" }, { label: "אדום", color: "#ef4444" }],
    correctIndex: 1, ageGroup: [3, 4, 5], difficulty: 1,
  },
  {
    id: "c8", type: "color-match", question: "מה הצבע של דשא?",
    options: [{ label: "כתום", color: "#f97316" }, { label: "צהוב", color: "#eab308" }, { label: "ירוק", color: "#22c55e" }],
    correctIndex: 2, ageGroup: [3, 4], difficulty: 1,
  },
];

// ── Counting questions ──
const COUNTING_QUESTIONS: TrainQuestion[] = [
  {
    id: "n1", type: "counting", question: "כמה תפוחים יש? 🍎🍎🍎",
    options: [{ label: "2", emoji: "✌️" }, { label: "3", emoji: "✨" }, { label: "4", emoji: "🍀" }],
    correctIndex: 1, ageGroup: [3, 4], difficulty: 1,
  },
  {
    id: "n2", type: "counting", question: "כמה כוכבים יש? ⭐⭐⭐⭐⭐",
    options: [{ label: "4", emoji: "🍀" }, { label: "5", emoji: "🖐️" }, { label: "6", emoji: "🎲" }],
    correctIndex: 1, ageGroup: [3, 4, 5], difficulty: 1,
  },
  {
    id: "n3", type: "counting", question: "כמה זה 2 + 1?",
    options: [{ label: "2", emoji: "✌️" }, { label: "3", emoji: "✨" }, { label: "4", emoji: "🍀" }],
    correctIndex: 1, ageGroup: [4, 5], difficulty: 2,
  },
  {
    id: "n4", type: "counting", question: "כמה זה 3 + 2?",
    options: [{ label: "4", emoji: "🍀" }, { label: "5", emoji: "🖐️" }, { label: "6", emoji: "🎲" }],
    correctIndex: 1, ageGroup: [5, 6], difficulty: 2,
  },
  {
    id: "n5", type: "counting", question: "כמה רגליים יש לכלב? 🐕",
    options: [{ label: "2", emoji: "✌️" }, { label: "4", emoji: "🍀" }, { label: "6", emoji: "🎲" }],
    correctIndex: 1, ageGroup: [3, 4, 5], difficulty: 1,
  },
  {
    id: "n6", type: "counting", question: "כמה זה 4 + 3?",
    options: [{ label: "6", emoji: "🎲" }, { label: "7", emoji: "🌈" }, { label: "8", emoji: "🎱" }],
    correctIndex: 1, ageGroup: [5, 6], difficulty: 3,
  },
  {
    id: "n7", type: "counting", question: "כמה אצבעות יש ביד אחת?",
    options: [{ label: "4", emoji: "🍀" }, { label: "5", emoji: "🖐️" }, { label: "10", emoji: "🔟" }],
    correctIndex: 1, ageGroup: [3, 4, 5], difficulty: 1,
  },
  {
    id: "n8", type: "counting", question: "כמה זה 5 - 2?",
    options: [{ label: "2", emoji: "✌️" }, { label: "3", emoji: "✨" }, { label: "4", emoji: "🍀" }],
    correctIndex: 1, ageGroup: [5, 6], difficulty: 2,
  },
];

// ── Animal sound questions ──
const ANIMAL_QUESTIONS: TrainQuestion[] = [
  {
    id: "a1", type: "animal-sound", question: "מי אומר 'הַו הַו'? 🗣️",
    options: [{ label: "כלב", emoji: "🐕" }, { label: "חתול", emoji: "🐱" }, { label: "פרה", emoji: "🐄" }],
    correctIndex: 0, ageGroup: [3, 4], difficulty: 1,
  },
  {
    id: "a2", type: "animal-sound", question: "מי אומר 'מיאו'? 🗣️",
    options: [{ label: "ציפור", emoji: "🐦" }, { label: "חתול", emoji: "🐱" }, { label: "דג", emoji: "🐟" }],
    correctIndex: 1, ageGroup: [3, 4], difficulty: 1,
  },
  {
    id: "a3", type: "animal-sound", question: "מי אומר 'מוּ'? 🗣️",
    options: [{ label: "כבשה", emoji: "🐑" }, { label: "סוס", emoji: "🐴" }, { label: "פרה", emoji: "🐄" }],
    correctIndex: 2, ageGroup: [3, 4], difficulty: 1,
  },
  {
    id: "a4", type: "animal-sound", question: "איזה חיה הכי גדולה?",
    options: [{ label: "עכבר", emoji: "🐭" }, { label: "פיל", emoji: "🐘" }, { label: "חתול", emoji: "🐱" }],
    correctIndex: 1, ageGroup: [3, 4, 5], difficulty: 1,
  },
  {
    id: "a5", type: "animal-sound", question: "מי גר בים?",
    options: [{ label: "כלב", emoji: "🐕" }, { label: "ציפור", emoji: "🐦" }, { label: "דולפין", emoji: "🐬" }],
    correctIndex: 2, ageGroup: [3, 4, 5], difficulty: 1,
  },
  {
    id: "a6", type: "animal-sound", question: "מי יכול לעוף?",
    options: [{ label: "דג", emoji: "🐟" }, { label: "ציפור", emoji: "🐦" }, { label: "כלב", emoji: "🐕" }],
    correctIndex: 1, ageGroup: [3, 4], difficulty: 1,
  },
  {
    id: "a7", type: "animal-sound", question: "מי נותן לנו חלב?",
    options: [{ label: "תרנגולת", emoji: "🐔" }, { label: "פרה", emoji: "🐄" }, { label: "ארנב", emoji: "🐰" }],
    correctIndex: 1, ageGroup: [4, 5, 6], difficulty: 2,
  },
  {
    id: "a8", type: "animal-sound", question: "מי נותן לנו ביצים?",
    options: [{ label: "תרנגולת", emoji: "🐔" }, { label: "כלב", emoji: "🐕" }, { label: "סוס", emoji: "🐴" }],
    correctIndex: 0, ageGroup: [4, 5, 6], difficulty: 2,
  },
];

// ── Shape questions ──
const SHAPE_QUESTIONS: TrainQuestion[] = [
  {
    id: "s1", type: "shape", question: "מה הצורה הזו? ⬜",
    options: [{ label: "משולש", emoji: "🔺" }, { label: "ריבוע", emoji: "⬜" }, { label: "עיגול", emoji: "⭕" }],
    correctIndex: 1, ageGroup: [3, 4, 5], difficulty: 1,
  },
  {
    id: "s2", type: "shape", question: "מה הצורה הזו? 🔺",
    options: [{ label: "עיגול", emoji: "⭕" }, { label: "ריבוע", emoji: "⬜" }, { label: "משולש", emoji: "🔺" }],
    correctIndex: 2, ageGroup: [3, 4, 5], difficulty: 1,
  },
  {
    id: "s3", type: "shape", question: "לעיגול יש פינות?",
    options: [{ label: "כן", emoji: "✅" }, { label: "לא", emoji: "❌" }],
    correctIndex: 1, ageGroup: [4, 5, 6], difficulty: 2,
  },
  {
    id: "s4", type: "shape", question: "כמה צדדים יש למשולש?",
    options: [{ label: "2", emoji: "✌️" }, { label: "3", emoji: "✨" }, { label: "4", emoji: "🍀" }],
    correctIndex: 1, ageGroup: [4, 5, 6], difficulty: 2,
  },
  {
    id: "s5", type: "shape", question: "מה הצורה של גלגל? 🛞",
    options: [{ label: "משולש", emoji: "🔺" }, { label: "ריבוע", emoji: "⬜" }, { label: "עיגול", emoji: "⭕" }],
    correctIndex: 2, ageGroup: [3, 4, 5], difficulty: 1,
  },
  {
    id: "s6", type: "shape", question: "כמה צדדים יש לריבוע?",
    options: [{ label: "3", emoji: "✨" }, { label: "4", emoji: "🍀" }, { label: "5", emoji: "🖐️" }],
    correctIndex: 1, ageGroup: [4, 5, 6], difficulty: 2,
  },
];

// ── Odd one out ──
const ODD_QUESTIONS: TrainQuestion[] = [
  {
    id: "o1", type: "odd-one-out", question: "מי לא שייך לקבוצה?",
    options: [{ label: "כלב", emoji: "🐕" }, { label: "חתול", emoji: "🐱" }, { label: "מכונית", emoji: "🚗" }],
    correctIndex: 2, ageGroup: [4, 5, 6], difficulty: 2,
  },
  {
    id: "o2", type: "odd-one-out", question: "מי לא פרי?",
    options: [{ label: "תפוח", emoji: "🍎" }, { label: "בננה", emoji: "🍌" }, { label: "גזר", emoji: "🥕" }],
    correctIndex: 2, ageGroup: [4, 5, 6], difficulty: 2,
  },
  {
    id: "o3", type: "odd-one-out", question: "מי לא כלי תחבורה?",
    options: [{ label: "אוטובוס", emoji: "🚌" }, { label: "עוגה", emoji: "🎂" }, { label: "רכבת", emoji: "🚂" }],
    correctIndex: 1, ageGroup: [4, 5, 6], difficulty: 2,
  },
  {
    id: "o4", type: "odd-one-out", question: "מי לא חיה?",
    options: [{ label: "אריה", emoji: "🦁" }, { label: "שמש", emoji: "☀️" }, { label: "ארנב", emoji: "🐰" }],
    correctIndex: 1, ageGroup: [3, 4, 5], difficulty: 1,
  },
];

export const ALL_QUESTIONS: TrainQuestion[] = [
  ...COLOR_QUESTIONS,
  ...COUNTING_QUESTIONS,
  ...ANIMAL_QUESTIONS,
  ...SHAPE_QUESTIONS,
  ...ODD_QUESTIONS,
];

export function getQuestionsForAge(age: AgeGroup, customQuestions: TrainQuestion[] = []): TrainQuestion[] {
  const builtIn = ALL_QUESTIONS.filter(q => q.ageGroup.includes(age));
  const custom = customQuestions.filter(q => q.ageGroup.includes(age));
  return shuffleQuestions([...builtIn, ...custom]);
}

function shuffleQuestions<T>(arr: T[]): T[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}
