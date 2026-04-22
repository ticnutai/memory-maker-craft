import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Trash2, Home, BookOpen, RotateCcw, Download } from "lucide-react";

const STORY_STARTERS = [
  "פעם אחת, במקום רחוק מאוד, חיה משפחה מיוחדת שידעה ל...",
  "יום אחד, סבא גילה בחצר האחורית...",
  "הילדים יצאו לטיול ולפתע ראו...",
  "בלילה חשוך, כשכולם ישנו, הכלב של המשפחה...",
  "בחופשה הגדולה, המשפחה הגיעה למקום שאף אחד לא ראה לפני כן...",
  "האח הקטן מצא מפתח זהב ישן מתחת ל...",
  "ביום הולדת של סבתא, קרה משהו מדהים...",
];

interface StoryEntry {
  text: string;
  author: string;
  emoji: string;
}

const AUTHOR_EMOJIS = ["👧", "👦", "👩", "👨", "👵", "👴", "🧒", "🧑"];

interface ChainStoryGameProps {
  onHome: () => void;
}

export default function ChainStoryGame({ onHome }: ChainStoryGameProps) {
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [currentAuthor, setCurrentAuthor] = useState("");
  const [currentEmoji, setCurrentEmoji] = useState("👧");
  const [started, setStarted] = useState(false);

  const startStory = (starter?: string) => {
    if (starter) {
      setEntries([{ text: starter, author: "מספר הסיפור", emoji: "📖" }]);
    } else {
      setEntries([]);
    }
    setStarted(true);
    setCurrentText("");
  };

  const addEntry = () => {
    if (!currentText.trim()) return;
    setEntries(prev => [...prev, { text: currentText.trim(), author: currentAuthor || "אנונימי", emoji: currentEmoji }]);
    setCurrentText("");
    setCurrentAuthor("");
  };

  const removeEntry = (idx: number) => {
    setEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const exportStory = () => {
    const text = entries.map(e => `${e.emoji} ${e.author}: ${e.text}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "סיפור-משפחתי.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-16" dir="rtl">
        <div className="text-6xl mb-4 bounce-in">📖</div>
        <h1 className="text-2xl font-black text-foreground mb-2">סיפור שרשרת</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
          כל אחד מוסיף משפט — ויוצר סיפור משפחתי ביחד!
        </p>

        <div className="space-y-2 w-full max-w-sm mb-4">
          <p className="text-xs font-bold text-muted-foreground">בחרו פתיח:</p>
          {STORY_STARTERS.map((s, i) => (
            <button key={i} onClick={() => startStory(s)}
              className="w-full text-right bg-card border-2 border-muted rounded-xl p-3 text-sm hover:border-primary transition-all bounce-in"
              style={{ animationDelay: `${i * 0.06}s` }}>
              {s}
            </button>
          ))}
          <button onClick={() => startStory()}
            className="w-full text-center bg-muted rounded-xl p-3 text-sm font-bold hover:bg-muted/80 transition-all">
            ✍️ להתחיל מאפס
          </button>
        </div>

        <Button variant="ghost" onClick={onHome} className="mt-4 gap-2">
          <ArrowRight className="w-4 h-4" /> חזרה
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 pt-16" dir="rtl">
      <h2 className="text-lg font-black mb-4">📖 סיפור שרשרת</h2>

      {/* Story entries */}
      <div className="w-full max-w-lg space-y-2 mb-6">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-start gap-2 bg-card rounded-xl p-3 border border-muted bounce-in"
            style={{ animationDelay: `${i * 0.05}s` }}>
            <span className="text-xl shrink-0 mt-0.5">{entry.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-muted-foreground">{entry.author}</p>
              <p className="text-sm text-foreground">{entry.text}</p>
            </div>
            {i > 0 && (
              <button onClick={() => removeEntry(i)} className="p-1 rounded hover:bg-destructive/10 shrink-0">
                <Trash2 className="w-3 h-3 text-destructive/60" />
              </button>
            )}
          </div>
        ))}

        {entries.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">✍️ התחילו לכתוב את הסיפור!</p>
        )}
      </div>

      {/* Add entry */}
      <div className="w-full max-w-lg bg-card rounded-2xl p-4 border-2 border-muted shadow-lg space-y-3">
        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            {AUTHOR_EMOJIS.map(e => (
              <button key={e} onClick={() => setCurrentEmoji(e)}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${currentEmoji === e ? "ring-2 ring-primary bg-primary/10 scale-110" : "hover:bg-muted"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={currentAuthor}
          onChange={e => setCurrentAuthor(e.target.value)}
          placeholder="שם הכותב..."
          className="w-full h-9 rounded-lg border border-muted px-3 text-sm bg-background focus:outline-none focus:border-primary"
        />

        <textarea
          value={currentText}
          onChange={e => setCurrentText(e.target.value)}
          placeholder="המשיכו את הסיפור..."
          rows={3}
          className="w-full rounded-lg border border-muted px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary resize-none"
        />

        <Button onClick={addEntry} disabled={!currentText.trim()} className="w-full rounded-xl gap-2">
          <Plus className="w-4 h-4" /> הוסיפו לסיפור
        </Button>
      </div>

      {/* Actions */}
      {entries.length > 1 && (
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={exportStory} className="gap-1 text-xs rounded-xl">
            <Download className="w-3 h-3" /> שמור סיפור
          </Button>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <Button variant="ghost" size="sm" onClick={() => setStarted(false)} className="gap-1 text-xs">
          <RotateCcw className="w-3 h-3" /> סיפור חדש
        </Button>
        <Button variant="ghost" size="sm" onClick={onHome} className="gap-1 text-xs">
          <Home className="w-3 h-3" /> בית
        </Button>
      </div>
    </div>
  );
}
