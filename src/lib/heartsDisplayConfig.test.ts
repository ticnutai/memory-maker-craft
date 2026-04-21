import {
  getFloatPresetPatch,
  loadHeartsConfig,
  saveHeartsConfig,
  type HeartsDisplayConfig,
} from "@/lib/heartsDisplayConfig";

describe("heartsDisplayConfig", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads defaults when storage is empty", () => {
    const cfg = loadHeartsConfig();

    expect(cfg.enabled).toBe(true);
    expect(cfg.filterMode).toBe("month");
    expect(cfg.floatPreset).toBe("balanced");
    expect(cfg.floatDirection).toBe("up");
  });

  it("saves and loads config safely", () => {
    const next: HeartsDisplayConfig = {
      ...loadHeartsConfig(),
      filterMode: "year",
      floatDirection: "down",
      floatPreset: "custom",
      floatSpeedScale: 1.7,
    };

    saveHeartsConfig(next);
    const loaded = loadHeartsConfig();

    expect(loaded.filterMode).toBe("year");
    expect(loaded.floatDirection).toBe("down");
    expect(loaded.floatPreset).toBe("custom");
    expect(loaded.floatSpeedScale).toBe(1.7);
  });

  it("returns tuned preset patch for mobile soft profile", () => {
    const patch = getFloatPresetPatch("soft", {
      isMobile: true,
      prefersReducedMotion: false,
      lowPowerDevice: true,
    });

    expect(patch.floatSizeScale).toBeLessThan(1);
    expect(patch.floatSpeedScale).toBeLessThan(1);
    expect(patch.reducedMotion).toBe(true);
  });
});
