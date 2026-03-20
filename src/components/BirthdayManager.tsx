import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Heart, Plus, Trash2, Edit2, X, ExternalLink, PartyPopper, Clock } from "lucide-react";
import { format, differenceInDays, addYears, isBefore, parseISO, getMonth, getDate } from "date-fns";
import { he } from "date-fns/locale";

interface Birthday {
  id: string;
  device_id: string;
  name: string;
  birth_date: string;
  relation: string;
  emoji: string;
  notes: string | null;
  color: string;
}

const RELATIONS = [
  { label: "אמא", emoji: "👩" },
  { label: "אבא", emoji: "👨" },
  { label: "אח", emoji: "👦" },
  { label: "אחות", emoji: "👧" },
  { label: "סבא", emoji: "👴" },
  { label: "סבתא", emoji: "👵" },
  { label: "דוד", emoji: "👨" },
  { label: "דודה", emoji: "👩" },
  { label: "בן/בת דוד", emoji: "🧒" },
  { label: "חבר/ה", emoji: "🧑" },
  { label: "משפחה", emoji: "👪" },
  { label: "אחר", emoji: "🎂" },
];

const BIRTHDAY_EMOJIS = ["🎂", "🎈", "🎁", "🎉", "🧁", "🎊", "👑", "⭐", "💖", "🌟", "🦄", "🎀"];

const COLORS = ["#f472b6", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#a78bfa", "#f87171", "#38bdf8"];

function getDeviceId(): string {
  const key = "memory-game-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function getDaysUntilBirthday(birthDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bd = parseISO(birthDate);
  let next = new Date(today.getFullYear(), getMonth(bd), getDate(bd));
  if (isBefore(next, today)) {
    next = addYears(next, 1);
  }
  return differenceInDays(next, today);
}

function getAge(birthDate: string): number {
  const bd = parseISO(birthDate);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

function generateGoogleCalendarUrl(b: Birthday): string {
  const bd = parseISO(b.birth_date);
  const thisYear = new Date().getFullYear();
  let nextBd = new Date(thisYear, getMonth(bd), getDate(bd));
  if (isBefore(nextBd, new Date())) nextBd = addYears(nextBd, 1);

  const dateStr = format(nextBd, "yyyyMMdd");
  const endDate = format(addYears(nextBd, 0), "yyyyMMdd"); // all-day event
  const title = encodeURIComponent(`🎂 יום הולדת - ${b.name} ${b.emoji}`);
  const details = encodeURIComponent(b.notes || `יום הולדת של ${b.name}!`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&recur=RRULE:FREQ=YEARLY`;
}

type ViewMode = "cards" | "calendar" | "timeline";

interface BirthdayManagerProps {
  theme: "girl" | "boy";
}

export default function BirthdayManager({ theme }: BirthdayManagerProps) {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formRelation, setFormRelation] = useState("משפחה");
  const [formEmoji, setFormEmoji] = useState("🎂");
  const [formNotes, setFormNotes] = useState("");
  const [formColor, setFormColor] = useState("#f472b6");

  const deviceId = getDeviceId();
  const accent = theme === "girl" ? "bg-game-pink" : "bg-game-blue";
  const accentText = theme === "girl" ? "text-game-pink" : "text-game-blue";

  const loadBirthdays = useCallback(async () => {
    const { data } = await supabase
      .from("birthdays")
      .select("*")
      .eq("device_id", deviceId)
      .order("birth_date", { ascending: true });
    if (data) setBirthdays(data as Birthday[]);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => { loadBirthdays(); }, [loadBirthdays]);

  const resetForm = () => {
    setFormName(""); setFormDate(""); setFormRelation("משפחה");
    setFormEmoji("🎂"); setFormNotes(""); setFormColor("#f472b6");
    setEditId(null); setShowForm(false);
  };

  const editBirthday = (b: Birthday) => {
    setFormName(b.name); setFormDate(b.birth_date); setFormRelation(b.relation);
    setFormEmoji(b.emoji); setFormNotes(b.notes || ""); setFormColor(b.color);
    setEditId(b.id); setShowForm(true);
  };

  const saveBirthday = async () => {
    if (!formName || !formDate) return;
    const payload = {
      device_id: deviceId,
      name: formName,
      birth_date: formDate,
      relation: formRelation,
      emoji: formEmoji,
      notes: formNotes || null,
      color: formColor,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      await supabase.from("birthdays").update(payload).eq("id", editId);
    } else {
      await supabase.from("birthdays").insert(payload);
    }
    resetForm();
    loadBirthdays();
  };

  const deleteBirthday = async (id: string) => {
    await supabase.from("birthdays").delete().eq("id", id);
    loadBirthdays();
  };

  // Sort by upcoming
  const sorted = [...birthdays].sort((a, b) => getDaysUntilBirthday(a.birth_date) - getDaysUntilBirthday(b.birth_date));
  const upcoming = sorted.filter(b => getDaysUntilBirthday(b.birth_date) <= 30);

  // Calendar data — group by month
  const monthGroups = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    label: format(new Date(2024, i, 1), "MMMM", { locale: he }),
    birthdays: birthdays.filter(b => getMonth(parseISO(b.birth_date)) === i)
      .sort((a, b) => getDate(parseISO(a.birth_date)) - getDate(parseISO(b.birth_date))),
  }));

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin text-2xl">🎂</div></div>;

  return (
    <div className="space-y-4">
      {/* Upcoming reminders banner */}
      {upcoming.length > 0 && (
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-4 border-2 border-pink-200 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-pink-700">
            <Clock className="w-4 h-4" />
            <span>🎉 ימי הולדת קרובים!</span>
          </div>
          {upcoming.map(b => {
            const days = getDaysUntilBirthday(b.birth_date);
            return (
              <div key={b.id} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{b.emoji}</span>
                <span className="font-bold">{b.name}</span>
                <span className="text-pink-600">
                  {days === 0 ? "🎂 היום!" : days === 1 ? "מחר!" : `עוד ${days} ימים`}
                </span>
                <span className="text-muted-foreground text-xs">
                  (ימלא {getAge(b.birth_date) + (days === 0 ? 0 : 1)})
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* View mode tabs + add button */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1 bg-muted rounded-xl p-1">
          {[
            { id: "cards" as ViewMode, icon: <Gift className="w-4 h-4" />, label: "כרטיסים" },
            { id: "calendar" as ViewMode, icon: <Calendar className="w-4 h-4" />, label: "יומן" },
            { id: "timeline" as ViewMode, icon: <Heart className="w-4 h-4" />, label: "ציר זמן" },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                viewMode === v.id ? `${accent} text-primary-foreground shadow-md` : "text-muted-foreground"
              }`}
            >
              {v.icon}{v.label}
            </button>
          ))}
        </div>
        <Button
          variant={theme === "girl" ? "game-pink" : "game-blue"}
          size="sm"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-xl"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-card rounded-2xl p-5 border-2 border-muted shadow-lg space-y-4 bounce-in">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">{editId ? "✏️ עריכת יום הולדת" : "🎂 הוספת יום הולדת"}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-muted-foreground mb-1 block">שם</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="שם בן המשפחה..."
                className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-pink-300"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">תאריך לידה</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-pink-300"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">קרבה</label>
              <select
                value={formRelation}
                onChange={e => setFormRelation(e.target.value)}
                className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-pink-300 bg-card"
                dir="rtl"
              >
                {RELATIONS.map(r => (
                  <option key={r.label} value={r.label}>{r.emoji} {r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Emoji picker */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">אימוג׳י</label>
            <div className="flex flex-wrap gap-2">
              {BIRTHDAY_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setFormEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all active:scale-90 ${
                    formEmoji === e ? "ring-2 ring-pink-400 bg-pink-50 scale-110" : "bg-muted hover:scale-105"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">צבע</label>
            <div className="flex gap-2 items-center">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setFormColor(c)}
                  className={`w-7 h-7 rounded-full transition-all active:scale-90 ${
                    formColor === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/40 cursor-pointer">
                <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="w-full h-full flex items-center justify-center text-[10px]">🎨</div>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">הערות</label>
            <input
              type="text"
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              placeholder="מתנה שאוהב, תחביבים..."
              className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-pink-300"
              dir="rtl"
            />
          </div>

          <Button
            variant={theme === "girl" ? "game-pink" : "game-blue"}
            className="w-full rounded-xl"
            onClick={saveBirthday}
            disabled={!formName || !formDate}
          >
            {editId ? "💾 שמירה" : "🎂 הוספה"}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {birthdays.length === 0 && !showForm && (
        <div className="bg-card rounded-2xl p-8 text-center border-2 border-dashed border-muted space-y-3">
          <div className="text-5xl bounce-in">🎂</div>
          <p className="font-bold text-foreground">אין עדיין ימי הולדת</p>
          <p className="text-sm text-muted-foreground">הוסיפו ימי הולדת של בני המשפחה!</p>
          <Button variant={theme === "girl" ? "game-pink" : "game-blue"} onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> הוספת יום הולדת
          </Button>
        </div>
      )}

      {/* ═══ CARDS VIEW ═══ */}
      {viewMode === "cards" && birthdays.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {sorted.map((b, i) => {
            const days = getDaysUntilBirthday(b.birth_date);
            const age = getAge(b.birth_date);
            const isToday = days === 0;
            return (
              <div
                key={b.id}
                className={`relative rounded-2xl p-4 shadow-lg border-2 transition-all hover:scale-[1.01] bounce-in overflow-hidden ${
                  isToday ? "ring-2 ring-yellow-400 shadow-yellow-200" : ""
                }`}
                style={{
                  animationDelay: `${i * 0.06}s`,
                  borderColor: b.color,
                  background: `linear-gradient(135deg, ${b.color}15, ${b.color}08)`,
                }}
              >
                {/* Floating hearts */}
                <div className="absolute top-2 left-2 flex gap-1 opacity-30">
                  {[...Array(3)].map((_, j) => (
                    <span key={j} className="text-xs" style={{ color: b.color, animation: `floatBg ${4 + j}s ease-in-out ${j * 0.5}s infinite alternate` }}>💖</span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-md shrink-0"
                    style={{ backgroundColor: b.color + "25", border: `2px solid ${b.color}` }}
                  >
                    {b.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm truncate">{b.name}</h3>
                      {isToday && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold animate-pulse">🎂 היום!</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {RELATIONS.find(r => r.label === b.relation)?.emoji} {b.relation} • גיל {age}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: b.color }}>
                      {isToday ? "🎉 יום הולדת שמח!" : `עוד ${days} ימים • ${format(parseISO(b.birth_date), "d בMMMM", { locale: he })}`}
                    </p>
                    {b.notes && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">📝 {b.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => editBirthday(b)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-all active:scale-90">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <a href={generateGoogleCalendarUrl(b)} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-all active:scale-90" title="הוספה ליומן גוגל">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                    <button onClick={() => deleteBirthday(b.id)} className="p-1.5 rounded-lg bg-muted hover:bg-destructive/10 transition-all active:scale-90">
                      <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CALENDAR VIEW ═══ */}
      {viewMode === "calendar" && (
        <div className="space-y-3">
          {monthGroups.map(mg => (
            <div key={mg.month} className={`rounded-2xl overflow-hidden border-2 border-muted ${mg.birthdays.length > 0 ? "" : "opacity-50"}`}>
              <div className={`px-4 py-2 ${accent} text-primary-foreground font-bold text-sm flex items-center gap-2`}>
                <Calendar className="w-4 h-4" />
                {mg.label}
                {mg.birthdays.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{mg.birthdays.length}</span>
                )}
              </div>
              {mg.birthdays.length > 0 ? (
                <div className="divide-y divide-muted">
                  {mg.birthdays.map(b => {
                    const days = getDaysUntilBirthday(b.birth_date);
                    return (
                      <div key={b.id} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
                        <span className="text-lg">{b.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm">{b.name}</span>
                          <span className="text-xs text-muted-foreground mr-2">
                            {format(parseISO(b.birth_date), "d/M")} • {b.relation}
                          </span>
                        </div>
                        <span className="text-xs font-bold shrink-0" style={{ color: b.color }}>
                          {days === 0 ? "🎂 היום!" : `${days} ימים`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-3 bg-card text-xs text-muted-foreground text-center">
                  אין ימי הולדת בחודש זה
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ TIMELINE VIEW ═══ */}
      {viewMode === "timeline" && birthdays.length > 0 && (
        <div className="relative pr-6">
          {/* Vertical line */}
          <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-purple-300 to-blue-300 rounded-full" />

          <div className="space-y-4">
            {sorted.map((b, i) => {
              const days = getDaysUntilBirthday(b.birth_date);
              const isToday = days === 0;
              return (
                <div key={b.id} className="relative bounce-in" style={{ animationDelay: `${i * 0.08}s` }}>
                  {/* Dot on timeline */}
                  <div
                    className="absolute -right-[22px] top-4 w-5 h-5 rounded-full border-3 border-card shadow-md flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: b.color }}
                  >
                    💖
                  </div>

                  <div
                    className={`mr-4 rounded-2xl p-4 shadow-md border-2 ${isToday ? "ring-2 ring-yellow-400" : ""}`}
                    style={{ borderColor: b.color + "60", background: `linear-gradient(135deg, ${b.color}10, white)` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{b.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-black text-sm">{b.name}</h3>
                        <p className="text-xs text-muted-foreground">{b.relation} • גיל {getAge(b.birth_date)}</p>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="text-lg font-black" style={{ color: b.color }}>
                          {isToday ? "🎉" : days}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{isToday ? "היום!" : "ימים"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        📅 {format(parseISO(b.birth_date), "d בMMMM yyyy", { locale: he })}
                      </span>
                      <a href={generateGoogleCalendarUrl(b)} target="_blank" rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 hover:underline" style={{ color: b.color }}>
                        <ExternalLink className="w-3 h-3" /> יומן
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
