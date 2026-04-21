import { useMemo, useState } from "react";
import {
  format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, addYears, subYears,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, getMonth, getDate, parseISO,
} from "date-fns";
import { he } from "date-fns/locale";
import {
  ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft,
  CalendarDays, LayoutGrid, Plus, Send, Moon, BookOpen, Calendar, Rows3,
  Palette,
} from "lucide-react";
import { getHebDayInfo, getHebMonthLabel, toHebrewYear, toHebrewNumeral } from "@/lib/hebrewCalendar";
import { HDate } from "@hebcal/core";
import { CalendarTheme, CALENDAR_THEMES, loadCalendarTheme, saveCalendarTheme } from "@/lib/calendarThemes";

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

interface FamilyEvent {
  id: string;
  device_id: string;
  name: string;
  event_date: string;
  event_type: string;
  emoji: string;
  color: string;
  notes: string | null;
  recurring: boolean;
}

interface Props {
  birthdays: Birthday[];
  familyEvents?: FamilyEvent[];
  accent: string;
  onAddOnDate: (date: Date) => void;
  onSendInvite: (b: Birthday) => void;
  onEdit: (b: Birthday) => void;
  onEditEvent?: (ev: FamilyEvent) => void;
}

type CalMode = "week" | "month" | "year";

const HEBREW_DAYS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

export default function BirthdayCalendarView({ birthdays, familyEvents = [], accent, onAddOnDate, onSendInvite, onEdit, onEditEvent }: Props) {
  const [mode, setMode] = useState<CalMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const [calTheme, setCalTheme] = useState<CalendarTheme>(() => loadCalendarTheme());
  const [showThemePicker, setShowThemePicker] = useState(false);
  const today = new Date();
  const ct = calTheme;

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

  const eventsByDay = useMemo(() => {
    const map = new Map<string, FamilyEvent[]>();
    familyEvents.forEach(ev => {
      const d = parseISO(ev.event_date);
      const key = `${getMonth(d)}-${getDate(d)}`;
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    });
    return map;
  }, [familyEvents]);

  const getBirthdaysForDate = (date: Date) =>
    birthdaysByDay.get(`${date.getMonth()}-${date.getDate()}`) || [];

  const getEventsForDate = (date: Date) =>
    eventsByDay.get(`${date.getMonth()}-${date.getDate()}`) || [];

  // ─── Navigation helpers ───
  const goBack = () => {
    if (mode === "week") setCursor(subWeeks(cursor, 1));
    else if (mode === "month") setCursor(subMonths(cursor, 1));
    else setCursor(subYears(cursor, 1));
  };
  const goForward = () => {
    if (mode === "week") setCursor(addWeeks(cursor, 1));
    else if (mode === "month") setCursor(addMonths(cursor, 1));
    else setCursor(addYears(cursor, 1));
  };
  const goBackBig = () => {
    if (mode === "week") setCursor(subMonths(cursor, 1));
    else if (mode === "month") setCursor(subYears(cursor, 1));
    else setCursor(subYears(cursor, 10));
  };
  const goForwardBig = () => {
    if (mode === "week") setCursor(addMonths(cursor, 1));
    else if (mode === "month") setCursor(addYears(cursor, 1));
    else setCursor(addYears(cursor, 10));
  };

  // ─── Shared day cell renderer ───
  const renderDayCell = (day: Date, inRange: boolean, tall: boolean) => {
    const dayBirthdays = getBirthdaysForDate(day);
    const dayEvents = getEventsForDate(day);
    const heb = getHebDayInfo(day);
    const isToday = isSameDay(day, today);
    const isSat = day.getDay() === 6;
    const hasBirthdays = dayBirthdays.length > 0;
    const hasEvents = dayEvents.length > 0;
    const hasHoliday = heb.holidays.length > 0;
    const hasYomTov = heb.holidays.some(h => h.isYomTov);

    return (
      <button
        key={day.toISOString()}
        onClick={() => onAddOnDate(day)}
        className={`relative p-1.5 border-t border-r border-muted text-right transition-all hover:bg-accent/30 active:scale-[0.97] flex flex-col ${
          tall ? "min-h-[100px] sm:min-h-[110px]" : "min-h-[88px]"
        } ${
          !inRange ? "opacity-30" : ""
        } ${isSat ? ct.satBg : ""} ${hasYomTov ? ct.yomTovBg : ""} ${
          isToday ? `ring-2 ${ct.todayRing} ring-inset ${ct.todayBg} z-10` : ""
        }`}
      >
        {/* Top: dates — Hebrew dominant */}
        <div className="flex items-start justify-between leading-tight">
          <span className={`text-[9px] ${isToday ? ct.todayText : "text-muted-foreground"}`}>
            {format(day, "d")}
          </span>
          <div className="flex flex-col items-end">
            <span className={`text-sm font-black ${isToday ? ct.todayText : ct.hebDateText}`}>
              {heb.hebDay}
            </span>
            {heb.isRoshChodesh && (
              <span className="text-[8px] text-blue-600 flex items-center gap-0.5 font-bold">
                <Moon className="w-2 h-2" /> ר״ח {heb.roshChodeshOf}
              </span>
            )}
          </div>
        </div>

        {/* Holidays */}
        {hasHoliday && (
          <div className="mt-0.5 flex-1">
            {heb.holidays.slice(0, 2).map((h, idx) => (
              <div
                key={idx}
                className={`text-[9px] leading-tight font-bold truncate ${
                  h.isYomTov ? "text-amber-700" : "text-blue-700"
                }`}
                title={h.name}
              >
                {h.emoji} {h.name}
              </div>
            ))}
          </div>
        )}

        {/* Saturday parsha */}
        {isSat && heb.parsha && !hasHoliday && (
          <div className="text-[9px] text-blue-700 font-bold truncate mt-0.5 flex items-center gap-0.5" title={`פרשת ${heb.parsha}`}>
            <BookOpen className="w-2 h-2 shrink-0" />
            <span className="truncate">{heb.parsha}</span>
          </div>
        )}

        {/* Family events */}
        {hasEvents && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {dayEvents.slice(0, 2).map(ev => (
              <span
                key={ev.id}
                onClick={(e) => { e.stopPropagation(); onEditEvent?.(ev); }}
                className="text-[9px] font-bold truncate cursor-pointer hover:underline px-1 py-0.5 rounded"
                style={{ color: ev.color, background: ev.color + "15" }}
                title={ev.name}
              >
                {ev.emoji} {ev.name}
              </span>
            ))}
          </div>
        )}

        {/* Birthdays */}
        {hasBirthdays && (
          <div className="flex flex-wrap gap-0.5 mt-auto justify-end">
            {dayBirthdays.slice(0, 4).map(b => (
              <span
                key={b.id}
                onClick={(e) => { e.stopPropagation(); onEdit(b); }}
                className="text-sm cursor-pointer hover:scale-125 transition-transform"
                style={{ filter: `drop-shadow(0 0 2px ${b.color})` }}
                title={b.name}
              >
                {b.emoji}
              </span>
            ))}
            {dayBirthdays.length > 4 && (
              <span className="text-[9px] font-bold text-muted-foreground">+{dayBirthdays.length - 4}</span>
            )}
          </div>
        )}

        {!hasBirthdays && !hasEvents && !hasHoliday && inRange && (
          <Plus className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground absolute bottom-1 left-1" />
        )}
      </button>
    );
  };

  // ─── WEEK VIEW ───
  const renderWeek = () => {
    const weekStart = startOfWeek(cursor, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(cursor, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className={`${ct.cardBg} rounded-2xl border-2 ${ct.cardBorder} overflow-hidden shadow-sm`}>
        {/* Day headers */}
        <div className={`grid grid-cols-7 ${ct.headerBg}`}>
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className={`text-center py-2 ${isToday ? "bg-yellow-100" : ""}`}
              >
                <div className={`text-[10px] font-bold ${i === 6 ? "text-blue-600" : "text-muted-foreground"}`}>
                  {HEBREW_DAYS[i]}
                </div>
                <div className={`text-sm font-black ${isToday ? ct.todayText : ct.hebDateText}`}>
                  {getHebDayInfo(day).hebDay}
                </div>
                <div className={`text-[9px] ${isToday ? "text-yellow-600" : "text-muted-foreground"}`}>
                  {format(day, "d/M")}
                </div>
              </div>
            );
          })}
        </div>
        {/* Days - tall cells for week view */}
        <div className="grid grid-cols-7">
          {days.map(day => renderDayCell(day, true, true))}
        </div>
      </div>
    );
  };

  // ─── MONTH VIEW ───
  const renderMonth = () => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    return (
      <div className={`${ct.cardBg} rounded-2xl border-2 ${ct.cardBorder} overflow-hidden shadow-sm`}>
        <div className={`grid grid-cols-7 ${ct.headerBg}`}>
          {HEBREW_DAYS.map((d, i) => (
            <div
              key={d}
              className={`text-center py-2 text-xs font-bold ${i === 6 ? "text-blue-600" : "text-muted-foreground"}`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map(day => renderDayCell(day, isSameMonth(day, cursor), false))}
        </div>
      </div>
    );
  };

  // ─── YEAR VIEW ───
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
          const hebMonthMid = getHebMonthLabel(new Date(year, monthDate.getMonth(), 15));

          return (
            <button
              key={monthDate.getMonth()}
              onClick={() => { setCursor(monthDate); setMode("month"); }}
              className="bg-card rounded-xl border-2 border-muted p-2 hover:border-primary hover:shadow-md transition-all active:scale-95 text-right"
            >
              <div className={`text-xs font-bold mb-1 px-2 py-1 rounded ${accent} text-primary-foreground flex items-center justify-between`}>
                <span className="text-[10px] bg-white/20 px-1.5 rounded-full">{monthBirthdays.length}</span>
                <div className="flex flex-col items-end leading-tight">
                  <span>{hebMonthMid}</span>
                  <span className="text-[9px] opacity-70">{format(monthDate, "MMMM", { locale: he })}</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-0">
                {HEBREW_DAYS.map(d => (
                  <div key={d} className="text-[8px] text-center text-muted-foreground py-0.5">{d[0]}</div>
                ))}
                {days.map((day, i) => {
                  const heb = getHebDayInfo(day);
                  const dayBirthdays = getBirthdaysForDate(day);
                  const inMonth = isSameMonth(day, monthDate);
                  const isToday = isSameDay(day, today);
                  const hasB = dayBirthdays.length > 0;
                  const hasH = heb.holidays.length > 0;
                  return (
                    <div
                      key={i}
                      className={`relative aspect-square flex items-center justify-center text-[9px] rounded ${
                        !inMonth ? "opacity-20" : ""
                      } ${isToday ? `${ct.todayBg} ${ct.todayText} font-bold` : ""}`}
                    >
                      {heb.hebDay}
                      {hasB && inMonth && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: dayBirthdays[0].color }} />
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

  // ─── Toolbar title — Hebrew dominant ───
  const getTitle = () => {
    const getHebYearLabel = (d: Date) => toHebrewYear(new HDate(d).getFullYear());
    if (mode === "week") {
      const ws = startOfWeek(cursor, { weekStartsOn: 0 });
      const we = endOfWeek(cursor, { weekStartsOn: 0 });
      const hebStart = getHebDayInfo(ws);
      const hebEnd = getHebDayInfo(we);
      return (
        <>
          <span className={`${ct.toolbarText} font-black`}>
            {hebStart.hebDay} {hebStart.hebMonth}
            {hebStart.hebMonth !== hebEnd.hebMonth ? ` — ${hebEnd.hebDay} ${hebEnd.hebMonth}` : ` — ${hebEnd.hebDay}`}
            {" "}{getHebYearLabel(ws)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {format(ws, "d MMM", { locale: he })} — {format(we, "d MMM yyyy", { locale: he })}
          </span>
        </>
      );
    }
    if (mode === "month") {
      const hebMonthStart = getHebMonthLabel(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
      const hebMonthEnd = getHebMonthLabel(endOfMonth(cursor));
      const hebYr = getHebYearLabel(new Date(cursor.getFullYear(), cursor.getMonth(), 15));
      return (
        <>
          <span className={`${ct.toolbarText} font-black`}>
            {hebMonthStart}{hebMonthStart !== hebMonthEnd ? ` - ${hebMonthEnd}` : ""} {hebYr}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {format(cursor, "MMMM yyyy", { locale: he })}
          </span>
        </>
      );
    }
    const hebYr = getHebYearLabel(new Date(cursor.getFullYear(), 6, 1));
    return (
      <>
        <span className={`${ct.toolbarText} font-black`}>{hebYr}</span>
        <span className="text-[10px] text-muted-foreground">{cursor.getFullYear()}</span>
      </>
    );
  };

  // ─── Today's full info banner ───
  const todayInfo = getHebDayInfo(today);
  const todayBirthdays = getBirthdaysForDate(today);

  return (
    <div className="space-y-3">
      {/* Today banner */}
      <div className={`${ct.bannerBg} rounded-2xl p-3 border-2 ${ct.bannerBorder} flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex items-center gap-3">
          {/* Hebrew — dominant */}
          <div className="bg-white/80 rounded-xl px-4 py-2 text-center shadow-sm">
            <div className="text-[10px] text-muted-foreground leading-none">תאריך עברי</div>
            <div className={`text-2xl font-black ${ct.hebDateText} leading-tight`}>{todayInfo.hebDay}</div>
            <div className={`text-[10px] font-bold ${ct.hebDateText}`}>{todayInfo.hebMonth} {toHebrewYear(new HDate(today).getFullYear())}</div>
          </div>
          {/* Gregorian — secondary */}
          <div className="bg-white/60 rounded-xl px-3 py-2 text-center shadow-sm">
            <div className="text-[10px] text-muted-foreground leading-none">לועזי</div>
            <div className="text-lg font-bold text-foreground/70 leading-tight">{format(today, "d")}</div>
            <div className="text-[10px] text-muted-foreground">{format(today, "MMM yyyy", { locale: he })}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          <div className={`font-bold ${ct.toolbarText}`}>{format(today, "EEEE", { locale: he })}</div>
          {todayInfo.parsha && (
            <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> פרשת {todayInfo.parsha}
            </div>
          )}
          {todayInfo.isRoshChodesh && (
            <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Moon className="w-3 h-3" /> ראש חודש {todayInfo.roshChodeshOf}
            </div>
          )}
          {todayInfo.holidays.map((h, i) => (
            <div key={i} className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              h.isYomTov ? "bg-amber-100 text-amber-800" : "bg-pink-100 text-pink-800"
            }`}>
              {h.emoji} {h.name}
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar — arrows for step + big step (year/decade) */}
      <div className={`flex items-center justify-between gap-2 ${ct.toolbarBg} rounded-2xl p-3 border-2 ${ct.toolbarBorder}`}>
        {/* Right side: navigation arrows (RTL: right = back) */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={goBack}
            className="p-1.5 rounded-lg hover:bg-white/60 active:scale-90 transition-all"
            title={mode === "week" ? "שבוע קודם" : mode === "month" ? "חודש קודם" : "שנה קודמת"}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goBackBig}
            className="p-1.5 rounded-lg hover:bg-white/60 active:scale-90 transition-all"
            title={mode === "week" ? "חודש קודם" : mode === "month" ? "שנה קודמת" : "10 שנים אחורה"}
          >
            <ChevronsRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-white/60 bg-white/40 transition-all"
          >
            היום
          </button>
          <button
            onClick={goForwardBig}
            className="p-1.5 rounded-lg hover:bg-white/60 active:scale-90 transition-all"
            title={mode === "week" ? "חודש קדימה" : mode === "month" ? "שנה קדימה" : "10 שנים קדימה"}
          >
            <ChevronsLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={goForward}
            className="p-1.5 rounded-lg hover:bg-white/60 active:scale-90 transition-all"
            title={mode === "week" ? "שבוע הבא" : mode === "month" ? "חודש הבא" : "שנה הבאה"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Center: title */}
        <h3 className="text-sm font-black text-purple-800 flex-1 text-center flex flex-col leading-tight">
          {getTitle()}
        </h3>

        {/* Left side: mode toggles */}
        <div className="flex gap-0.5 bg-white/60 rounded-lg p-0.5">
          <button
            onClick={() => setMode("week")}
            className={`p-1.5 rounded transition-all ${mode === "week" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-white/80"}`}
            title="שבוע"
          >
            <Rows3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMode("month")}
            className={`p-1.5 rounded transition-all ${mode === "month" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-white/80"}`}
            title="חודש"
          >
            <CalendarDays className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMode("year")}
            className={`p-1.5 rounded transition-all ${mode === "year" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-white/80"}`}
            title="שנה"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground px-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400" />יום הולדת</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />אירוע משפחתי</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-100 border border-amber-400" />יום טוב</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-50 border border-blue-300" />שבת</span>
        <span className="flex items-center gap-1"><Moon className="w-2.5 h-2.5 text-blue-600" />ראש חודש</span>
        <span className="flex items-center gap-1"><BookOpen className="w-2.5 h-2.5 text-blue-700" />פרשת השבוע</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-300" />היום</span>
      </div>

      {/* Calendar view */}
      {mode === "week" ? renderWeek() : mode === "month" ? renderMonth() : renderYear()}

      {/* Today's birthdays */}
      {todayBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-3 border-2 border-yellow-200 space-y-2">
          <div className="text-xs font-bold text-orange-700">🎉 יום הולדת היום:</div>
          {todayBirthdays.map(b => (
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
        </div>
      )}
    </div>
  );
}
