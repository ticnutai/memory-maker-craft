import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw, Trophy, Star, Home } from "lucide-react";

interface TriviaQuestion {
  question: string;
  options: string[];
  correct: number;
  emoji: string;
  category: string;
}

const TRIVIA_BANKS: Record<string, TriviaQuestion[]> = {
  "משפחה": [
    { question: "מה עושים ביום שישי בערב?", options: ["שיעורי בית", "שבת משפחתית", "ספורט", "קניות"], correct: 1, emoji: "🕯️", category: "משפחה" },
    { question: "מי בדרך כלל מבשל בבית?", options: ["אמא", "אבא", "סבתא", "כולם ביחד"], correct: 3, emoji: "👨‍🍳", category: "משפחה" },
    { question: "מה הכי כיף לעשות ביחד כמשפחה?", options: ["לצפות בסרט", "לשחק משחקים", "לטייל", "הכל!"], correct: 3, emoji: "💖", category: "משפחה" },
    { question: "מה חשוב הכי הרבה במשפחה?", options: ["כסף", "אהבה וכבוד", "צעצועים", "טלוויזיה"], correct: 1, emoji: "❤️", category: "משפחה" },
    { question: "מתי אוכלים ביחד כל המשפחה?", options: ["אף פעם", "רק בחגים", "בשבת", "כל יום!"], correct: 2, emoji: "🍽️", category: "משפחה" },
  ],
  "טבע": [
    { question: "איזה חיה הכי גדולה בעולם?", options: ["פיל", "ג'ירפה", "לוויתן כחול", "דינוזאור"], correct: 2, emoji: "🐋", category: "טבע" },
    { question: "מה הצבע של השמיים ביום בהיר?", options: ["ירוק", "כחול", "אדום", "סגול"], correct: 1, emoji: "🌤️", category: "טבע" },
    { question: "כמה רגליים יש לעכביש?", options: ["6", "8", "10", "4"], correct: 1, emoji: "🕷️", category: "טבע" },
    { question: "מאיפה בא דבש?", options: ["מהעצים", "מהדבורים", "מהחנות", "מהפרחים"], correct: 1, emoji: "🍯", category: "טבע" },
    { question: "מה שותים הצמחים?", options: ["חלב", "מיץ", "מים", "תה"], correct: 2, emoji: "🌱", category: "טבע" },
    { question: "איזה חיה מוציאה צליל 'מיאו'?", options: ["כלב", "חתול", "ציפור", "דג"], correct: 1, emoji: "🐱", category: "טבע" },
  ],
  "ישראל": [
    { question: "מה בירת ישראל?", options: ["תל אביב", "חיפה", "ירושלים", "באר שבע"], correct: 2, emoji: "🇮🇱", category: "ישראל" },
    { question: "באיזה ים אפשר לצוף בלי לשחות?", options: ["ים כנרת", "ים סוף", "ים המלח", "הים התיכון"], correct: 2, emoji: "🏊", category: "ישראל" },
    { question: "מה הפרי המפורסם של ישראל?", options: ["תפוח", "תפוז", "ענבים", "בננה"], correct: 1, emoji: "🍊", category: "ישראל" },
    { question: "באיזה חג אוכלים מצות?", options: ["פורים", "חנוכה", "פסח", "סוכות"], correct: 2, emoji: "🍞", category: "ישראל" },
    { question: "מה הכותל המערבי?", options: ["חומה עתיקה", "בניין חדש", "גן ציבורי", "מוזיאון"], correct: 0, emoji: "🕌", category: "ישראל" },
  ],
  "כללי": [
    { question: "כמה ימים יש בשבוע?", options: ["5", "6", "7", "8"], correct: 2, emoji: "📅", category: "כללי" },
    { question: "מה הצבע שמקבלים כשמערבבים אדום וכחול?", options: ["ירוק", "כתום", "סגול", "חום"], correct: 2, emoji: "🎨", category: "כללי" },
    { question: "כמה אצבעות יש בשתי ידיים?", options: ["8", "10", "12", "5"], correct: 1, emoji: "🖐️", category: "כללי" },
    { question: "מה שם הכוכב הכי קרוב לכדור הארץ?", options: ["הירח", "השמש", "מאדים", "נוגה"], correct: 1, emoji: "☀️", category: "כללי" },
    { question: "מה גדל על עצים?", options: ["גבינה", "פירות", "לחם", "שוקולד"], correct: 1, emoji: "🌳", category: "כללי" },
    { question: "באיזה עונה יורד שלג?", options: ["קיץ", "סתיו", "חורף", "אביב"], correct: 2, emoji: "❄️", category: "כללי" },
  ],
};

interface FamilyTriviaProps {
  onHome: () => void;
}

export default function FamilyTrivia({ onHome }: FamilyTriviaProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const startGame = useCallback((category: string) => {
    const bank = category === "הכל"
      ? Object.values(TRIVIA_BANKS).flat()
      : TRIVIA_BANKS[category] ?? [];
    const shuffled = [...bank].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setSelectedCategory(category);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswered(false);
    setFinished(false);
  }, []);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === questions[current].correct;
    if (correct) {
      setScore(s => s + 1);
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const restart = () => {
    setSelectedCategory(null);
    setFinished(false);
  };

  // Category selection
  if (!selectedCategory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-16" dir="rtl">
        <div className="text-6xl mb-4 bounce-in">❓</div>
        <h1 className="text-2xl font-black text-foreground mb-2">טריוויה משפחתית</h1>
        <p className="text-sm text-muted-foreground mb-6">בחרו קטגוריה והתחילו לשחק!</p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {[
            { id: "הכל", emoji: "🌈", label: "ערבוב הכל" },
            { id: "משפחה", emoji: "👨‍👩‍👧‍👦", label: "משפחה" },
            { id: "טבע", emoji: "🌿", label: "טבע וחיות" },
            { id: "ישראל", emoji: "🇮🇱", label: "ישראל" },
            { id: "כללי", emoji: "🧠", label: "ידע כללי" },
          ].map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => startGame(cat.id)}
              className="bg-card border-2 border-muted rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95 hover:border-primary bounce-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <span className="text-4xl">{cat.emoji}</span>
              <span className="font-bold text-sm text-foreground">{cat.label}</span>
            </button>
          ))}
        </div>

        <Button variant="ghost" onClick={onHome} className="mt-6 gap-2">
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
      </div>
    );
  }

  // Finished
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const starCount = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4" dir="rtl">
        <div className="bg-card rounded-3xl p-8 border-2 border-muted shadow-xl max-w-sm w-full text-center bounce-in">
          <div className="text-6xl mb-4">{pct >= 80 ? "🏆" : pct >= 50 ? "⭐" : "💪"}</div>
          <h2 className="text-xl font-black text-foreground mb-2">סיימתם!</h2>
          <p className="text-3xl font-black text-primary mb-1">{score}/{questions.length}</p>
          <p className="text-sm text-muted-foreground mb-4">תשובות נכונות</p>
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star key={i} className={`w-8 h-8 ${i < starCount ? "text-yellow-400 fill-yellow-400" : "text-muted"}`} />
            ))}
          </div>
          {bestStreak > 1 && (
            <p className="text-xs text-muted-foreground mb-4">🔥 רצף הכי ארוך: {bestStreak}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={() => startGame(selectedCategory!)} className="flex-1 gap-2 rounded-xl">
              <RotateCcw className="w-4 h-4" /> שחקו שוב
            </Button>
            <Button variant="outline" onClick={restart} className="flex-1 gap-2 rounded-xl">
              קטגוריה אחרת
            </Button>
          </div>
          <Button variant="ghost" onClick={onHome} className="mt-3 w-full gap-2">
            <Home className="w-4 h-4" /> דף הבית
          </Button>
        </div>
      </div>
    );
  }

  // Question
  const q = questions[current];
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" dir="rtl">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-muted-foreground">{current + 1}/{questions.length}</span>
          <div className="flex items-center gap-2">
            {streak >= 2 && <span className="text-xs font-bold text-orange-500">🔥 {streak}</span>}
            <span className="text-xs font-bold text-primary">⭐ {score}</span>
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>

        {/* Question card */}
        <div className="bg-card rounded-3xl p-6 border-2 border-muted shadow-lg mb-4 bounce-in" key={current}>
          <div className="text-center mb-4">
            <span className="text-5xl block mb-3">{q.emoji}</span>
            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{q.category}</span>
          </div>
          <h2 className="text-lg font-black text-center text-foreground mb-6">{q.question}</h2>

          <div className="grid grid-cols-1 gap-2">
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = i === q.correct;
              let classes = "w-full py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 text-right ";
              if (answered) {
                if (isCorrect) classes += "bg-green-100 border-green-400 text-green-800";
                else if (isSelected && !isCorrect) classes += "bg-red-100 border-red-400 text-red-800";
                else classes += "bg-muted/30 border-muted text-muted-foreground";
              } else {
                classes += "bg-card border-muted hover:border-primary hover:bg-primary/5 text-foreground";
              }
              return (
                <button key={i} onClick={() => handleAnswer(i)} className={classes} disabled={answered}>
                  <span className="ml-2 inline-block w-6 h-6 rounded-full border text-center text-xs leading-6 font-bold bg-muted/50">{["א", "ב", "ג", "ד"][i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {answered && (
          <div className="text-center bounce-in">
            <p className="text-sm font-bold mb-3">
              {selected === q.correct ? "🎉 נכון! כל הכבוד!" : `😅 לא נכון... התשובה: ${q.options[q.correct]}`}
            </p>
            <Button onClick={nextQuestion} className="rounded-xl gap-2">
              {current + 1 >= questions.length ? <><Trophy className="w-4 h-4" /> לתוצאות</> : <>שאלה הבאה <ArrowRight className="w-4 h-4 rotate-180" /></>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
