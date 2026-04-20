import { useMemo, useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, getMonth, getDate, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { ChevronRight, ChevronLeft, CalendarDays, LayoutGrid, Plus, Send } from "lucide-react";

interface Birthday {
  id: string;
  device_id: string;
  name: string;
  birth_date: string;
  emoji: string;
  color: string;
  relation: string;
  notes: string | null;
}

interface JewishHoliday {
  name: string;
  emoji: string;
  hebrewDate: string;
  getApproxDate: (year: number) => Date | null;
}

interface Props {
  birthdays: Birthday[];
  holidays: JewishHoliday[];
  accent: string;
  onAddOnDate: (date: Date) => void;
  onSendInvite: (b: Birthday) => void;
  onEdit: (b: Birthday) => void;
}

type CalMode = "month" | "year";

const HEBREW_DAYS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

function getHebrewDay(date: Date): string {
  try {
    return new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric" }).format(date);
  } catch { return ""; }
}

export default function BirthdayCalendarView({ birthdays, holidays, accent, onAddOnDate, onSendInvite, onEdit }: Props) {
  const [mode, setMode] = useState<CalMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const today = new Date();

  const birthdaysByDay = useMemo(() => {
    const map = new Map<string, Birthday[]>();
    birthdays.forEach(b => {
      const d = parseISO(b.birth_date);
      const key = `${getMonth(d)}-${getDate(d)}`;
      const arr = map.get(key) || [];
      arr.push(b);
      map.set(key, arr);
    });
    return map;
  }, [birthdays]);

  const holidaysByDay = useMemo(() => {
    const year = cursor.getFullYear();
    const map = new Map<string, JewishHoliday[]>();
    holidays.forEach(h => {
      const d = h.getApproxDate(year);
      if (!d) return;
      const key = `${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) || [];
      arr.push(h);
      map.set(key, arr);
    });
    return map;
  }, [holidays, cursor]);

  const getEventsForDate = (date: Date) => {
    const key = `${date.getMonth()}-${date.getDate()}`;
    return {
      birthdays: birthdaysByDay.get(key) || [],
      holidays: holidaysByDay.get(key) || [],
    };
  };

  // ─── MONTH VIEW ───
  const renderMonth = () => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    return (
      <div className="bg-card rounded-2xl border-2 border-muted overflow-hidden shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {HEBREW_DAYS.map(d => (
            <div key={d} className="text-center py-2 text-xs font-bold text-muted-foreground">{d}</div>
          ))}
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const events = getEventsForDate(day);
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, today);
            const hasEvents = events.birthdays.length > 0 || events.holidays.length > 0;
            const heDay = getHebrewDay(day);

            return (
              <button
                key={i}
                onClick={() => onAddOnDate(day)}
                className={`relative min-h-[64px] p-1 border-t border-r border-muted text-right transition-all hover:bg-accent/30 active:scale-95 ${
                  !inMonth ? "opacity-30" : ""
                } ${isToday ? "bg-yellow-50 ring-2 ring-yellow-400 ring-inset z-10" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[9px] ${isToday ? "text-yellow-700 font-bold" : "text-purple-400"}`}>{heDay}</span>
                  <span className={`text-xs font-bold ${isToday ? "text-yellow-700" : "text-foreground"}`}>{format(day, "d")}</span>
                </div>
                {hasEvents && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5 justify-end">
                    {events.holidays.slice(0, 2).map((h, idx) => (
                      <span key={`h-${idx}`} className="text-[10px]" title={h.name}>{h.emoji}</span>
                    ))}
                    {events.birthdays.slice(0, 3).map(b => (
                      <span
                        key={b.id}
                        onClick={(e) => { e.stopPropagation(); onEdit(b); }}
                        className="text-[11px] cursor-pointer hover:scale-125 transition-transform"
                        style={{ filter: `drop-shadow(0 0 2px ${b.color})` }}
                        title={b.name}
                      >
                        {b.emoji}
                      </span>
                    ))}
                  </div>
                )}
                {!hasEvents && inMonth && (
                  <Plus className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground absolute bottom-1 left-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── YEAR VIEW (mini-calendars) ───
  const renderYear = () => {
    const year = cursor.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {months.map(monthDate => {
          const mStart = startOfMonth(monthDate);
          const mEnd = endOfMonth(monthDate);
          const gStart = startOfWeek(mStart, { weekStartsOn: 0 });
          const gEnd = endOfWeek(mEnd, { weekStartsOn: 0 });
          const days = eachDayOfInterval({ start: gStart, end: gEnd });
          const monthBirthdays = birthdays.filter(b => getMonth(parseISO(b.birth_date)) === monthDate.getMonth());

          return (
            <button
              key={monthDate.getMonth()}
              onClick={() => { setCursor(monthDate); setMode("month"); }}
              className="bg-card rounded-xl border-2 border-muted p-2 hover:border-primary hover:shadow-md transition-all active:scale-95 text-right"
            >
              <div className={`text-xs font-bold mb-1 px-1 py-0.5 rounded ${accent} text-primary-foreground flex items-center justify-between`}>
                <span className="text-[10px] bg-white/20 px-1.5 rounded-full">{monthBirthdays.length}</span>
                <span>{format(monthDate, "MMMM", { locale: he })}</span>
              </div>
              <div className="grid grid-cols-7 gap-0">
                {HEBREW_DAYS.map(d => (
                  <div key={d} className="text-[8px] text-center text-muted-foreground py-0.5">{d[0]}</div>
                ))}
                {days.map((day, i) => {
                  const events = getEventsForDate(day);
                  const inMonth = isSameMonth(day, monthDate);
                  const isToday = isSameDay(day, today);
                  const hasB = events.birthdays.length > 0;
                  const hasH = events.holidays.length > 0;
                  return (
                    <div
                      key={i}
                      className={`relative aspect-square flex items-center justify-center text-[9px] rounded ${
                        !inMonth ? "opacity-20" : ""
                      } ${isToday ? "bg-yellow-300 text-yellow-900 font-bold" : ""}`}
                    >
                      {format(day, "d")}
                      {hasB && inMonth && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: events.birthdays[0].color }} />
                      )}
                      {hasH && inMonth && !hasB && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-3 border-2 border-pink-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(mode === "month" ? subMonths(cursor, 1) : new Date(cursor.getFullYear() - 1, 0, 1))}
            className="p-1.5 rounded-lg hover:bg-white/60 active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/60"
          >
            היום
          </button>
          <button
            onClick={() => setCursor(mode === "month" ? addMonths(cursor, 1) : new Date(cursor.getFullYear() + 1, 0, 1))}
            className="p-1.5 rounded-lg hover:bg-white/60 active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-sm font-black text-purple-800 flex-1 text-center">
          {mode === "month"
            ? format(cursor, "MMMM yyyy", { locale: he })
            : cursor.getFullYear()}
        </h3>

        <div className="flex gap-1 bg-white/60 rounded-lg p-0.5">
          <button
            onClick={() => setMode("month")}
            className={`p-1.5 rounded ${mode === "month" ? `${accent} text-primary-foreground` : "text-muted-foreground"}`}
            title="חודש"
          >
            <CalendarDays className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMode("year")}
            className={`p-1.5 rounded ${mode === "year" ? `${accent} text-primary-foreground` : "text-muted-foreground"}`}
            title="שנה"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground px-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400" />יום הולדת</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />חג</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-300" />היום</span>
        <span className="flex items-center gap-1"><Plus className="w-2.5 h-2.5" />לחיצה ליום ריק = הוספה</span>
      </div>

      {/* Calendar */}
      {mode === "month" ? renderMonth() : renderYear()}

      {/* Today's events quick-actions */}
      {(() => {
        const todayEvents = getEventsForDate(today);
        if (todayEvents.birthdays.length === 0 && todayEvents.holidays.length === 0) return null;
        return (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-3 border-2 border-yellow-200 space-y-2">
            <div className="text-xs font-bold text-orange-700">🎉 היום:</div>
            {todayEvents.birthdays.map(b => (
              <div key={b.id} className="flex items-center gap-2 text-sm bg-white/70 rounded-lg p-2">
                <span className="text-xl">{b.emoji}</span>
                <span className="font-bold flex-1">{b.name}</span>
                <button
                  onClick={() => onSendInvite(b)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-bold active:scale-95"
                  style={{ background: b.color }}
                >
                  <Send className="w-3 h-3" /> שלח הזמנה
                </button>
              </div>
            ))}
            {todayEvents.holidays.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-white/70 rounded-lg p-2">
                <span className="text-xl">{h.emoji}</span>
                <span className="font-bold flex-1">{h.name}</span>
                <span className="text-xs text-muted-foreground">{h.hebrewDate}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
