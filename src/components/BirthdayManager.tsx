import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Gift, Heart, Plus, Trash2, Edit2, X, ExternalLink, Clock, LayoutGrid, List, Star, Send, CalendarPlus, Home, Eye, EyeOff, Settings2, Check, Copy } from "lucide-react";
import { loadHeartsConfig, saveHeartsConfig, HeartsDisplayConfig, HeartsFilterMode, HeartsDisplayStyle, FloatEnvironment, FloatPresetId, FloatAnimationType, getFloatPresetPatch } from "@/lib/heartsDisplayConfig";
import { format, differenceInDays, addYears, isBefore, parseISO, getMonth, getDate } from "date-fns";
import { he } from "date-fns/locale";
import BirthdayCalendarView from "./BirthdayCalendarView";
import BirthdayInviteDialog from "./BirthdayInviteDialog";
import { getHebMonthsForYear, hebrewToGregorian, gregorianToHebrew, getCurrentHebYear, daysInHebMonth, toHebrewNumeral, toHebrewYear } from "@/lib/hebrewCalendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

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
  { label: "אמא", emoji: "👩" }, { label: "אבא", emoji: "👨" },
  { label: "אח", emoji: "👦" }, { label: "אחות", emoji: "👧" },
  { label: "סבא", emoji: "👴" }, { label: "סבתא", emoji: "👵" },
  { label: "דוד", emoji: "👨" }, { label: "דודה", emoji: "👩" },
  { label: "בן/בת דוד", emoji: "🧒" }, { label: "חבר/ה", emoji: "🧑" },
  { label: "משפחה", emoji: "👪" }, { label: "אחר", emoji: "🎂" },
];

const BIRTHDAY_EMOJIS = ["🎂", "🎈", "🎁", "🎉", "🧁", "🎊", "👑", "⭐", "💖", "🌟", "🦄", "🎀"];

// ─── Event types ───
const EVENT_TYPES = [
  { id: "birthday", label: "🎂 יום הולדת", emoji: "🎂", defaultColor: "#f472b6" },
  { id: "anniversary", label: "💍 יום נישואין", emoji: "💍", defaultColor: "#f59e0b" },
  { id: "bar_mitzvah", label: "📜 בר/בת מצווה", emoji: "📜", defaultColor: "#8b5cf6" },
  { id: "memorial", label: "🕯️ יום זיכרון", emoji: "🕯️", defaultColor: "#6b7280" },
  { id: "graduation", label: "🎓 סיום לימודים", emoji: "🎓", defaultColor: "#10b981" },
  { id: "military", label: "🎖️ גיוס/שחרור", emoji: "🎖️", defaultColor: "#059669" },
  { id: "aliyah", label: "✈️ יום עלייה", emoji: "✈️", defaultColor: "#0ea5e9" },
  { id: "custom", label: "📅 אירוע מותאם", emoji: "📅", defaultColor: "#60a5fa" },
];

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

const COLORS = ["#f472b6", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#a78bfa", "#f87171", "#38bdf8"];

// ─── Hebrew date helpers (using proper gematria) ───
function getHebrewDate(date: Date): string {
  try {
    const h = gregorianToHebrew(date);
    const months = getHebMonthsForYear(h.hyear);
    const monthName = months.find(m => m.index === h.hmonth)?.name ?? "";
    return `${toHebrewNumeral(h.hday)} ${monthName} ${toHebrewYear(h.hyear)}`;
  } catch {
    return "";
  }
}

function getHebrewDateShort(date: Date): string {
  try {
    const h = gregorianToHebrew(date);
    const months = getHebMonthsForYear(h.hyear);
    const monthName = months.find(m => m.index === h.hmonth)?.name ?? "";
    return `${toHebrewNumeral(h.hday)} ${monthName}`;
  } catch {
    return "";
  }
}

// ─── Jewish holidays (approximate Gregorian dates for current year context) ───
interface JewishHoliday {
  name: string;
  emoji: string;
  hebrewDate: string;
  getApproxDate: (year: number) => Date | null;
}

const JEWISH_HOLIDAYS: JewishHoliday[] = [
  { name: "ראש השנה", emoji: "🍎", hebrewDate: "א׳ תשרי", getApproxDate: (y) => new Date(y, 8, 15) },
  { name: "יום כיפור", emoji: "🕊️", hebrewDate: "י׳ תשרי", getApproxDate: (y) => new Date(y, 8, 24) },
  { name: "סוכות", emoji: "🌿", hebrewDate: "ט״ו תשרי", getApproxDate: (y) => new Date(y, 8, 29) },
  { name: "שמחת תורה", emoji: "📜", hebrewDate: "כ״ב תשרי", getApproxDate: (y) => new Date(y, 9, 6) },
  { name: "חנוכה", emoji: "🕎", hebrewDate: "כ״ה כסלו", getApproxDate: (y) => new Date(y, 11, 10) },
  { name: "ט״ו בשבט", emoji: "🌳", hebrewDate: "ט״ו שבט", getApproxDate: (y) => new Date(y, 0, 25) },
  { name: "פורים", emoji: "🎭", hebrewDate: "י״ד אדר", getApproxDate: (y) => new Date(y, 2, 14) },
  { name: "פסח", emoji: "🍷", hebrewDate: "ט״ו ניסן", getApproxDate: (y) => new Date(y, 3, 12) },
  { name: "יום העצמאות", emoji: "🇮🇱", hebrewDate: "ה׳ אייר", getApproxDate: (y) => new Date(y, 3, 26) },
  { name: "ל״ג בעומר", emoji: "🔥", hebrewDate: "י״ח אייר", getApproxDate: (y) => new Date(y, 4, 9) },
  { name: "שבועות", emoji: "🌾", hebrewDate: "ו׳ סיון", getApproxDate: (y) => new Date(y, 5, 1) },
  { name: "תשעה באב", emoji: "😢", hebrewDate: "ט׳ באב", getApproxDate: (y) => new Date(y, 6, 23) },
];

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
  if (isBefore(next, today)) next = addYears(next, 1);
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
  const title = encodeURIComponent(`🎂 יום הולדת - ${b.name} ${b.emoji}`);
  const details = encodeURIComponent(b.notes || `יום הולדת של ${b.name}!`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&recur=RRULE:FREQ=YEARLY`;
}

type ViewMode = "calendar" | "cards" | "timeline" | "holidays";

interface BirthdayManagerProps {
  theme: "girl" | "boy";
  familyDeviceIds?: string[];
}

export default function BirthdayManager({ theme, familyDeviceIds }: BirthdayManagerProps) {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [familyEvents, setFamilyEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<boolean>(false);
  const [inviteFor, setInviteFor] = useState<Birthday | null>(null);
  const [heartsConfig, setHeartsConfig] = useState<HeartsDisplayConfig>(() => loadHeartsConfig());
  const [showHomeSettings, setShowHomeSettings] = useState(false);

  const [formType, setFormType] = useState("birthday");
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formRelation, setFormRelation] = useState("משפחה");
  const [formEmoji, setFormEmoji] = useState("🎂");
  const [formNotes, setFormNotes] = useState("");
  const [formColor, setFormColor] = useState("#f472b6");
  const [formRecurring, setFormRecurring] = useState(true);
  const [dateMode, setDateMode] = useState<"greg" | "heb">("heb");
  const [hebYear, setHebYear] = useState<number>(getCurrentHebYear());
  const [hebMonth, setHebMonth] = useState<number>(7);
  const [hebDay, setHebDay] = useState<number>(1);
  const [hebDateStep, setHebDateStep] = useState<"day" | "month" | "year" | null>(null);
  const isMobile = useIsMobile();

  const deviceId = getDeviceId();
  const queryIds = familyDeviceIds && familyDeviceIds.length > 0 ? familyDeviceIds : [deviceId];
  const accent = theme === "girl" ? "bg-game-pink" : "bg-game-blue";

  const applyAnimationPreset = (preset: FloatPresetId) => {
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
    const next = {
      ...heartsConfig,
      floatPreset: preset,
      ...getFloatPresetPatch(preset, {
        isMobile,
        prefersReducedMotion: prefersReduced,
        lowPowerDevice: lowPower,
      }),
    };
    setHeartsConfig(next);
    saveHeartsConfig(next);
  };

  const loadBirthdays = useCallback(async () => {
    const [{ data: bData }, { data: eData }] = await Promise.all([
      supabase.from("birthdays").select("*").in("device_id", queryIds).order("birth_date", { ascending: true }),
      supabase.from("family_events").select("*").in("device_id", queryIds).order("event_date", { ascending: true }),
    ]);
    if (bData) setBirthdays(bData as Birthday[]);
    if (eData) setFamilyEvents(eData as FamilyEvent[]);
    setLoading(false);
  }, [queryIds.join(",")]);

  useEffect(() => { loadBirthdays(); }, [loadBirthdays]);

  const resetForm = () => {
    setFormType("birthday"); setFormName(""); setFormDate(""); setFormRelation("משפחה");
    setFormEmoji("🎂"); setFormNotes(""); setFormColor("#f472b6"); setFormRecurring(true);
    setEditId(null); setEditingEvent(false); setShowForm(false);
    setDateMode("heb"); setHebDateStep(null);
    setHebYear(getCurrentHebYear()); setHebMonth(7); setHebDay(1);
  };

  const editBirthday = (b: Birthday) => {
    setFormType("birthday");
    setFormName(b.name); setFormDate(b.birth_date); setFormRelation(b.relation);
    setFormEmoji(b.emoji); setFormNotes(b.notes || ""); setFormColor(b.color);
    setEditId(b.id); setEditingEvent(false); setShowForm(true);
    setDateMode("heb"); setHebDateStep(null);
    try {
      const h = gregorianToHebrew(parseISO(b.birth_date));
      setHebYear(h.hyear); setHebMonth(h.hmonth); setHebDay(h.hday);
    } catch { /* ignore */ }
  };

  const editEvent = (ev: FamilyEvent) => {
    setFormType(ev.event_type);
    setFormName(ev.name); setFormDate(ev.event_date); setFormRelation("משפחה");
    setFormEmoji(ev.emoji); setFormNotes(ev.notes || ""); setFormColor(ev.color);
    setFormRecurring(ev.recurring);
    setEditId(ev.id); setEditingEvent(true); setShowForm(true);
    setDateMode("heb"); setHebDateStep(null);
    try {
      const h = gregorianToHebrew(parseISO(ev.event_date));
      setHebYear(h.hyear); setHebMonth(h.hmonth); setHebDay(h.hday);
    } catch { /* ignore */ }
  };

  // When user picks Hebrew date, convert to Gregorian and store in formDate
  useEffect(() => {
    if (dateMode !== "heb") return;
    try {
      const greg = hebrewToGregorian(hebYear, hebMonth, hebDay);
      setFormDate(format(greg, "yyyy-MM-dd"));
    } catch { /* invalid combo — leave formDate */ }
  }, [dateMode, hebYear, hebMonth, hebDay]);

  // Auto-set emoji & color when event type changes
  const handleTypeChange = (typeId: string) => {
    setFormType(typeId);
    const t = EVENT_TYPES.find(e => e.id === typeId);
    if (t) {
      setFormEmoji(t.emoji);
      setFormColor(t.defaultColor);
    }
  };

  const saveEntry = async () => {
    const cleanedName = formName.trim();
    if (!cleanedName) {
      toast.error("יש להזין שם אירוע");
      return;
    }

    if (!formDate) {
      toast.error("יש לבחור תאריך");
      return;
    }

    const parsed = parseISO(formDate);
    if (Number.isNaN(parsed.getTime())) {
      toast.error("התאריך שנבחר לא תקין");
      return;
    }

    try {
      if (formType === "birthday") {
        // Save as birthday
        const payload = {
          device_id: deviceId, name: cleanedName, birth_date: formDate,
          relation: formRelation, emoji: formEmoji, notes: formNotes || null,
          color: formColor, updated_at: new Date().toISOString(),
        };
        if (editId && !editingEvent) {
          const { error } = await supabase.from("birthdays").update(payload).eq("id", editId);
          if (error) throw error;
        } else {
          // If switching from event to birthday while editing, delete old event
          if (editId && editingEvent) {
            const { error: deleteError } = await supabase.from("family_events").delete().eq("id", editId);
            if (deleteError) throw deleteError;
          }
          const { error } = await supabase.from("birthdays").insert(payload);
          if (error) throw error;
        }
      } else {
        // Save as family event
        const payload = {
          device_id: deviceId, name: cleanedName, event_date: formDate,
          event_type: formType, emoji: formEmoji, color: formColor,
          notes: formNotes || null, recurring: formRecurring,
          updated_at: new Date().toISOString(),
        };
        if (editId && editingEvent) {
          const { error } = await supabase.from("family_events").update(payload).eq("id", editId);
          if (error) throw error;
        } else {
          // If switching from birthday to event while editing, delete old birthday
          if (editId && !editingEvent) {
            const { error: deleteError } = await supabase.from("birthdays").delete().eq("id", editId);
            if (deleteError) throw deleteError;
          }
          const { error } = await supabase.from("family_events").insert(payload);
          if (error) throw error;
        }
      }

      toast.success(editId ? "האירוע עודכן" : "האירוע נשמר");
      resetForm();
      loadBirthdays();
    } catch (error) {
      console.error("saveEntry failed", error);
      toast.error("שמירת האירוע נכשלה");
    }
  };

  const deleteEntry = async (id: string, isEvent: boolean) => {
    try {
      if (isEvent) {
        const { error } = await supabase.from("family_events").delete().eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("birthdays").delete().eq("id", id);
        if (error) throw error;
      }
      loadBirthdays();
      toast.success("נמחק בהצלחה");
    } catch (error) {
      console.error("deleteEntry failed", error);
      toast.error("מחיקת האירוע נכשלה");
    }
  };

  const duplicateBirthday = (b: Birthday) => {
    resetForm();
    setFormType("birthday");
    setFormName(b.name + " (עותק)");
    setFormDate(b.birth_date);
    setFormRelation(b.relation);
    setFormEmoji(b.emoji);
    setFormNotes(b.notes || "");
    setFormColor(b.color);
    setShowForm(true);
    try {
      const h = gregorianToHebrew(parseISO(b.birth_date));
      setHebYear(h.hyear); setHebMonth(h.hmonth); setHebDay(h.hday);
    } catch { /* ignore */ }
  };

  const duplicateEvent = (ev: FamilyEvent) => {
    resetForm();
    setFormType(ev.event_type);
    setFormName(ev.name + " (עותק)");
    setFormDate(ev.event_date);
    setFormEmoji(ev.emoji);
    setFormNotes(ev.notes || "");
    setFormColor(ev.color);
    setFormRecurring(ev.recurring);
    setShowForm(true);
    try {
      const h = gregorianToHebrew(parseISO(ev.event_date));
      setHebYear(h.hyear); setHebMonth(h.hmonth); setHebDay(h.hday);
    } catch { /* ignore */ }
  };

  const sorted = [...birthdays].sort((a, b) => getDaysUntilBirthday(a.birth_date) - getDaysUntilBirthday(b.birth_date));

  const upcoming = sorted.filter(b => getDaysUntilBirthday(b.birth_date) <= 30);

  const monthGroups = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    label: format(new Date(2024, i, 1), "MMMM", { locale: he }),
    birthdays: birthdays.filter(b => getMonth(parseISO(b.birth_date)) === i)
      .sort((a, b) => getDate(parseISO(a.birth_date)) - getDate(parseISO(b.birth_date))),
  }));

  const VIEW_OPTIONS: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
    { id: "calendar", icon: <Calendar className="w-4 h-4" />, label: "לוח שנה" },
    { id: "cards", icon: <LayoutGrid className="w-4 h-4" />, label: "כרטיסים" },
    { id: "timeline", icon: <Heart className="w-4 h-4" />, label: "ציר זמן" },
    { id: "holidays", icon: <Star className="w-4 h-4" />, label: "חגים" },
  ];

  const handleAddOnDate = (date: Date) => {
    resetForm();
    setFormDate(format(date, "yyyy-MM-dd"));
    setShowForm(true);
    setTimeout(() => {
      const formEl = document.getElementById("birthday-form");
      if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "center" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      const nameInput = document.getElementById("birthday-name-input") as HTMLInputElement | null;
      nameInput?.focus();
    }, 100);
  };

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin text-2xl">🎂</div></div>;

  return (
    <div className="space-y-4 w-full max-w-none">

      {/* Upcoming reminders */}
      {upcoming.length > 0 && (
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-4 border-2 border-pink-200 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-pink-700">
            <Clock className="w-4 h-4" />
            <span>🎉 ימי הולדת קרובים!</span>
          </div>
          {upcoming.map(b => {
            const days = getDaysUntilBirthday(b.birth_date);
            const hebrewDate = getHebrewDateShort(parseISO(b.birth_date));
            return (
              <div key={b.id} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{b.emoji}</span>
                <span className="font-bold">{b.name}</span>
                <span className="text-pink-600">
                  {days === 0 ? "🎂 היום!" : days === 1 ? "מחר!" : `עוד ${days} ימים`}
                </span>
                <span className="text-muted-foreground text-xs">(גיל {getAge(b.birth_date) + (days === 0 ? 0 : 1)})</span>
                {hebrewDate && <span className="text-[10px] text-purple-500">📅 {hebrewDate}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* View mode icons + add */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1 bg-muted rounded-xl p-1">
          {VIEW_OPTIONS.map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                viewMode === v.id ? `${accent} text-primary-foreground shadow-md` : "text-muted-foreground"
              }`}>
              {v.icon}{v.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowHomeSettings(s => !s)}
          className={`p-2 rounded-xl transition-all active:scale-90 ${showHomeSettings ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          title="הגדרות תצוגת דף הבית"
        >
          <Home className="w-4 h-4" />
        </button>
        <Button variant={theme === "girl" ? "game-pink" : "game-blue"} size="sm"
          onClick={() => { resetForm(); setShowForm(true); }} className="rounded-xl">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* ═══ HOME DISPLAY SETTINGS ═══ */}
      {showHomeSettings && (
        <div className="bg-card rounded-2xl p-4 border-2 border-muted shadow-lg space-y-4 bounce-in">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Home className="w-4 h-4" /> הגדרות תצוגה בדף הבית
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => setShowHomeSettings(false)}
                className="rounded-xl gap-1 text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                אישור
              </Button>
              <button
                onClick={() => setShowHomeSettings(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="סגור"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Enable/disable toggle with settings icon */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-2">
              {heartsConfig.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              הצגת ימי הולדת בדף הבית
            </label>
            <button
              type="button"
              onClick={() => {
                const next = { ...heartsConfig, enabled: !heartsConfig.enabled };
                setHeartsConfig(next);
                saveHeartsConfig(next);
              }}
              className={`w-11 h-6 rounded-full transition-all relative flex items-center ${heartsConfig.enabled ? "bg-primary" : "bg-muted"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all flex items-center justify-center ${heartsConfig.enabled ? "right-0.5 bg-primary-foreground" : "right-[1.25rem] bg-background"}`}>
                {heartsConfig.enabled && <Check className="w-3 h-3 text-primary" />}
              </div>
            </button>
          </div>

          {heartsConfig.enabled && (
            <>
              {/* Display style */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">סגנון תצוגה</label>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { id: "hearts" as HeartsDisplayStyle, label: "❤️ לבבות", desc: "לבבות מרחפים" },
                    { id: "bubbles" as HeartsDisplayStyle, label: "🫧 בועות", desc: "עיגולים צבעוניים" },
                    { id: "cards" as HeartsDisplayStyle, label: "🃏 כרטיסים", desc: "כרטיסי אירוע" },
                    { id: "compact" as HeartsDisplayStyle, label: "📋 רשימה", desc: "רשימה קומפקטית" },
                  ]).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        const next = { ...heartsConfig, displayStyle: opt.id };
                        setHeartsConfig(next);
                        saveHeartsConfig(next);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                        heartsConfig.displayStyle === opt.id
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                      }`}
                      title={opt.desc}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Float animation toggle */}
              {(heartsConfig.displayStyle === "hearts" || heartsConfig.displayStyle === "bubbles") && (
                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                  <label className="text-xs font-bold text-muted-foreground">✨ אנימציית ריחוף</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...heartsConfig, floatAnimation: !heartsConfig.floatAnimation };
                      setHeartsConfig(next);
                      saveHeartsConfig(next);
                    }}
                    className={`w-11 h-6 rounded-full transition-all relative flex items-center ${heartsConfig.floatAnimation ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all flex items-center justify-center ${heartsConfig.floatAnimation ? "right-0.5 bg-primary-foreground" : "right-[1.25rem] bg-background"}`}>
                      {heartsConfig.floatAnimation && <Check className="w-3 h-3 text-primary" />}
                    </div>
                  </button>
                </div>
               )}

              {/* Animation type selector */}
              {(heartsConfig.displayStyle === "hearts" || heartsConfig.displayStyle === "bubbles") && heartsConfig.floatAnimation && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">🎬 סוג אנימציה</label>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { id: "bounce" as FloatAnimationType, label: "⬆️ קפיצה", desc: "תנועה למעלה ולמטה" },
                      { id: "drift" as FloatAnimationType, label: "🌊 גלישה", desc: "תנועה חופשית בין מקומות" },
                      { id: "pulse" as FloatAnimationType, label: "💓 פעימה", desc: "גדילה והתכווצות" },
                      { id: "swing" as FloatAnimationType, label: "🎠 נדנדה", desc: "סיבוב עדין ימינה ושמאלה" },
                      { id: "wander" as FloatAnimationType, label: "🦋 שיטוט", desc: "תנועה אקראית עם סיבוב" },
                    ]).map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          const next = { ...heartsConfig, floatAnimationType: opt.id };
                          setHeartsConfig(next);
                          saveHeartsConfig(next);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                          (heartsConfig.floatAnimationType || "bounce") === opt.id
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                        }`}
                        title={opt.desc}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Float tuning */}
              <div className="space-y-3 p-3 rounded-xl border bg-muted/20">
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { id: "soft" as FloatPresetId, label: "עדין" },
                    { id: "balanced" as FloatPresetId, label: "מאוזן" },
                    { id: "rich" as FloatPresetId, label: "עשיר" },
                  ]).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyAnimationPreset(preset.id)}
                      className={`text-[11px] font-bold rounded-lg border px-2 py-1 ${
                        heartsConfig.floatPreset === preset.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted/60"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground">🔎 גודל אלמנטים</label>
                    <span className="text-[10px] text-muted-foreground">{Math.round((heartsConfig.floatSizeScale ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={heartsConfig.floatSizeScale ?? 1}
                    onChange={(e) => {
                      const next = { ...heartsConfig, floatPreset: "custom" as const, floatSizeScale: Number(e.target.value) };
                      setHeartsConfig(next);
                      saveHeartsConfig(next);
                    }}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground">⚡ מהירות אנימציה</label>
                    <span className="text-[10px] text-muted-foreground">{Math.round((heartsConfig.floatSpeedScale ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={2.5}
                    step={0.1}
                    value={heartsConfig.floatSpeedScale ?? 1}
                    onChange={(e) => {
                      const next = { ...heartsConfig, floatPreset: "custom" as const, floatSpeedScale: Number(e.target.value) };
                      setHeartsConfig(next);
                      saveHeartsConfig(next);
                    }}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">↕️ כיוון תנועה</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { id: "up" as const, label: "⬆️ צף למעלה" },
                      { id: "down" as const, label: "⬇️ נוזל למטה" },
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          const next = { ...heartsConfig, floatPreset: "custom" as const, floatDirection: opt.id };
                          setHeartsConfig(next);
                          saveHeartsConfig(next);
                        }}
                        className={`text-xs font-bold rounded-lg border px-2 py-1.5 ${
                          (heartsConfig.floatDirection ?? "up") === opt.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted/60"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground">🧩 צפיפות אלמנטים</label>
                    <span className="text-[10px] text-muted-foreground">{Math.round((heartsConfig.floatDensityScale ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={2.5}
                    step={0.1}
                    value={heartsConfig.floatDensityScale ?? 1}
                    onChange={(e) => {
                      const next = { ...heartsConfig, floatPreset: "custom" as const, floatDensityScale: Number(e.target.value) };
                      setHeartsConfig(next);
                      saveHeartsConfig(next);
                    }}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">🌍 סביבת אנימציה</label>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { id: "theme" as FloatEnvironment, label: "🎨 לפי ערכה" },
                      { id: "hearts" as FloatEnvironment, label: "❤️ לבבות" },
                      { id: "stars" as FloatEnvironment, label: "⭐ כוכבים" },
                      { id: "leaves" as FloatEnvironment, label: "🌿 עלים" },
                      { id: "confetti" as FloatEnvironment, label: "🎉 קונפטי" },
                      { id: "dots" as FloatEnvironment, label: "● נקודות" },
                      { id: "bubbles" as FloatEnvironment, label: "🫧 בועות" },
                      { id: "butterflies" as FloatEnvironment, label: "🦋 פרפרים" },
                      { id: "snow" as FloatEnvironment, label: "❄️ שלג" },
                      { id: "petals" as FloatEnvironment, label: "🌸 עלי כותרת" },
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          const next = { ...heartsConfig, floatPreset: "custom" as const, floatEnvironment: opt.id };
                          setHeartsConfig(next);
                          saveHeartsConfig(next);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                          (heartsConfig.floatEnvironment ?? "theme") === opt.id
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg border bg-background/70">
                  <label className="text-xs font-bold text-muted-foreground">🛟 מצב תנועה מופחתת (נגישות/מכשיר חלש)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...heartsConfig, floatPreset: "custom" as const, reducedMotion: !heartsConfig.reducedMotion };
                      setHeartsConfig(next);
                      saveHeartsConfig(next);
                    }}
                    className={`w-10 h-6 rounded-full transition-all relative ${heartsConfig.reducedMotion ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${heartsConfig.reducedMotion ? "right-0.5" : "right-4"}`} />
                  </button>
                </div>
              </div>

              {/* Filter mode */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">סינון לפי זמן</label>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { id: "all" as HeartsFilterMode, label: "📋 הכל" },
                    { id: "month" as HeartsFilterMode, label: "📅 חודש עברי נוכחי" },
                    { id: "year" as HeartsFilterMode, label: "🗓️ השנה הקרובה" },
                    { id: "30days" as HeartsFilterMode, label: "🗓️ 30 יום" },
                    { id: "7days" as HeartsFilterMode, label: "⏰ 7 ימים" },
                  ]).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        const next = { ...heartsConfig, filterMode: opt.id };
                        setHeartsConfig(next);
                        saveHeartsConfig(next);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                        heartsConfig.filterMode === opt.id
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event type filter */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">סוגי אירועים להצגה</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      const next = { ...heartsConfig, eventTypes: [] };
                      setHeartsConfig(next);
                      saveHeartsConfig(next);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                      heartsConfig.eventTypes.length === 0
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                    }`}
                  >
                    ✨ הכל
                  </button>
                  {EVENT_TYPES.map(t => {
                    const selected = heartsConfig.eventTypes.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          let types: string[];
                          if (heartsConfig.eventTypes.length === 0) {
                            // switching from "all" — select only this one
                            types = [t.id];
                          } else if (selected) {
                            types = heartsConfig.eventTypes.filter(x => x !== t.id);
                            if (types.length === 0) types = []; // back to all
                          } else {
                            types = [...heartsConfig.eventTypes, t.id];
                          }
                          const next = { ...heartsConfig, eventTypes: types };
                          setHeartsConfig(next);
                          saveHeartsConfig(next);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editId ? "✏️ עריכה" : `${EVENT_TYPES.find(t => t.id === formType)?.emoji ?? "📅"} הוספת ${EVENT_TYPES.find(t => t.id === formType)?.label.split(" ").slice(1).join(" ") ?? "אירוע"}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Event type selector */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">סוג אירוע</label>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTypeChange(t.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                      formType === t.id
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-muted-foreground mb-1 block">שם</label>
                <input id="birthday-name-input" type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="שם בן המשפחה..." dir="rtl"
                  className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-primary bg-background" />
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-muted-foreground">תאריך</label>
                  <div className="flex gap-1 bg-muted rounded-lg p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDateMode("greg")}
                      className={`px-2 py-0.5 rounded transition-all ${dateMode === "greg" ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
                    >📅 לועזי</button>
                    <button
                      type="button"
                      onClick={() => setDateMode("heb")}
                      className={`px-2 py-0.5 rounded transition-all ${dateMode === "heb" ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
                    >🕎 עברי</button>
                  </div>
                </div>

                {dateMode === "greg" ? (
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                    className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-primary bg-background" />
                ) : (
                  <div dir="rtl" className="space-y-2">
                    {/* Breadcrumb display */}
                    <div className="flex items-center gap-1 flex-wrap text-sm">
                      <button
                        type="button"
                        onClick={() => setHebDateStep(hebDateStep === "day" ? null : "day")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all border ${
                          hebDateStep === "day"
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/50 text-foreground border-muted hover:bg-muted"
                        }`}
                      >
                        {toHebrewNumeral(hebDay)}
                      </button>
                      <span className="text-muted-foreground">/</span>
                      <button
                        type="button"
                        onClick={() => setHebDateStep(hebDateStep === "month" ? null : "month")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all border ${
                          hebDateStep === "month"
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/50 text-foreground border-muted hover:bg-muted"
                        }`}
                      >
                        {getHebMonthsForYear(hebYear).find(m => m.index === hebMonth)?.name ?? "חודש"}
                      </button>
                      <span className="text-muted-foreground">/</span>
                      <button
                        type="button"
                        onClick={() => setHebDateStep(hebDateStep === "year" ? null : "year")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all border ${
                          hebDateStep === "year"
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/50 text-foreground border-muted hover:bg-muted"
                        }`}
                      >
                        {toHebrewYear(hebYear)}
                      </button>
                    </div>

                    {/* Step dropdowns */}
                    {hebDateStep === "day" && (
                      <div className="bg-muted/30 rounded-xl p-2 border flex flex-wrap gap-1 max-h-48 overflow-y-auto bounce-in">
                        {Array.from({ length: daysInHebMonth(hebYear, hebMonth) }, (_, i) => i + 1).map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => { setHebDay(d); setHebDateStep("month"); }}
                            className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${
                              hebDay === d
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-card hover:bg-muted text-foreground"
                            }`}
                          >
                            {toHebrewNumeral(d)}
                          </button>
                        ))}
                      </div>
                    )}

                    {hebDateStep === "month" && (
                      <div className="bg-muted/30 rounded-xl p-2 border flex flex-wrap gap-1 bounce-in">
                        {getHebMonthsForYear(hebYear).map(m => (
                          <button
                            key={m.index}
                            type="button"
                            onClick={() => { setHebMonth(m.index); setHebDateStep("year"); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              hebMonth === m.index
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-card hover:bg-muted text-foreground"
                            }`}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {hebDateStep === "year" && (
                      <div className="bg-muted/30 rounded-xl p-2 border flex flex-wrap gap-1 max-h-56 overflow-y-auto bounce-in">
                        {Array.from({ length: 81 }, (_, i) => getCurrentHebYear() - 70 + i).map(y => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => { setHebYear(y); setHebDateStep(null); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              hebYear === y
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-card hover:bg-muted text-foreground"
                            }`}
                          >
                            {toHebrewYear(y)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {formDate && (
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                    <span>📅 {format(parseISO(formDate), "d MMMM yyyy", { locale: he })}</span>
                    <span>•</span>
                    <span>🕎 {getHebrewDate(parseISO(formDate))}</span>
                  </p>
                )}
              </div>
              {formType === "birthday" && (
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">קרבה</label>
                  <select value={formRelation} onChange={e => setFormRelation(e.target.value)} dir="rtl"
                    className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-primary bg-background">
                    {RELATIONS.map(r => <option key={r.label} value={r.label}>{r.emoji} {r.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">אימוג׳י</label>
              <div className="flex flex-wrap gap-2">
                {BIRTHDAY_EMOJIS.map(e => (
                  <button key={e} onClick={() => setFormEmoji(e)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all active:scale-90 ${
                      formEmoji === e ? "ring-2 ring-primary bg-primary/10 scale-110" : "bg-muted hover:scale-105"
                    }`}>{e}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">צבע</label>
              <div className="flex gap-2 items-center">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setFormColor(c)}
                    className={`w-7 h-7 rounded-full transition-all active:scale-90 ${
                      formColor === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"
                    }`} style={{ backgroundColor: c }} />
                ))}
                <label className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/40 cursor-pointer">
                  <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-full h-full flex items-center justify-center text-[10px]">🎨</div>
                </label>
              </div>
            </div>

            {/* Recurring toggle */}
            {formType !== "birthday" && (
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                <label className="text-xs font-bold text-muted-foreground">🔄 חוזר כל שנה</label>
                <button
                  type="button"
                  onClick={() => setFormRecurring(r => !r)}
                  className={`w-10 h-6 rounded-full transition-all relative ${formRecurring ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground shadow transition-all ${formRecurring ? "right-0.5" : "right-4"}`} />
                </button>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">הערות</label>
              <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)}
                placeholder="פרטים נוספים..." dir="rtl"
                className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-primary bg-background" />
            </div>

            <Button variant={theme === "girl" ? "game-pink" : "game-blue"} className="w-full rounded-xl"
              onClick={saveEntry} disabled={!formName || !formDate}>
              {editId ? "💾 שמירה" : `${EVENT_TYPES.find(t => t.id === formType)?.emoji ?? "📅"} הוספה`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty */}
      {birthdays.length === 0 && !showForm && viewMode !== "holidays" && (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sorted.map((b, i) => {
            const days = getDaysUntilBirthday(b.birth_date);
            const age = getAge(b.birth_date);
            const isToday = days === 0;
            const hebrewDate = getHebrewDate(parseISO(b.birth_date));
            return (
              <div key={b.id}
                className={`relative rounded-2xl p-4 shadow-lg border-2 transition-all hover:scale-[1.01] bounce-in overflow-hidden ${
                  isToday ? "ring-2 ring-yellow-400 shadow-yellow-200" : ""
                }`}
                style={{ animationDelay: `${i * 0.06}s`, borderColor: b.color, background: `linear-gradient(135deg, ${b.color}15, ${b.color}08)` }}>
                <div className="absolute top-2 left-2 flex gap-1 opacity-30">
                  {[...Array(3)].map((_, j) => (
                    <span key={j} className="text-xs" style={{ color: b.color, animation: `floatBg ${4 + j}s ease-in-out ${j * 0.5}s infinite alternate` }}>💖</span>
                  ))}
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-md shrink-0"
                    style={{ backgroundColor: b.color + "25", border: `2px solid ${b.color}` }}>
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
                      {isToday ? "🎉 יום הולדת שמח!" : `עוד ${days} ימים`}
                    </p>
                    {/* Dual date display */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">
                        📅 {format(parseISO(b.birth_date), "d בMMMM yyyy", { locale: he })}
                      </span>
                      {hebrewDate && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          🕎 {hebrewDate}
                        </span>
                      )}
                    </div>
                    {b.notes && <p className="text-[10px] text-muted-foreground mt-1 truncate">📝 {b.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => setInviteFor(b)} className="p-1.5 rounded-lg transition-all active:scale-90" style={{ background: b.color + "30" }} title="שלח הזמנה">
                      <Send className="w-3.5 h-3.5" style={{ color: b.color }} />
                    </button>
                    <button onClick={() => editBirthday(b)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-all active:scale-90" title="עריכה">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => duplicateBirthday(b)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-all active:scale-90" title="שכפול">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <a href={generateGoogleCalendarUrl(b)} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-all active:scale-90" title="הוספה ליומן גוגל">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                    <button onClick={() => deleteEntry(b.id, false)} className="p-1.5 rounded-lg bg-muted hover:bg-destructive/10 transition-all active:scale-90">
                      <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CALENDAR VIEW (interactive grid) ═══ */}
      {viewMode === "calendar" && (
        <BirthdayCalendarView
          birthdays={birthdays}
          familyEvents={familyEvents}
          accent={accent}
          onAddOnDate={handleAddOnDate}
          onSendInvite={(b) => setInviteFor(b)}
          onEdit={editBirthday}
          onEditEvent={editEvent}
        />
      )}

      {/* ═══ FAMILY EVENTS LIST ═══ */}
      {familyEvents.length > 0 && viewMode !== "calendar" && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200 space-y-2">
          <h3 className="text-xs font-bold text-blue-700 flex items-center gap-1">
            <CalendarPlus className="w-3.5 h-3.5" /> אירועים משפחתיים ({familyEvents.length})
          </h3>
          <div className="space-y-1.5">
            {familyEvents.map(ev => {
              const days = getDaysUntilBirthday(ev.event_date);
              const typeDef = EVENT_TYPES.find(t => t.id === ev.event_type);
              return (
                <div key={ev.id} className="flex items-center gap-2 text-sm bg-white/70 rounded-lg p-2">
                  <span className="text-lg">{ev.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate">{ev.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span>{typeDef?.label.split(" ").slice(1).join(" ") ?? ev.event_type}</span>
                      <span>•</span>
                      <span>{format(parseISO(ev.event_date), "d בMMMM", { locale: he })}</span>
                      {ev.recurring && <span>🔄</span>}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: ev.color }}>
                    {days === 0 ? "🎉 היום!" : `עוד ${days} ימים`}
                  </span>
                  <button onClick={() => editEvent(ev)} className="p-1 rounded bg-muted hover:bg-muted/80">
                    <Edit2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteEntry(ev.id, true)} className="p-1 rounded bg-muted hover:bg-destructive/10">
                    <Trash2 className="w-3 h-3 text-destructive/60" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TIMELINE VIEW ═══ */}
      {viewMode === "timeline" && birthdays.length > 0 && (
        <div className="relative pr-6">
          <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-purple-300 to-blue-300 rounded-full" />
          <div className="space-y-4">
            {sorted.map((b, i) => {
              const days = getDaysUntilBirthday(b.birth_date);
              const isToday = days === 0;
              const hebrewDate = getHebrewDate(parseISO(b.birth_date));
              return (
                <div key={b.id} className="relative bounce-in" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="absolute -right-[22px] top-4 w-5 h-5 rounded-full border-3 border-card shadow-md flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: b.color }}>💖</div>
                  <div className={`mr-4 rounded-2xl p-4 shadow-md border-2 ${isToday ? "ring-2 ring-yellow-400" : ""}`}
                    style={{ borderColor: b.color + "60", background: `linear-gradient(135deg, ${b.color}10, white)` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{b.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-black text-sm">{b.name}</h3>
                        <p className="text-xs text-muted-foreground">{b.relation} • גיל {getAge(b.birth_date)}</p>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="text-lg font-black" style={{ color: b.color }}>{isToday ? "🎉" : days}</div>
                        <div className="text-[10px] text-muted-foreground">{isToday ? "היום!" : "ימים"}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">
                        📅 {format(parseISO(b.birth_date), "d בMMMM yyyy", { locale: he })}
                      </span>
                      {hebrewDate && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          🕎 {hebrewDate}
                        </span>
                      )}
                      <a href={generateGoogleCalendarUrl(b)} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] flex items-center gap-1 hover:underline" style={{ color: b.color }}>
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

      {/* ═══ HOLIDAYS VIEW ═══ */}
      {viewMode === "holidays" && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border-2 border-blue-200">
            <h3 className="font-black text-sm mb-3 flex items-center gap-2">🕎 חגים ומועדים</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {JEWISH_HOLIDAYS.map((h, i) => {
                const approxDate = h.getApproxDate(new Date().getFullYear());
                return (
                  <div key={h.name} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-muted shadow-sm bounce-in"
                    style={{ animationDelay: `${i * 0.04}s` }}>
                    <span className="text-2xl">{h.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm">{h.name}</h4>
                      <p className="text-[10px] text-purple-600">{h.hebrewDate}</p>
                      {approxDate && (
                        <p className="text-[10px] text-muted-foreground">
                          ~{format(approxDate, "d בMMMM", { locale: he })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Birthdays near holidays */}
          {birthdays.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border-2 border-muted">
              <h3 className="font-black text-sm mb-2">🎂 ימי הולדת ליד חגים</h3>
              <div className="space-y-2">
                {birthdays.map(b => {
                  const bdDate = parseISO(b.birth_date);
                  const bdMonth = getMonth(bdDate);
                  const bdDay = getDate(bdDate);
                  const nearHolidays = JEWISH_HOLIDAYS.filter(h => {
                    const hd = h.getApproxDate(new Date().getFullYear());
                    if (!hd) return false;
                    const diff = Math.abs(differenceInDays(new Date(2024, bdMonth, bdDay), hd));
                    return diff <= 14;
                  });
                  if (nearHolidays.length === 0) return null;
                  return (
                    <div key={b.id} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg px-3 py-2">
                      <span>{b.emoji}</span>
                      <span className="font-bold">{b.name}</span>
                      <span className="text-[10px] text-muted-foreground">ליד</span>
                      {nearHolidays.map(h => (
                        <span key={h.name} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          {h.emoji} {h.name}
                        </span>
                      ))}
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Dialog */}
      {inviteFor && (
        <BirthdayInviteDialog birthday={inviteFor} onClose={() => setInviteFor(null)} />
      )}
    </div>
  );
}
