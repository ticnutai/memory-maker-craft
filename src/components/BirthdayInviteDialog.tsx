import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { X, Download, MessageCircle, Mail, Sparkles } from "lucide-react";
import { format, parseISO, getMonth, getDate, addYears, isBefore } from "date-fns";
import { he } from "date-fns/locale";

interface Birthday {
  id: string;
  device_id: string;
  name: string;
  birth_date: string;
  emoji: string;
  color: string;
  relation: string;
  notes?: string | null;
}

interface Props {
  birthday: Birthday;
  onClose: () => void;
}

type Template = "festive" | "elegant" | "kids";

const TEMPLATES: { id: Template; label: string; emoji: string }[] = [
  { id: "festive", label: "חגיגי", emoji: "🎉" },
  { id: "elegant", label: "אלגנטי", emoji: "✨" },
  { id: "kids", label: "ילדותי", emoji: "🎈" },
];

function getNextBirthday(birthDate: string): Date {
  const bd = parseISO(birthDate);
  const today = new Date();
  let next = new Date(today.getFullYear(), getMonth(bd), getDate(bd));
  if (isBefore(next, today)) next = addYears(next, 1);
  return next;
}

function getNextAge(birthDate: string): number {
  const bd = parseISO(birthDate);
  const next = getNextBirthday(birthDate);
  return next.getFullYear() - bd.getFullYear();
}

export default function BirthdayInviteDialog({ birthday, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<Template>("festive");
  const [customMessage, setCustomMessage] = useState(
    `מוזמנים לחגוג איתנו את יום הולדתו של ${birthday.name}! 🎂\nנשמח לראותכם!`
  );
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("17:00");
  const [downloading, setDownloading] = useState(false);

  const nextDate = getNextBirthday(birthday.birth_date);
  const nextAge = getNextAge(birthday.birth_date);

  const buildShareText = () => {
    const dateStr = format(nextDate, "EEEE, d בMMMM", { locale: he });
    return `${birthday.emoji} הזמנה ליום הולדת ${nextAge} של ${birthday.name}!\n\n📅 ${dateStr}\n🕐 ${time}${location ? `\n📍 ${location}` : ""}\n\n${customMessage}`;
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`🎂 הזמנה ליום הולדת ${nextAge} של ${birthday.name}`);
    const body = encodeURIComponent(buildShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `הזמנה-${birthday.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    }
    setDownloading(false);
  };

  // ─── Templates ───
  const renderCard = () => {
    const dateStr = format(nextDate, "d בMMMM yyyy", { locale: he });
    const dayStr = format(nextDate, "EEEE", { locale: he });

    if (template === "elegant") {
      return (
        <div
          ref={cardRef}
          className="aspect-[3/4] w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center relative"
          style={{ background: `linear-gradient(135deg, ${birthday.color}15, white, ${birthday.color}25)` }}
        >
          <div className="absolute top-4 left-4 right-4 h-px" style={{ background: birthday.color }} />
          <div className="absolute bottom-4 left-4 right-4 h-px" style={{ background: birthday.color }} />
          <Sparkles className="w-6 h-6 mb-2" style={{ color: birthday.color }} />
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: birthday.color }}>You're Invited</p>
          <h2 className="text-3xl font-serif font-bold mb-1 text-foreground">{birthday.name}</h2>
          <p className="text-xs text-muted-foreground mb-4">חוגג/ת {nextAge} שנים</p>
          <div className="w-12 h-px mb-4" style={{ background: birthday.color }} />
          <p className="text-sm font-bold text-foreground">{dayStr}</p>
          <p className="text-xs text-muted-foreground">{dateStr}</p>
          <p className="text-xs text-muted-foreground mt-1">בשעה {time}</p>
          {location && <p className="text-xs mt-2" style={{ color: birthday.color }}>📍 {location}</p>}
          <p className="text-[10px] text-muted-foreground mt-4 max-w-[80%] whitespace-pre-line">{customMessage}</p>
        </div>
      );
    }

    if (template === "kids") {
      return (
        <div
          ref={cardRef}
          className="aspect-[3/4] w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center relative"
          style={{ background: `radial-gradient(circle at top, ${birthday.color}40, ${birthday.color}10)` }}
        >
          <div className="absolute top-2 right-2 text-3xl">🎈</div>
          <div className="absolute top-4 left-4 text-2xl">🎁</div>
          <div className="absolute bottom-4 right-6 text-2xl">🧁</div>
          <div className="absolute bottom-2 left-2 text-3xl">🎊</div>
          <div className="text-6xl mb-2 animate-bounce">{birthday.emoji}</div>
          <h2 className="text-2xl font-black mb-1" style={{ color: birthday.color }}>יום הולדת {nextAge}!</h2>
          <p className="text-xl font-black text-foreground mb-3">{birthday.name}</p>
          <div className="bg-white/80 rounded-xl p-3 shadow-md">
            <p className="text-sm font-bold text-foreground">📅 {dateStr}</p>
            <p className="text-xs text-muted-foreground">🕐 {time}</p>
            {location && <p className="text-xs text-foreground mt-1">📍 {location}</p>}
          </div>
          <p className="text-[11px] mt-3 max-w-[85%] whitespace-pre-line text-foreground/80">{customMessage}</p>
        </div>
      );
    }

    // festive
    return (
      <div
        ref={cardRef}
        className="aspect-[3/4] w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center relative text-white"
        style={{ background: `linear-gradient(135deg, ${birthday.color}, ${birthday.color}dd 50%, ${birthday.color}aa)` }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)`, backgroundSize: "30px 30px" }} />
        <div className="text-5xl mb-3">{birthday.emoji}</div>
        <p className="text-xs uppercase tracking-widest opacity-90 mb-1">הזמנה</p>
        <h2 className="text-3xl font-black mb-1 drop-shadow-md">{birthday.name}</h2>
        <p className="text-lg font-bold mb-4">חוגג/ת {nextAge}! 🎉</p>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
          <p className="text-sm font-bold">{dayStr}</p>
          <p className="text-xs opacity-90">{dateStr} • {time}</p>
          {location && <p className="text-xs mt-1 font-bold">📍 {location}</p>}
        </div>
        <p className="text-[11px] mt-3 max-w-[85%] whitespace-pre-line opacity-95">{customMessage}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card rounded-3xl max-w-2xl w-full my-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h3 className="font-black text-base flex items-center gap-2">
            <span className="text-xl">{birthday.emoji}</span>
            הזמנה ליום הולדת {birthday.name}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 p-4">
          {/* Preview */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-muted-foreground">תצוגה מקדימה</div>
            <div className="bg-muted/30 rounded-2xl p-3">
              {renderCard()}
            </div>
          </div>

          {/* Editor */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">סגנון</label>
              <div className="grid grid-cols-3 gap-1 bg-muted rounded-xl p-1">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                      template === t.id ? "bg-white shadow-md" : "text-muted-foreground"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">שעה</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-muted bg-background text-sm focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">מקום</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="כתובת..."
                  dir="rtl"
                  className="w-full px-3 py-2 rounded-xl border-2 border-muted bg-background text-sm focus:border-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">הודעה</label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                rows={4}
                dir="rtl"
                maxLength={200}
                className="w-full px-3 py-2 rounded-xl border-2 border-muted bg-background text-sm focus:border-primary outline-none resize-none"
              />
              <div className="text-[10px] text-muted-foreground text-left">{customMessage.length}/200</div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-bold text-sm active:scale-95 hover:bg-green-600"
              >
                <MessageCircle className="w-4 h-4" /> שלח ב-WhatsApp
              </button>
              <button
                onClick={handleEmail}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm active:scale-95 hover:bg-blue-600"
              >
                <Mail className="w-4 h-4" /> שלח באימייל
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground text-background font-bold text-sm active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> {downloading ? "מוריד..." : "הורד תמונה"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
