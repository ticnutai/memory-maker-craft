import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, addYears, isBefore, parseISO, format } from "date-fns";
import { he } from "date-fns/locale";
import { HDate } from "@hebcal/core";
import { toHebrewNumeral } from "@/lib/hebrewCalendar";
import { getDeviceId } from "@/lib/deviceId";
import { HEARTS_CONFIG_UPDATED_EVENT, loadHeartsConfig, HeartsDisplayStyle } from "@/lib/heartsDisplayConfig";

const HEB_MONTH_NAMES: Record<string, string> = {
  Nisan: "ניסן", Iyyar: "אייר", Sivan: "סיון", Tamuz: "תמוז",
  Av: "אב", Elul: "אלול", Tishrei: "תשרי", Cheshvan: "חשון",
  Kislev: "כסלו", Tevet: "טבת", "Sh'vat": "שבט", Adar: "אדר",
  "Adar I": "אדר א׳", "Adar II": "אדר ב׳",
};

function hebrewDateLabel(gregDate: Date): string {
  try {
    const hd = new HDate(gregDate);
    const day = toHebrewNumeral(hd.getDate());
    const monthEn = hd.getMonthName();
    const month = HEB_MONTH_NAMES[monthEn] ?? monthEn;
    return `${day} ${month}`;
  } catch {
    return "";
  }
}

const EVENT_TYPE_INFO: Record<string, { emoji: string; label: string }> = {
  birthday: { emoji: "🎂", label: "יום הולדת" },
  anniversary: { emoji: "💍", label: "יום נישואין" },
  bar_mitzvah: { emoji: "📜", label: "בר/בת מצווה" },
  memorial: { emoji: "🕯️", label: "יום זיכרון" },
  graduation: { emoji: "🎓", label: "סיום לימודים" },
  military: { emoji: "🎖️", label: "גיוס/שחרור" },
  aliyah: { emoji: "✈️", label: "יום עלייה" },
  holiday: { emoji: "🎉", label: "חג" },
  custom: { emoji: "📅", label: "אירוע" },
  other: { emoji: "📅", label: "אירוע" },
};

interface UpcomingItem {
  name: string;
  emoji: string;
  color: string;
  daysUntil: number;
  date: Date;
  hebDate: string;
  eventType: string;
  eventLabel: string;
}

function getNextOccurrence(dateStr: string): { date: Date; daysUntil: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bd = parseISO(dateStr);
  let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if (isBefore(next, today) && differenceInDays(today, next) > 0) {
    next = addYears(next, 1);
  }
  return { date: next, daysUntil: differenceInDays(next, today) };
}

function daysLabel(d: number) {
  if (d === 0) return "🎉 היום!";
  if (d === 1) return "מחר!";
  return `עוד ${d} ימים`;
}

function shortDisplayName(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "אירוע";
  if (trimmed.length <= 20) return trimmed;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const twoWords = `${words[0]} ${words[1]}`;
    if (twoWords.length <= 20) return twoWords;
  }
  return `${trimmed.slice(0, 19)}…`;
}

export default function BirthdayHearts({ isDark, familyDeviceIds }: { isDark?: boolean; familyDeviceIds?: string[] }) {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [displayStyle, setDisplayStyle] = useState<HeartsDisplayStyle>("hearts");
  const [floatAnim, setFloatAnim] = useState(true);
  const [floatSizeScale, setFloatSizeScale] = useState(1);
  const [floatSpeedScale, setFloatSpeedScale] = useState(1);
  const [floatDensityScale, setFloatDensityScale] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    const applyConfig = () => {
      const config = loadHeartsConfig();
      if (!config.enabled) { setItems([]); return; }
      setDisplayStyle(config.displayStyle);
      setFloatAnim(config.floatAnimation);
      setFloatSizeScale(Math.min(2, Math.max(0.5, config.floatSizeScale || 1)));
      setFloatSpeedScale(Math.min(2.5, Math.max(0.4, config.floatSpeedScale || 1)));
      setFloatDensityScale(Math.min(2.5, Math.max(0.4, config.floatDensityScale || 1)));
      setReducedMotion(!!config.reducedMotion);
    };

    const config = applyConfig();
    const onCfgUpdated = () => applyConfig();
    window.addEventListener(HEARTS_CONFIG_UPDATED_EVENT, onCfgUpdated);

    if (!config || !config.enabled) return () => window.removeEventListener(HEARTS_CONFIG_UPDATED_EVENT, onCfgUpdated);

    const deviceId = getDeviceId();
    if (!deviceId) return () => window.removeEventListener(HEARTS_CONFIG_UPDATED_EVENT, onCfgUpdated);
    const queryIds = familyDeviceIds && familyDeviceIds.length > 0 ? familyDeviceIds : [deviceId];

    (async () => {
      const [{ data: birthdays }, { data: events }] = await Promise.all([
        supabase.from("birthdays").select("name, birth_date, emoji, color").in("device_id", queryIds),
        supabase.from("family_events").select("name, event_date, emoji, color, event_type, recurring").in("device_id", queryIds),
      ]);

      const now = new Date();
      const currentMonth = now.getMonth();
      const all: UpcomingItem[] = [];
      const { filterMode, eventTypes } = config;

      const shouldInclude = (type: string) =>
        eventTypes.length === 0 || eventTypes.includes(type);

      const timeFilter = (daysUntil: number, date: Date) => {
        switch (filterMode) {
          case "all": return true;
          case "month": return date.getMonth() === currentMonth && date.getFullYear() === now.getFullYear();
          case "30days": return daysUntil <= 30;
          case "7days": return daysUntil <= 7;
          default: return true;
        }
      };

      if (shouldInclude("birthday")) {
        for (const b of birthdays ?? []) {
          const { date, daysUntil } = getNextOccurrence(b.birth_date);
          if (timeFilter(daysUntil, date)) {
            all.push({
              name: b.name, emoji: b.emoji ?? "🎂", color: b.color ?? "#f472b6",
              daysUntil, date, hebDate: hebrewDateLabel(date),
              eventType: "birthday", eventLabel: "יום הולדת",
            });
          }
        }
      }

      for (const e of events ?? []) {
        if (!shouldInclude(e.event_type)) continue;
        const { date, daysUntil } = getNextOccurrence(e.event_date);
        if (timeFilter(daysUntil, date)) {
          const info = EVENT_TYPE_INFO[e.event_type] ?? EVENT_TYPE_INFO.other;
          all.push({
            name: e.name, emoji: e.emoji ?? info.emoji, color: e.color ?? "#60a5fa",
            daysUntil, date, hebDate: hebrewDateLabel(date),
            eventType: e.event_type, eventLabel: info.label,
          });
        }
      }

      all.sort((a, b) => a.daysUntil - b.daysUntil);
      setItems(all);
    })();
    return () => window.removeEventListener(HEARTS_CONFIG_UPDATED_EVENT, onCfgUpdated);
  }, []);

  if (items.length === 0) return null;

  const floatEnabled = floatAnim && !reducedMotion;
  const densityLimit = Math.max(4, Math.round(10 * floatDensityScale));
  const renderedItems = displayStyle === "hearts" || displayStyle === "bubbles"
    ? items.slice(0, densityLimit)
    : items;

  const now = new Date();
  const currentMonthItems = items
    .filter((item) => item.date.getMonth() === now.getMonth() && item.date.getFullYear() === now.getFullYear())
    .slice(0, 8);
  const nearest = items[0];

  const monthShowcase = (
    <div className={`mb-5 rounded-2xl border p-3 sm:p-4 ${isDark ? "bg-white/5 border-white/15" : "bg-white/70 border-white/80"}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className={`text-xs sm:text-sm font-black ${isDark ? "text-white" : "text-foreground"}`}>
          אירועי החודש
        </div>
        {nearest && (
          <div className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold ${isDark ? "bg-white/10 text-white" : "bg-background/80 text-foreground"}`}>
            הקרוב ביותר: {shortDisplayName(nearest.name)} · {daysLabel(nearest.daysUntil)}
          </div>
        )}
      </div>

      {currentMonthItems.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {currentMonthItems.map((item, i) => (
            <button
              key={`month-${item.eventType}-${item.name}-${i}`}
              type="button"
              onClick={() => {
                const key = `${item.eventType}-${item.name}-${i}`;
                setExpandedKey((prev) => (prev === key ? null : key));
              }}
              className={`min-w-[130px] text-right rounded-xl p-2 border shadow-sm transition-transform hover:scale-[1.02] ${isDark ? "bg-white/5 border-white/15" : "bg-background/80 border-muted"}`}
              style={reducedMotion ? undefined : { animation: `itemReveal .45s ease both`, animationDelay: `${i * 0.08}s` }}
              title={`${item.name} · ${item.eventLabel}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg leading-none">{item.emoji}</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: `${item.color}20`, color: item.color }}>
                  {item.daysUntil === 0 ? "היום" : item.daysUntil === 1 ? "מחר" : `${item.daysUntil}d`}
                </span>
              </div>
              <div className={`mt-1 text-[11px] font-bold leading-tight ${isDark ? "text-white" : "text-foreground"}`}>
                {shortDisplayName(item.name)}
              </div>
              <div className={`text-[10px] mt-1 ${isDark ? "text-white/70" : "text-muted-foreground"}`}>
                {item.eventLabel} · {format(item.date, "d MMM", { locale: he })}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className={`text-xs ${isDark ? "text-white/70" : "text-muted-foreground"}`}>
          אין אירועים נוספים בחודש הנוכחי.
        </div>
      )}
    </div>
  );

  // ─── HEARTS ───
  if (displayStyle === "hearts") {
    return (
      <>
      {monthShowcase}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {renderedItems.map((item, i) => {
          const key = `${item.eventType}-${item.name}-${i}`;
          const heartSize = 96 * floatSizeScale;
          const textWidth = Math.max(52, heartSize * 0.58);
          return (
          <div
            key={key}
            className="relative group"
            style={floatEnabled ? { animation: `heartFloat ${3 / floatSpeedScale}s ease-in-out infinite`, animationDelay: `${i * 0.35}s` } : undefined}
          >
            <button
              type="button"
              onClick={() => setExpandedKey((prev) => (prev === key ? null : key))}
              className="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
              style={{ width: `${heartSize}px`, height: `${heartSize}px`, filter: `drop-shadow(0 4px 16px ${item.color}60)` }}
              title={`${item.name} · ${item.eventLabel}`}
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                <path d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C38 5 45 10 50 18 C55 10 62 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z" fill={item.color} opacity="0.85" />
                <path d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C38 5 45 10 50 18 C55 10 62 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
              </svg>
              <div className="relative z-10 text-center pt-1 px-1">
                <div className="text-lg sm:text-xl leading-none">{item.emoji}</div>
                <div
                  className="text-[9px] sm:text-[10px] font-bold text-white leading-tight mt-0.5"
                  style={{
                    maxWidth: `${textWidth}px`,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                >
                  {shortDisplayName(item.name)}
                </div>
                {item.hebDate && <div className="text-[7px] sm:text-[8px] text-white/80 leading-tight mt-0.5 font-medium">{item.hebDate}</div>}
              </div>
            </button>
            <div className="absolute -top-1.5 -right-1.5 text-[9px] font-black rounded-full px-1.5 py-0.5 shadow-md border border-white/30"
              style={{ background: item.daysUntil === 0 ? "#fbbf24" : isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.92)", color: item.daysUntil === 0 ? "#000" : isDark ? "#fff" : "#333" }}>
              {item.daysUntil === 0 ? "🎉" : item.daysUntil}
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] sm:text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap"
              style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.85)", color: item.color, backdropFilter: "blur(4px)" }}>
              {item.eventLabel}
            </div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
              <div className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm ${isDark ? "bg-white/20 text-white" : "bg-white/90 text-foreground"}`}>
                {daysLabel(item.daysUntil)}{item.daysUntil > 1 ? ` · ${item.hebDate}` : ""}
              </div>
            </div>

            {expandedKey === key && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30 min-w-[170px] max-w-[220px] rounded-xl border p-2 text-center shadow-lg"
                style={{ background: isDark ? "rgba(20,20,20,0.92)" : "rgba(255,255,255,0.95)", borderColor: `${item.color}60` }}>
                <div className={`text-xs font-black ${isDark ? "text-white" : "text-foreground"}`}>{item.name}</div>
                <div className={`text-[10px] mt-1 ${isDark ? "text-white/70" : "text-muted-foreground"}`}>{item.eventLabel} · {daysLabel(item.daysUntil)}</div>
              </div>
            )}
          </div>
        );
        })}
        <style>{`@keyframes heartFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } } @keyframes itemReveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
      </>
    );
  }

  // ─── BUBBLES ───
  if (displayStyle === "bubbles") {
    return (
      <>
      {monthShowcase}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {renderedItems.map((item, i) => {
          const bubbleSize = 82 * floatSizeScale;
          const key = `${item.eventType}-${item.name}-${i}`;
          return (
          <div
            key={key}
            className="relative group"
            style={floatEnabled ? { animation: `heartFloat ${3 / floatSpeedScale}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` } : undefined}
          >
            <button
              type="button"
              onClick={() => setExpandedKey((prev) => (prev === key ? null : key))}
              className="rounded-full flex flex-col items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 shadow-lg border-2 border-white/30"
              style={{ width: `${bubbleSize}px`, height: `${bubbleSize}px`, background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)` }}
              title={`${item.name} · ${item.eventLabel}`}
            >
              <span className="text-xl sm:text-2xl">{item.emoji}</span>
              <span
                className="text-[8px] sm:text-[9px] font-bold leading-tight mt-0.5 px-1"
                style={{
                  maxWidth: `${bubbleSize * 0.72}px`,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                }}
              >
                {shortDisplayName(item.name)}
              </span>
              <span className="text-[7px] sm:text-[8px] opacity-80">{item.hebDate}</span>
            </button>
            <div className="absolute -top-1 -right-1 text-[9px] font-black rounded-full px-1.5 py-0.5 shadow-md"
              style={{ background: item.daysUntil === 0 ? "#fbbf24" : isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.92)", color: item.daysUntil === 0 ? "#000" : isDark ? "#fff" : "#333" }}>
              {item.daysUntil === 0 ? "🎉" : item.daysUntil}
            </div>

            {expandedKey === key && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30 min-w-[170px] max-w-[220px] rounded-xl border p-2 text-center shadow-lg"
                style={{ background: isDark ? "rgba(20,20,20,0.92)" : "rgba(255,255,255,0.95)", borderColor: `${item.color}60` }}>
                <div className={`text-xs font-black ${isDark ? "text-white" : "text-foreground"}`}>{item.name}</div>
                <div className={`text-[10px] mt-1 ${isDark ? "text-white/70" : "text-muted-foreground"}`}>{item.eventLabel} · {daysLabel(item.daysUntil)}</div>
              </div>
            )}
          </div>
        );
        })}
        <style>{`@keyframes heartFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
      </div>
      </>
    );
  }

  // ─── CARDS ───
  if (displayStyle === "cards") {
    return (
      <>
      {monthShowcase}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {items.map((item, i) => (
          <div
            key={`${item.eventType}-${item.name}-${i}`}
            className="rounded-2xl p-3 text-center shadow-md border border-white/30 transition-transform hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`, borderColor: `${item.color}40` }}
          >
            <div className="text-2xl mb-1">{item.emoji}</div>
            <div className="text-sm font-bold leading-tight break-words" style={{ color: item.color }}>{item.name}</div>
            <div className={`text-[10px] mt-0.5 ${isDark ? "text-white/70" : "text-muted-foreground"}`}>{item.eventLabel}</div>
            <div className={`text-xs font-bold mt-1 ${isDark ? "text-white" : "text-foreground"}`}>{daysLabel(item.daysUntil)}</div>
            {item.hebDate && <div className={`text-[10px] ${isDark ? "text-white/60" : "text-muted-foreground"}`}>{item.hebDate}</div>}
            <div className={`text-[10px] ${isDark ? "text-white/50" : "text-muted-foreground"}`}>{format(item.date, "d MMM", { locale: he })}</div>
          </div>
        ))}
      </div>
      </>
    );
  }

  // ─── COMPACT (list) ───
  return (
    <>
    {monthShowcase}
    <div className={`rounded-2xl p-3 mb-6 space-y-1.5 border ${isDark ? "bg-white/5 border-white/10" : "bg-card border-muted"}`}>
      {items.map((item, i) => (
        <div
          key={`${item.eventType}-${item.name}-${i}`}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all hover:scale-[1.01] ${isDark ? "bg-white/5" : "bg-muted/30"}`}
        >
          <span className="text-lg">{item.emoji}</span>
          <span className={`font-bold flex-1 leading-tight break-words ${isDark ? "text-white" : "text-foreground"}`}>{item.name}</span>
          <span className={`text-[10px] ${isDark ? "text-white/60" : "text-muted-foreground"}`}>{item.eventLabel}</span>
          {item.hebDate && <span className={`text-[10px] ${isDark ? "text-white/50" : "text-muted-foreground"}`}>{item.hebDate}</span>}
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${item.color}20`, color: item.color }}>
            {item.daysUntil === 0 ? "🎉 היום!" : item.daysUntil === 1 ? "מחר" : `${item.daysUntil} ימים`}
          </span>
        </div>
      ))}
    </div>
    </>
  );
}
