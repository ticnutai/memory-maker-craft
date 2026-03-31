import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GIRL_ANIMALS,
  BOY_ANIMALS,
  createGameCards,
  getCardSets,
  shuffleArray,
  type CardData,
} from "@/lib/gameData";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getCardSets", () => {
  it("returns all configured card sets", () => {
    const sets = getCardSets("girl");
    expect(sets.length).toBeGreaterThan(20);
  });

  it("switches animals cards by theme", () => {
    const girlAnimals = getCardSets("girl").find((set) => set.type === "animals");
    const boyAnimals = getCardSets("boy").find((set) => set.type === "animals");

    expect(girlAnimals?.cards).toEqual(GIRL_ANIMALS);
    expect(boyAnimals?.cards).toEqual(BOY_ANIMALS);
  });
});

describe("shuffleArray", () => {
  it("does not mutate input array", () => {
    const original = [1, 2, 3, 4];
    const snapshot = [...original];

    shuffleArray(original);

    expect(original).toEqual(snapshot);
  });

  it("returns same members even after shuffle", () => {
    const original = ["a", "b", "c", "d"];
    const shuffled = shuffleArray(original);

    expect(shuffled).toHaveLength(original.length);
    expect([...shuffled].sort()).toEqual([...original].sort());
  });
});

describe("createGameCards", () => {
  const sourceCards: CardData[] = [
    { id: "cat", emoji: "🐱" },
    { id: "dog", emoji: "🐶" },
    { id: "bird", emoji: "🐦" },
  ];

  it("creates two cards per selected pair", () => {
    const gameCards = createGameCards(sourceCards, 2);
    expect(gameCards).toHaveLength(4);

    const counts = gameCards.reduce<Record<string, number>>((acc, card) => {
      acc[card.id] = (acc[card.id] ?? 0) + 1;
      return acc;
    }, {});

    Object.values(counts).forEach((count) => expect(count).toBe(2));
    gameCards.forEach((card) => {
      expect(card.isFlipped).toBe(false);
      expect(card.isMatched).toBe(false);
      expect(card.uniqueId).toMatch(/-(a|b)$/);
    });
  });

  it("clamps pairCount to available cards", () => {
    const gameCards = createGameCards(sourceCards, 99);
    expect(gameCards).toHaveLength(sourceCards.length * 2);
  });

  it("returns empty array for invalid pairCount values", () => {
    expect(createGameCards(sourceCards, -1)).toEqual([]);
    expect(createGameCards(sourceCards, 0)).toEqual([]);
    expect(createGameCards(sourceCards, Number.NaN)).toEqual([]);
  });

  it("uses floored integer for pairCount", () => {
    const gameCards = createGameCards(sourceCards, 2.9);
    expect(gameCards).toHaveLength(4);
  });

  it("is deterministic when Math.random is mocked", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const run1 = createGameCards(sourceCards, 2).map((card) => card.uniqueId);
    const run2 = createGameCards(sourceCards, 2).map((card) => card.uniqueId);

    expect(run1).toEqual(run2);
  });
});
