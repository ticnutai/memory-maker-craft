const STORAGE_KEY = "family-hearts-display-config";
export const HEARTS_CONFIG_UPDATED_EVENT = "family-hearts-config-updated";

export type HeartsFilterMode = "all" | "month" | "30days" | "7days";
export type HeartsDisplayStyle = "hearts" | "bubbles" | "cards" | "compact" | "floating";
export type FloatingEffect = "sparkles" | "confetti" | "pop";

export type FloatPresetId = "soft" | "balanced" | "rich";
export type FloatPresetSelection = FloatPresetId | "custom";
export type FloatAnimationType = "bounce" | "drift" | "pulse" | "swing" | "wander";
export type FloatEnvironment =
  | "theme"
  | "hearts"
  | "stars"
  | "leaves"
  | "confetti"
  | "dots"
  | "bubbles"
  | "butterflies"
  | "snow"
  | "petals";

export interface HeartsDisplayConfig {
  enabled: boolean;
  filterMode: HeartsFilterMode;
  displayStyle: HeartsDisplayStyle;
  /** Whether hearts/items float (animate) */
  floatAnimation: boolean;
  /** Animation type for floating elements */
  floatAnimationType: FloatAnimationType;
  /** Global floating size scale (0.5 - 2) */
  floatSizeScale: number;
  /** Global floating speed scale (0.4 - 2.5), higher = faster */
  floatSpeedScale: number;
  /** Global floating density scale (0.4 - 2.5), higher = more elements */
  floatDensityScale: number;
  /** Floating environment profile */
  floatEnvironment: FloatEnvironment;
  /** Accessibility: reduce motion */
  reducedMotion: boolean;
  /** Last selected preset for quick UI highlight */
  floatPreset: FloatPresetSelection;
  /** Which event types to show (empty = all) */
  eventTypes: string[];
  /** Floating effects to play on click */
  floatingEffects: FloatingEffect[];
  /** Whether floating items move together or independently */
  floatingIndependent: boolean;
  /** Whether items float across the full page (all styles) */
  floatFullPage: boolean;
  /** Whether items are draggable by mouse/touch */
  draggable: boolean;
}

const DEFAULTS: HeartsDisplayConfig = {
  enabled: true,
  filterMode: "month",
  displayStyle: "hearts",
  floatAnimation: true,
  floatAnimationType: "bounce",
  floatSizeScale: 1,
  floatSpeedScale: 1,
  floatDensityScale: 1,
  floatEnvironment: "theme",
  reducedMotion: false,
  floatPreset: "balanced",
  eventTypes: [],
  floatingEffects: ["sparkles", "confetti", "pop"],
  floatingIndependent: true,
  floatFullPage: false,
  draggable: true,
};

export function loadHeartsConfig(): HeartsDisplayConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveHeartsConfig(cfg: HeartsDisplayConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(HEARTS_CONFIG_UPDATED_EVENT));
  }
}

export function hasSavedHeartsConfig(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export function getFloatPresetPatch(
  preset: FloatPresetId,
  options?: { isMobile?: boolean; prefersReducedMotion?: boolean; lowPowerDevice?: boolean }
): Pick<HeartsDisplayConfig, "floatSizeScale" | "floatSpeedScale" | "floatDensityScale" | "reducedMotion"> {
  const isMobile = !!options?.isMobile;
  const prefersReducedMotion = !!options?.prefersReducedMotion;
  const lowPowerDevice = !!options?.lowPowerDevice;

  if (preset === "soft") {
    return {
      floatSizeScale: isMobile ? 0.75 : 0.85,
      floatSpeedScale: isMobile ? 0.65 : 0.75,
      floatDensityScale: isMobile ? 0.45 : 0.6,
      reducedMotion: true,
    };
  }

  if (preset === "rich") {
    return {
      floatSizeScale: isMobile ? 1 : 1.2,
      floatSpeedScale: isMobile ? 0.95 : 1.15,
      floatDensityScale: isMobile ? 0.95 : 1.45,
      reducedMotion: prefersReducedMotion,
    };
  }

  return {
    floatSizeScale: isMobile ? 0.9 : 1,
    floatSpeedScale: isMobile ? 0.85 : 1,
    floatDensityScale: isMobile ? 0.7 : 1.1,
    reducedMotion: prefersReducedMotion || (isMobile && lowPowerDevice),
  };
}
