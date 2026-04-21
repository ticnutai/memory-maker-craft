import { buildWeeklyFamilyPlan, getQuickGameSuggestions, pickActivityOfTheDay } from "@/lib/familyActivities";

describe("familyActivities", () => {
  it("creates a full 7-day plan", () => {
    const plan = buildWeeklyFamilyPlan("2026-04-22");
    expect(plan).toHaveLength(7);
    expect(new Set(plan.map((item) => item.idea.id)).size).toBe(7);
  });

  it("is deterministic for a given date", () => {
    const a = pickActivityOfTheDay("2026-04-22");
    const b = pickActivityOfTheDay("2026-04-22");
    expect(a.id).toBe(b.id);
  });

  it("returns quick game suggestions", () => {
    const games = getQuickGameSuggestions();
    expect(games.length).toBeGreaterThanOrEqual(3);
    expect(games.every((item) => item.category === "game")).toBe(true);
  });
});
