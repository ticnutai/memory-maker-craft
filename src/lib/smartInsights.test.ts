import { analyzeSmartHome } from "@/lib/smartInsights";

describe("smartInsights", () => {
  it("reduces score when home setup is weak", () => {
    const result = analyzeSmartHome({
      collageCount: 1,
      photoCount: 3,
      birthdayCount: 1,
      eventCount: 0,
      hasHomeCollage: false,
      slideshowEnabled: false,
      reducedMotionEnabled: false,
      richAnimationsEnabled: false,
    });

    expect(result.score).toBeLessThan(80);
    expect(result.recommendations.length).toBeGreaterThan(1);
  });

  it("returns high score for healthy setup", () => {
    const result = analyzeSmartHome({
      collageCount: 5,
      photoCount: 24,
      birthdayCount: 5,
      eventCount: 4,
      hasHomeCollage: true,
      slideshowEnabled: true,
      reducedMotionEnabled: false,
      richAnimationsEnabled: false,
    });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.recommendations[0].id).toBe("great-shape");
  });
});
