const STORAGE_KEY = "family-hearts-display-config";

export type HeartsFilterMode = "all" | "month" | "30days" | "7days";
export type HeartsDisplayStyle = "hearts" | "bubbles" | "cards" | "compact";

export interface HeartsDisplayConfig {
  enabled: boolean;
  filterMode: HeartsFilterMode;
  displayStyle: HeartsDisplayStyle;
  /** Whether hearts/items float (animate) */
  floatAnimation: boolean;
  /** Which event types to show (empty = all) */
  eventTypes: string[];
}

const DEFAULTS: HeartsDisplayConfig = {
  enabled: true,
  filterMode: "month",
  displayStyle: "hearts",
  floatAnimation: true,
  eventTypes: [],
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
}
