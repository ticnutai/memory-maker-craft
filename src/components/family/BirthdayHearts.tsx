import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, addYears, isBefore, parseISO, format } from "date-fns";
import { he } from "date-fns/locale";
import { HDate } from "@hebcal/core";
import { SlidersHorizontal, Move, Check, X } from "lucide-react";
import { toHebrewNumeral } from "@/lib/hebrewCalendar";
import { getDeviceId } from "@/lib/deviceId";
import { HEARTS_CONFIG_UPDATED_EVENT, loadHeartsConfig, saveHeartsConfig, HeartsDisplayStyle, FloatAnimationType, FloatingEffect, HeartsFilterMode, FloatDirection } from "@/lib/heartsDisplayConfig";

const POSITIONS_STORAGE_KEY = "family-hearts-saved-positions";

function loadSavedPositions(): Record<number, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(POSITIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSavedPositions(positions: Record<number, { x: number; y: number }>) {
  localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
}

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

/* ── Drag hook ── */
function useDraggable(enabled: boolean) {
  const dragState = useRef<{
    idx: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [dragOffsets, setDragOffsets] = useState<Record<number, { x: number; y: number }>>(loadSavedPositions);

  const onPointerDown = useCallback(
    (idx: number, e: React.PointerEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      const rect = el.getBoundingClientRect();
      dragState.current = {
        idx,
        startX: e.clientX,
        startY: e.clientY,
        origX: dragOffsets[idx]?.x ?? 0,
        origY: dragOffsets[idx]?.y ?? 0,
      };
      // Pause animation while dragging
      el.style.animationPlayState = "paused";
    },
    [enabled, dragOffsets]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return;
      const { idx, startX, startY, origX, origY } = dragState.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      setDragOffsets((prev) => ({ ...prev, [idx]: { x: origX + dx, y: origY + dy } }));
    },
    []
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return;
      const el = e.currentTarget as HTMLElement;
      el.style.animationPlayState = "";
      dragState.current = null;
    },
    []
  );

  return { dragOffsets, setDragOffsets, onPointerDown, onPointerMove, onPointerUp };
}

/* ── Stable random positions for full-page items ── */
function generatePositions(count: number, speedScale: number, independent: boolean) {
  return Array.from({ length: count }, (_, i) => ({
    x: 5 + ((i * 37 + 13) % 80),
    y: 5 + ((i * 53 + 7) % 75),
    delay: (i * 0.6) % 4,
    duration: (8 + (i % 5) * 2) / speedScale,
    drift: independent ? i : 0,
  }));
}

export default function BirthdayHearts({ isDark, familyDeviceIds }: { isDark?: boolean; familyDeviceIds?: string[] }) {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [displayStyle, setDisplayStyle] = useState<HeartsDisplayStyle>("hearts");
  const [filterMode, setFilterMode] = useState<HeartsFilterMode>("month");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [floatAnim, setFloatAnim] = useState(true);
  const [floatAnimType, setFloatAnimType] = useState<FloatAnimationType>("bounce");
  const [floatSizeScale, setFloatSizeScale] = useState(1);
  const [floatSpeedScale, setFloatSpeedScale] = useState(1);
  const [floatDirection, setFloatDirection] = useState<FloatDirection>("up");
  const [floatDensityScale, setFloatDensityScale] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [floatingEffects, setFloatingEffects] = useState<FloatingEffect[]>(["sparkles", "confetti", "pop"]);
  const [floatingIndependent, setFloatingIndependent] = useState(true);
  const [floatFullPage, setFloatFullPage] = useState(false);
  const [draggableEnabled, setDraggableEnabled] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [preEditOffsets, setPreEditOffsets] = useState<Record<number, { x: number; y: number }>>({});
  const [clickBurst, setClickBurst] = useState<{ x: number; y: number; color: string } | null>(null);
  const burstTimer = useRef<ReturnType<typeof setTimeout>>();

  const { dragOffsets, setDragOffsets, onPointerDown, onPointerMove, onPointerUp } = useDraggable(editMode);

  const triggerClickBurst = useCallback((e: React.MouseEvent, color: string) => {
    if (floatingEffects.length === 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setClickBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, color });
    if (burstTimer.current) clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setClickBurst(null), 1200);
    if (floatingEffects.includes("pop")) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } catch {}
    }
  }, [floatingEffects]);

  useEffect(() => {
    const applyConfig = () => {
      const config = loadHeartsConfig();
      if (!config.enabled) { setItems([]); return config; }
      setDisplayStyle(config.displayStyle);
      setFilterMode(config.filterMode);
      setFloatAnim(config.floatAnimation);
      setFloatAnimType(config.floatAnimationType || "bounce");
      setFloatSizeScale(Math.min(2, Math.max(0.5, config.floatSizeScale || 1)));
      setFloatSpeedScale(Math.min(2.5, Math.max(0.4, config.floatSpeedScale || 1)));
      setFloatDirection(config.floatDirection ?? "up");
      setFloatDensityScale(Math.min(2.5, Math.max(0.4, config.floatDensityScale || 1)));
      setReducedMotion(!!config.reducedMotion);
      setFloatingEffects(config.floatingEffects ?? ["sparkles", "confetti", "pop"]);
      setFloatingIndependent(config.floatingIndependent !== false);
      setFloatFullPage(!!config.floatFullPage);
      setDraggableEnabled(config.draggable !== false);
      return config;
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
      const all: UpcomingItem[] = [];
      const activeConfig = loadHeartsConfig();
      const { filterMode, eventTypes } = activeConfig;

      const sameHebrewMonth = (a: Date, b: Date) => {
        try {
          return new HDate(a).getMonth() === new HDate(b).getMonth();
        } catch {
          return a.getMonth() === b.getMonth();
        }
      };

      const shouldInclude = (type: string) =>
        eventTypes.length === 0 || eventTypes.includes(type);

      const timeFilter = (daysUntil: number, date: Date) => {
        switch (filterMode) {
          case "all": return true;
          case "month": return sameHebrewMonth(date, now);
          case "year": return daysUntil <= 365;
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

  const updateFilterMode = (nextMode: HeartsFilterMode) => {
    const cfg = loadHeartsConfig();
    const next = { ...cfg, filterMode: nextMode };
    saveHeartsConfig(next);
    setFilterMode(nextMode);
    setFilterMenuOpen(false);
  };

  const enterEditMode = () => {
    setPreEditOffsets({ ...dragOffsets });
    setEditMode(true);
  };
  const confirmEditMode = () => {
    saveSavedPositions(dragOffsets);
    setEditMode(false);
  };
  const cancelEditMode = () => {
    setDragOffsets(preEditOffsets);
    setEditMode(false);
  };

  const floatEnabled = floatAnim && !reducedMotion && !editMode;
  const densityLimit = Math.max(4, Math.round(10 * floatDensityScale));
  const renderedItems = displayStyle === "hearts" || displayStyle === "bubbles"
    ? items.slice(0, densityLimit)
    : items;

  const currentMonthItems = items.slice(0, 8);
  const nearest = items[0];

  const floatDistancePx = Math.max(12, Math.round(20 * floatSizeScale));
  const floatY = floatDirection === "down" ? floatDistancePx : -floatDistancePx;

  const monthShowcase = (
    <div className={`mb-5 rounded-2xl border p-3 sm:p-4 ${isDark ? "bg-white/5 border-white/15" : "bg-white/70 border-white/80"}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`text-xs sm:text-sm font-black ${isDark ? "text-white" : "text-foreground"}`}>
            אירועי החודש
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterMenuOpen((v) => !v)}
              className={`h-6 w-6 rounded-full border flex items-center justify-center ${isDark ? "bg-white/10 text-white border-white/20" : "bg-white text-foreground border-muted"}`}
              title="סינון תצוגה"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            {filterMenuOpen && (
              <div className={`absolute right-0 mt-1 z-30 min-w-[120px] rounded-lg border shadow-lg p-1 ${isDark ? "bg-slate-900 text-white border-white/20" : "bg-white text-foreground border-muted"}`}>
                {([
                  { id: "all" as HeartsFilterMode, label: "הצגת הכול" },
                  { id: "month" as HeartsFilterMode, label: "הצגת חודש" },
                  { id: "year" as HeartsFilterMode, label: "הצגת שנה" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateFilterMode(opt.id)}
                    className={`w-full text-right text-xs rounded-md px-2 py-1.5 ${filterMode === opt.id ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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

  const animKeyframes = `
    @keyframes heartFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(var(--float-y, -18px)); } }
    @keyframes heartDrift { 0% { transform: translate(0, 0); } 25% { transform: translate(24px, -16px); } 50% { transform: translate(-18px, -28px); } 75% { transform: translate(14px, -8px); } 100% { transform: translate(0, 0); } }
    @keyframes heartPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.18); } }
    @keyframes heartSwing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(10deg); } 75% { transform: rotate(-10deg); } }
    @keyframes heartWander { 0% { transform: translate(0,0) rotate(0); } 20% { transform: translate(28px,-20px) rotate(5deg); } 40% { transform: translate(-22px,-35px) rotate(-4deg); } 60% { transform: translate(18px,-12px) rotate(6deg); } 80% { transform: translate(-24px,-25px) rotate(-5deg); } 100% { transform: translate(0,0) rotate(0); } }
    @keyframes itemReveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes floatingBalloon0 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(40px, -55px) rotate(5deg); }
      50% { transform: translate(-30px, -90px) rotate(-4deg); }
      75% { transform: translate(20px, -35px) rotate(6deg); }
    }
    @keyframes floatingBalloon1 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      30% { transform: translate(-45px, -40px) rotate(-6deg); }
      60% { transform: translate(35px, -80px) rotate(5deg); }
      80% { transform: translate(-16px, -28px) rotate(-2deg); }
    }
    @keyframes floatingBalloon2 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      20% { transform: translate(30px, -70px) rotate(4deg); }
      50% { transform: translate(-40px, -45px) rotate(-5deg); }
      70% { transform: translate(25px, -60px) rotate(7deg); }
    }
    @keyframes floatingBalloon3 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      35% { transform: translate(-25px, -60px) rotate(-4deg); }
      55% { transform: translate(42px, -32px) rotate(6deg); }
      85% { transform: translate(-10px, -70px) rotate(-5deg); }
    }
    @keyframes floatingBalloonGroup {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-55px); }
    }
    @keyframes burstParticle {
      0% { opacity: 1; transform: translate(0,0) scale(0.5); }
      100% { opacity: 0; transform: translate(var(--burst-x, 30px), var(--burst-y, -60px)) scale(1.2); }
    }
    @keyframes burstConfetti {
      0% { opacity: 1; transform: translate(0,0) scale(1); }
      100% { opacity: 0; transform: translate(var(--burst-x, 30px), var(--burst-y, -60px)) scale(0.5); }
    }
  `;

  const getFloatAnimName = (i: number) => {
    if (floatAnimType === "bounce") return "heartFloat";
    if (floatAnimType === "drift") return "heartDrift";
    if (floatAnimType === "pulse") return "heartPulse";
    if (floatAnimType === "swing") return "heartSwing";
    return "heartWander";
  };

  const getFullPageAnimName = (i: number) =>
    floatingIndependent ? `floatingBalloon${i % 4}` : "floatingBalloonGroup";

  // Drag style helper
  const dragStyle = (idx: number): React.CSSProperties => {
    const off = dragOffsets[idx];
    if (!off) return {};
    return { transform: `translate(${off.x}px, ${off.y}px)`, zIndex: 50 };
  };

  const dragProps = (idx: number) =>
    editMode
      ? {
          onPointerDown: (e: React.PointerEvent) => onPointerDown(idx, e),
          onPointerMove,
          onPointerUp,
          style: { touchAction: "none" as const, cursor: "grab" },
        }
      : {};

  /* ── Click burst overlay ── */
  const burstOverlay = clickBurst && (
    <div className="fixed inset-0 pointer-events-none z-[100]" aria-hidden="true">
      {floatingEffects.includes("sparkles") &&
        Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const dist = 30 + Math.random() * 40;
          return (
            <span
              key={`sp-${i}`}
              className="absolute text-lg"
              style={{
                left: clickBurst.x,
                top: clickBurst.y,
                animation: `burstParticle 0.8s ease-out forwards`,
                transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`,
                opacity: 0,
              }}
            >
              ✨
            </span>
          );
        })}
      {floatingEffects.includes("confetti") &&
        Array.from({ length: 16 }).map((_, i) => (
          <span
            key={`cf-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: clickBurst.x,
              top: clickBurst.y,
              background: ["#f472b6", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb923c"][i % 6],
              animation: `burstConfetti 1s ease-out forwards`,
              animationDelay: `${i * 0.03}s`,
              opacity: 0,
              ["--burst-x" as any]: `${(Math.random() - 0.5) * 120}px`,
              ["--burst-y" as any]: `${-40 - Math.random() * 80}px`,
            }}
          />
        ))}
    </div>
  );

  const editModeUI = (
    <>
      {!editMode && (displayStyle === "hearts" || displayStyle === "bubbles" || displayStyle === "floating") && (
        <button
          type="button"
          onClick={enterEditMode}
          className={`absolute top-2 left-2 z-40 h-8 w-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${isDark ? "bg-white/15 border-white/30 text-white" : "bg-background/90 border-muted text-foreground"}`}
          title="סדר מחדש את האייקונים"
        >
          <Move className="w-4 h-4" />
        </button>
      )}
      {editMode && (
        <div className={`absolute top-2 left-2 z-40 flex items-center gap-2 rounded-xl px-3 py-2 shadow-xl border-2 ${isDark ? "bg-slate-900/95 border-white/30 text-white" : "bg-background/95 border-primary/30 text-foreground"}`}>
          <span className="text-xs font-bold">גרור את האייקונים למקום הרצוי</span>
          <button
            type="button"
            onClick={confirmEditMode}
            className="h-7 w-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow hover:scale-110 transition-transform"
            title="אישור"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={cancelEditMode}
            className="h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow hover:scale-110 transition-transform"
            title="ביטול"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );

  /* ═══════════════════════════════════════════
     Full-page floating overlay (for any style)
     ═══════════════════════════════════════════ */
  const useFullPage = floatFullPage || displayStyle === "floating";

  if (useFullPage) {
    const positions = generatePositions(renderedItems.length, floatSpeedScale, floatingIndependent);
    const isHeartShape = displayStyle === "hearts";
    const isBubbleShape = displayStyle === "bubbles" || displayStyle === "floating";

    return (
      <div className="relative">
        {monthShowcase}
        <div className="relative min-h-[300px]">
        {editModeUI}
        <div className="absolute inset-0 pointer-events-none z-[15] overflow-hidden" aria-hidden="false">
          {renderedItems.map((item, i) => {
            const key = `${item.eventType}-${item.name}-${i}`;
            const size = (isHeartShape ? 96 : 80) * floatSizeScale;
            const pos = positions[i];
            const animName = getFullPageAnimName(i);
            const dOff = dragOffsets[i];
            const baseLeft = pos.x;
            const baseTop = pos.y;

            return (
              <div
                key={key}
                className="absolute pointer-events-auto group"
                {...dragProps(i)}
                style={{
                  left: `calc(${baseLeft}% + ${(dOff?.x ?? 0)}px)`,
                  top: `calc(${baseTop}% + ${(dOff?.y ?? 0)}px)`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animation: (reducedMotion || editMode) ? undefined : `${animName} ${pos.duration}s ease-in-out infinite`,
                  animationDelay: `${pos.delay}s`,
                  filter: `drop-shadow(0 6px 20px ${item.color}50)`,
                  zIndex: dOff ? 50 : 15,
                  touchAction: editMode ? "none" : undefined,
                  cursor: editMode ? "grab" : "pointer",
                }}
              >
                {/* Heart shape */}
                {isHeartShape ? (
                  <button
                    type="button"
                    className="relative w-full h-full flex items-center justify-center transition-transform hover:scale-110"
                    onClick={(e) => { triggerClickBurst(e, item.color); setExpandedKey((prev) => (prev === key ? null : key)); }}
                    title={`${item.name} · ${item.eventLabel} · ${daysLabel(item.daysUntil)}`}
                  >
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                      <path d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C38 5 45 10 50 18 C55 10 62 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z" fill={item.color} opacity="0.85" />
                      <path d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C38 5 45 10 50 18 C55 10 62 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
                    </svg>
                    <div className="relative z-10 text-center pt-1 px-1">
                      <div className="text-lg sm:text-xl leading-none">{item.emoji}</div>
                      <div className="text-[9px] sm:text-[10px] font-bold text-white leading-tight mt-0.5"
                        style={{ maxWidth: `${size * 0.58}px`, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>
                        {shortDisplayName(item.name)}
                      </div>
                      {item.hebDate && <div className="text-[7px] sm:text-[8px] text-white/80 leading-tight mt-0.5 font-medium">{item.hebDate}</div>}
                    </div>
                  </button>
                ) : (
                  /* Bubble/circle shape */
                  <button
                    type="button"
                    className="rounded-full w-full h-full flex flex-col items-center justify-center text-white border-2 border-white/40 shadow-xl transition-transform hover:scale-125"
                    style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}bb)` }}
                    onClick={(e) => { triggerClickBurst(e, item.color); setExpandedKey((prev) => (prev === key ? null : key)); }}
                    title={`${item.name} · ${item.eventLabel} · ${daysLabel(item.daysUntil)}`}
                  >
                    <span className="text-xl leading-none">{item.emoji}</span>
                    <span className="text-[8px] font-bold leading-tight mt-0.5 px-1 text-center"
                      style={{ maxWidth: `${size * 0.7}px`, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {shortDisplayName(item.name)}
                    </span>
                    <span className="text-[7px] opacity-80">{item.hebDate}</span>
                  </button>
                )}

                {/* Days badge */}
                <div className="absolute -top-1 -right-1 text-[9px] font-black rounded-full px-1.5 py-0.5 shadow-md"
                  style={{ background: item.daysUntil === 0 ? "#fbbf24" : isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.92)", color: item.daysUntil === 0 ? "#000" : isDark ? "#fff" : "#333" }}>
                  {item.daysUntil === 0 ? "🎉" : item.daysUntil}
                </div>

                {isHeartShape && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] sm:text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap"
                    style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.85)", color: item.color, backdropFilter: "blur(4px)" }}>
                    {item.eventLabel}
                  </div>
                )}

                {/* Expanded tooltip */}
                {expandedKey === key && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30 min-w-[170px] max-w-[220px] rounded-xl border p-2 text-center shadow-lg pointer-events-auto"
                    style={{ background: isDark ? "rgba(20,20,20,0.92)" : "rgba(255,255,255,0.95)", borderColor: `${item.color}60` }}>
                    <div className={`text-xs font-black ${isDark ? "text-white" : "text-foreground"}`}>{item.name}</div>
                    <div className={`text-[10px] mt-1 ${isDark ? "text-white/70" : "text-muted-foreground"}`}>
                      {item.eventLabel} · {daysLabel(item.daysUntil)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>

        {burstOverlay}
        <style>{animKeyframes}</style>
      </div>
    );
  }

  // ─── HEARTS (inline) ───
  if (displayStyle === "hearts") {
    return (
      <>
      {monthShowcase}
      <div className="relative">
      {editModeUI}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {renderedItems.map((item, i) => {
          const key = `${item.eventType}-${item.name}-${i}`;
          const heartSize = 96 * floatSizeScale;
          const textWidth = Math.max(52, heartSize * 0.58);
          const dOff = dragOffsets[i];
          return (
          <div
            key={key}
            className="relative group"
            {...dragProps(i)}
            style={{
              ...(floatEnabled ? { animation: `${getFloatAnimName(i)} ${3 / floatSpeedScale}s ease-in-out infinite`, animationDelay: `${i * 0.35}s`, ["--float-y" as string]: `${floatY}px` } : {}),
              ...(dOff ? { transform: `translate(${dOff.x}px, ${dOff.y}px)`, zIndex: 50 } : {}),
              touchAction: draggableEnabled ? "none" : undefined,
            }}
          >
            <button
              type="button"
              onClick={(e) => { triggerClickBurst(e, item.color); setExpandedKey((prev) => (prev === key ? null : key)); }}
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
                <div className="text-[9px] sm:text-[10px] font-bold text-white leading-tight mt-0.5"
                  style={{ maxWidth: `${textWidth}px`, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>
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
        {burstOverlay}
        <style>{animKeyframes}</style>
      </div>
      </div>
      </>
    );
  }

  // ─── BUBBLES (inline) ───
  if (displayStyle === "bubbles") {
    return (
      <>
      {monthShowcase}
      <div className="relative">
      {editModeUI}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {renderedItems.map((item, i) => {
          const bubbleSize = 82 * floatSizeScale;
          const key = `${item.eventType}-${item.name}-${i}`;
          const dOff = dragOffsets[i];
          return (
          <div
            key={key}
            className="relative group"
            {...dragProps(i)}
            style={{
              ...(floatEnabled ? { animation: `${getFloatAnimName(i)} ${3 / floatSpeedScale}s ease-in-out infinite`, animationDelay: `${i * 0.3}s`, ["--float-y" as string]: `${floatY}px` } : {}),
              ...(dOff ? { transform: `translate(${dOff.x}px, ${dOff.y}px)`, zIndex: 50 } : {}),
              touchAction: draggableEnabled ? "none" : undefined,
            }}
          >
            <button
              type="button"
              onClick={(e) => { triggerClickBurst(e, item.color); setExpandedKey((prev) => (prev === key ? null : key)); }}
              className="rounded-full flex flex-col items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 shadow-lg border-2 border-white/30"
              style={{ width: `${bubbleSize}px`, height: `${bubbleSize}px`, background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)` }}
              title={`${item.name} · ${item.eventLabel}`}
            >
              <span className="text-xl sm:text-2xl">{item.emoji}</span>
              <span className="text-[8px] sm:text-[9px] font-bold leading-tight mt-0.5 px-1"
                style={{ maxWidth: `${bubbleSize * 0.72}px`, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>
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
        {burstOverlay}
        <style>{animKeyframes}</style>
      </div>
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
