// Calendar visual theme presets
export interface CalendarTheme {
  id: string;
  name: string;
  emoji: string;
  // toolbar
  toolbarBg: string;
  toolbarBorder: string;
  toolbarText: string;
  // today banner
  bannerBg: string;
  bannerBorder: string;
  // day cells
  todayRing: string;
  todayBg: string;
  todayText: string;
  satBg: string;
  yomTovBg: string;
  hebDateText: string;
  // card / container
  cardBg: string;
  cardBorder: string;
  headerBg: string;
}

export const CALENDAR_THEMES: CalendarTheme[] = [
  {
    id: "rose",
    name: "ורוד קלאסי",
    emoji: "🌸",
    toolbarBg: "bg-gradient-to-r from-pink-50 to-purple-50",
    toolbarBorder: "border-pink-200",
    toolbarText: "text-purple-800",
    bannerBg: "bg-gradient-to-l from-purple-100 via-pink-50 to-yellow-50",
    bannerBorder: "border-purple-200",
    todayRing: "ring-yellow-400",
    todayBg: "bg-yellow-50/70",
    todayText: "text-yellow-700",
    satBg: "bg-blue-50/40",
    yomTovBg: "bg-amber-50/60",
    hebDateText: "text-purple-700",
    cardBg: "bg-card",
    cardBorder: "border-muted",
    headerBg: "bg-muted/50",
  },
  {
    id: "ocean",
    name: "אוקיינוס",
    emoji: "🌊",
    toolbarBg: "bg-gradient-to-r from-sky-50 to-cyan-50",
    toolbarBorder: "border-sky-200",
    toolbarText: "text-sky-800",
    bannerBg: "bg-gradient-to-l from-sky-100 via-cyan-50 to-blue-50",
    bannerBorder: "border-sky-200",
    todayRing: "ring-cyan-400",
    todayBg: "bg-cyan-50/70",
    todayText: "text-cyan-700",
    satBg: "bg-sky-50/50",
    yomTovBg: "bg-teal-50/60",
    hebDateText: "text-sky-700",
    cardBg: "bg-sky-50/30",
    cardBorder: "border-sky-200",
    headerBg: "bg-sky-100/50",
  },
  {
    id: "forest",
    name: "יער ירוק",
    emoji: "🌿",
    toolbarBg: "bg-gradient-to-r from-emerald-50 to-green-50",
    toolbarBorder: "border-emerald-200",
    toolbarText: "text-emerald-800",
    bannerBg: "bg-gradient-to-l from-emerald-100 via-green-50 to-lime-50",
    bannerBorder: "border-emerald-200",
    todayRing: "ring-lime-400",
    todayBg: "bg-lime-50/70",
    todayText: "text-lime-700",
    satBg: "bg-green-50/50",
    yomTovBg: "bg-amber-50/60",
    hebDateText: "text-emerald-700",
    cardBg: "bg-green-50/30",
    cardBorder: "border-emerald-200",
    headerBg: "bg-emerald-100/50",
  },
  {
    id: "sunset",
    name: "שקיעה",
    emoji: "🌅",
    toolbarBg: "bg-gradient-to-r from-orange-50 to-amber-50",
    toolbarBorder: "border-orange-200",
    toolbarText: "text-orange-800",
    bannerBg: "bg-gradient-to-l from-orange-100 via-amber-50 to-yellow-50",
    bannerBorder: "border-orange-200",
    todayRing: "ring-orange-400",
    todayBg: "bg-orange-50/70",
    todayText: "text-orange-700",
    satBg: "bg-amber-50/40",
    yomTovBg: "bg-yellow-50/60",
    hebDateText: "text-orange-700",
    cardBg: "bg-amber-50/30",
    cardBorder: "border-orange-200",
    headerBg: "bg-orange-100/50",
  },
  {
    id: "lavender",
    name: "לבנדר",
    emoji: "💜",
    toolbarBg: "bg-gradient-to-r from-violet-50 to-fuchsia-50",
    toolbarBorder: "border-violet-200",
    toolbarText: "text-violet-800",
    bannerBg: "bg-gradient-to-l from-violet-100 via-fuchsia-50 to-pink-50",
    bannerBorder: "border-violet-200",
    todayRing: "ring-violet-400",
    todayBg: "bg-violet-50/70",
    todayText: "text-violet-700",
    satBg: "bg-fuchsia-50/40",
    yomTovBg: "bg-amber-50/60",
    hebDateText: "text-violet-700",
    cardBg: "bg-violet-50/20",
    cardBorder: "border-violet-200",
    headerBg: "bg-violet-100/50",
  },
  {
    id: "gold",
    name: "זהב מלכותי",
    emoji: "👑",
    toolbarBg: "bg-gradient-to-r from-yellow-50 to-amber-50",
    toolbarBorder: "border-yellow-300",
    toolbarText: "text-yellow-800",
    bannerBg: "bg-gradient-to-l from-yellow-100 via-amber-50 to-orange-50",
    bannerBorder: "border-yellow-300",
    todayRing: "ring-yellow-500",
    todayBg: "bg-yellow-100/70",
    todayText: "text-yellow-800",
    satBg: "bg-amber-50/40",
    yomTovBg: "bg-orange-50/60",
    hebDateText: "text-amber-700",
    cardBg: "bg-yellow-50/30",
    cardBorder: "border-yellow-200",
    headerBg: "bg-yellow-100/50",
  },
];

const STORAGE_KEY = "calendar-theme-id";

export function loadCalendarTheme(): CalendarTheme {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    const found = CALENDAR_THEMES.find(t => t.id === id);
    if (found) return found;
  } catch { /* fallback */ }
  return CALENDAR_THEMES[0];
}

export function saveCalendarTheme(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
}
