// Family page theme system - presets + custom theme support
export interface FamilyTheme {
  id: string;
  name: string;
  emoji: string;
  background: string; // CSS background value
  cardBg: string; // CSS bg for cards/surfaces (with alpha)
  accent: string; // hex/hsl color for accent
  textOnBg: string; // tailwind class for text color
  decoration?: "hearts" | "stars" | "leaves" | "confetti" | "dots" | "none";
}

export const FAMILY_THEMES: FamilyTheme[] = [
  {
    id: "warm-pastel",
    name: "פסטל חם",
    emoji: "🌸",
    background: "linear-gradient(135deg, #ffe5ec 0%, #fff5d6 50%, #ffe1c4 100%)",
    cardBg: "rgba(255, 255, 255, 0.7)",
    accent: "#f472b6",
    textOnBg: "text-rose-900",
    decoration: "hearts",
  },
  {
    id: "sunny",
    name: "שמש",
    emoji: "☀️",
    background: "linear-gradient(135deg, #fff8e1 0%, #ffe5b4 50%, #ffd5a5 100%)",
    cardBg: "rgba(255, 255, 255, 0.75)",
    accent: "#f59e0b",
    textOnBg: "text-amber-900",
    decoration: "stars",
  },
  {
    id: "ocean",
    name: "ים תכלת",
    emoji: "🌊",
    background: "linear-gradient(135deg, #e0f7fa 0%, #bbe6fd 50%, #d4eaff 100%)",
    cardBg: "rgba(255, 255, 255, 0.75)",
    accent: "#0ea5e9",
    textOnBg: "text-sky-900",
    decoration: "dots",
  },
  {
    id: "garden",
    name: "גינה",
    emoji: "🌿",
    background: "linear-gradient(135deg, #e7f5e1 0%, #c8e6c9 50%, #f0f4c3 100%)",
    cardBg: "rgba(255, 255, 255, 0.75)",
    accent: "#10b981",
    textOnBg: "text-green-900",
    decoration: "leaves",
  },
  {
    id: "celebration",
    name: "חגיגה",
    emoji: "🎉",
    background: "linear-gradient(135deg, #fce7f3 0%, #ddd6fe 50%, #fde68a 100%)",
    cardBg: "rgba(255, 255, 255, 0.8)",
    accent: "#a855f7",
    textOnBg: "text-purple-900",
    decoration: "confetti",
  },
  {
    id: "minimal",
    name: "מינימלי",
    emoji: "⚪",
    background: "linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%)",
    cardBg: "rgba(255, 255, 255, 0.9)",
    accent: "#6b7280",
    textOnBg: "text-gray-800",
    decoration: "none",
  },
  {
    id: "night",
    name: "ערב כוכבים",
    emoji: "🌙",
    background: "linear-gradient(135deg, #1e293b 0%, #312e81 50%, #4c1d95 100%)",
    cardBg: "rgba(255, 255, 255, 0.1)",
    accent: "#fbbf24",
    textOnBg: "text-white",
    decoration: "stars",
  },
];

const STORAGE_KEY = "family-home-theme";
const CUSTOM_KEY = "family-home-custom-theme";

export function loadFamilyTheme(): FamilyTheme {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id === "custom") {
      const custom = localStorage.getItem(CUSTOM_KEY);
      if (custom) return JSON.parse(custom);
    }
    const found = FAMILY_THEMES.find((t) => t.id === id);
    if (found) return found;
  } catch { /* fall through */ }
  return FAMILY_THEMES[0];
}

export function saveFamilyTheme(theme: FamilyTheme) {
  localStorage.setItem(STORAGE_KEY, theme.id);
  if (theme.id === "custom") {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(theme));
  }
}

export function loadCustomTheme(): FamilyTheme | null {
  try {
    const c = localStorage.getItem(CUSTOM_KEY);
    return c ? JSON.parse(c) : null;
  } catch { return null; }
}
