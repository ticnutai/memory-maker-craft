import { test, expect } from "@playwright/test";

test.describe("Home Page — Card Set Selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads the home page with title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("משחקי זיכרון");
  });

  test("shows card set grid with built-in sets", async ({ page }) => {
    // Should have card set buttons (animals, fruits, vehicles, etc.)
    const setButtons = page.locator("button").filter({ hasText: /חיות|פירות|כלי רכב|אותיות|צורות/ });
    await expect(setButtons.first()).toBeVisible({ timeout: 10000 });
    const count = await setButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("shows bottom navigation tabs (memory, treasure, train)", async ({ page }) => {
    // 3 tab buttons at bottom
    const navButtons = page.locator("div.fixed.bottom-\\[max").locator("button");
    await expect(navButtons).toHaveCount(3);
  });

  test("shows settings FAB button", async ({ page }) => {
    // The settings gear button (fixed bottom-right)
    const settingsFab = page.locator("button.fixed").filter({ has: page.locator("svg") }).first();
    await expect(settingsFab).toBeVisible();
  });

  test("clicking a card set starts the game", async ({ page }) => {
    // Click the first card set (animals)
    const animalButton = page.locator("button").filter({ hasText: "חיות" }).first();
    await animalButton.click();

    // Should navigate to game board — look for game elements
    await expect(page.locator("text=🔄").or(page.locator("text=🏠"))).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Settings Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens settings panel when clicking gear icon", async ({ page }) => {
    // Click the settings FAB
    const settingsFab = page.locator("button.fixed.rounded-full").filter({ has: page.locator("svg") }).last();
    await settingsFab.click();

    // Settings panel should appear with title
    await expect(page.locator("text=הגדרות").first()).toBeVisible({ timeout: 5000 });
  });

  test("settings panel has all tabs", async ({ page }) => {
    const settingsFab = page.locator("button.fixed.rounded-full").filter({ has: page.locator("svg") }).last();
    await settingsFab.click();

    await expect(page.locator("text=הגדרות").first()).toBeVisible({ timeout: 5000 });

    // Check all tab labels exist
    for (const tabLabel of ["כללי", "קלפים", "ערכות נושא", "מוזיקה", "ערכות", "גלריה", "ימי הולדת", "הקלטות", "פיתוח"]) {
      await expect(page.locator("button").filter({ hasText: tabLabel }).first()).toBeVisible();
    }
  });

  test("General tab — pair count slider works", async ({ page }) => {
    const settingsFab = page.locator("button.fixed.rounded-full").filter({ has: page.locator("svg") }).last();
    await settingsFab.click();
    await expect(page.locator("text=הגדרות").first()).toBeVisible({ timeout: 5000 });

    // Should be on General tab by default
    await expect(page.locator("text=מספר זוגות")).toBeVisible();
    await expect(page.locator("text=גודל קלפים")).toBeVisible();
    await expect(page.locator("text=גודל אלמנט")).toBeVisible();
  });

  test("General tab — sound and speech toggles visible", async ({ page }) => {
    const settingsFab = page.locator("button.fixed.rounded-full").filter({ has: page.locator("svg") }).last();
    await settingsFab.click();
    await expect(page.locator("text=הגדרות").first()).toBeVisible({ timeout: 5000 });

    // Sound toggle
    await expect(page.locator("button").filter({ hasText: "צלילים" }).first()).toBeVisible();
    // Speech toggle
    await expect(page.locator("button").filter({ hasText: "הכרזה" }).first()).toBeVisible();
  });

  test("General tab — speech rate slider visible when speech enabled", async ({ page }) => {
    const settingsFab = page.locator("button.fixed.rounded-full").filter({ has: page.locator("svg") }).last();
    await settingsFab.click();
    await expect(page.locator("text=הגדרות").first()).toBeVisible({ timeout: 5000 });

    // Speech rate slider should be visible (speech is enabled by default)
    await expect(page.locator("text=מהירות הקריין")).toBeVisible();
  });

  test("General tab — layout mode and animations toggle", async ({ page }) => {
    const settingsFab = page.locator("button.fixed.rounded-full").filter({ has: page.locator("svg") }).last();
    await settingsFab.click();
    await expect(page.locator("text=הגדרות").first()).toBeVisible({ timeout: 5000 });

    await expect(page.locator("text=מיקום קלפים")).toBeVisible();
    await expect(page.locator("text=גריד אוטומטי")).toBeVisible();
    await expect(page.locator("text=אנימציות ואפקטים")).toBeVisible();
  });
});

test.describe("Music & Voice Settings Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Open settings
    const settingsFab = page.locator("button.fixed.rounded-full").filter({ has: page.locator("svg") }).last();
    await settingsFab.click();
    await expect(page.locator("text=הגדרות").first()).toBeVisible({ timeout: 5000 });
    // Click Music tab
    await page.locator("button").filter({ hasText: "מוזיקה" }).first().click();
  });

  test("Music tab shows background music options", async ({ page }) => {
    await expect(page.locator("text=מוזיקת רקע")).toBeVisible();
    // Music type buttons
    await expect(page.locator("button").filter({ hasText: "ללא" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "שירים" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "העלאה" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "ענן" }).first()).toBeVisible();
  });

  test("Music tab shows SFX mode options", async ({ page }) => {
    await expect(page.locator("text=מקור אפקטי צליל")).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "מובנה" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "ElevenLabs" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "שניהם" }).first()).toBeVisible();
  });

  test("Music tab shows AI voice effects toggle", async ({ page }) => {
    await expect(page.locator("text=אפקטי קול AI")).toBeVisible();
  });

  test("Music tab shows speech language selector", async ({ page }) => {
    await expect(page.locator("text=שפת קריינות")).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "עברית" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "English" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "Deutsch" }).first()).toBeVisible();
  });

  test("SFX mode can be switched", async ({ page }) => {
    // Click ElevenLabs SFX mode
    const elevenLabsBtn = page.locator("button").filter({ hasText: "ElevenLabs" }).first();
    await elevenLabsBtn.click();
    // Should show AI description
    await expect(page.locator("text=אפקטי צליל מיוצרים על ידי AI")).toBeVisible();
  });

  test("Speech language can be changed", async ({ page }) => {
    const enBtn = page.locator("button").filter({ hasText: "English" }).first();
    await enBtn.click();
    // The button should become active (has game-pink class)
    await expect(enBtn).toHaveClass(/bg-game-pink/);
  });

  test("Builtin melodies shown when selecting שירים", async ({ page }) => {
    // Click "שירים" button
    await page.locator("button").filter({ hasText: "שירים" }).first().click();
    // Should show melody grid
    await expect(page.locator("text=כוכב קטן").or(page.locator("text=נשיכת גלידה"))).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Cards Design Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const settingsFab = page.locator("button.fixed.rounded-full").filter({ has: page.locator("svg") }).last();
    await settingsFab.click();
    await expect(page.locator("text=הגדרות").first()).toBeVisible({ timeout: 5000 });
    await page.locator("button").filter({ hasText: "קלפים" }).first().click();
  });

  test("Cards tab shows card design options", async ({ page }) => {
    await expect(page.locator("text=עיצוב הקלפים")).toBeVisible();
    await expect(page.locator("text=צורת הקלף")).toBeVisible();
    await expect(page.locator("text=עובי מסגרת")).toBeVisible();
    await expect(page.locator("text=צבע מסגרת")).toBeVisible();
    await expect(page.locator("text=צבע גב הקלף")).toBeVisible();
  });

  test("Card shape buttons work", async ({ page }) => {
    // Click "מעוגל" shape
    await page.locator("button").filter({ hasText: "מעוגל" }).first().click();
    await expect(page.locator("button").filter({ hasText: "מעוגל" }).first()).toHaveClass(/bg-game-pink/);
  });
});

test.describe("Game Board", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Click animals set to start game
    const animalButton = page.locator("button").filter({ hasText: "חיות" }).first();
    await animalButton.click();
    // Wait for game board to load
    await page.waitForTimeout(1000);
  });

  test("game board renders cards", async ({ page }) => {
    // Cards should be visible
    const cards = page.locator("[class*='perspective']").or(page.locator("[class*='card']"));
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("home button returns to card selection", async ({ page }) => {
    // Find and click home button
    const homeBtn = page.locator("button").filter({ hasText: "🏠" }).first();
    await homeBtn.click();

    // Should be back on home page
    await expect(page.locator("h1")).toContainText("משחקי זיכרון");
  });

  test("restart button exists on game board", async ({ page }) => {
    await expect(page.locator("button").filter({ hasText: "🔄" }).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Navigation — Game Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("can navigate to treasure hunt game", async ({ page }) => {
    // Click the treasure (map) tab — second nav button
    const navButtons = page.locator("div.fixed").filter({ has: page.locator("button") }).locator("button");
    // The map/treasure button
    const treasureBtn = page.locator("button").filter({ has: page.locator("[class*='lucide-map']") }).first();
    await treasureBtn.click();

    // Should show treasure hunt content
    await expect(page.locator("text=ציד אוצרות").or(page.locator("text=מצאו"))).toBeVisible({ timeout: 10000 });
  });

  test("can navigate to train game", async ({ page }) => {
    const trainBtn = page.locator("button").filter({ has: page.locator("[class*='lucide-train']") }).first();
    await trainBtn.click();

    // Should show train game content
    await expect(page.locator("text=רכבת").or(page.locator("text=תחנה"))).toBeVisible({ timeout: 10000 });
  });

  test("can return to memory game from other tabs", async ({ page }) => {
    // Go to train
    const trainBtn = page.locator("button").filter({ has: page.locator("[class*='lucide-train']") }).first();
    await trainBtn.click();
    await page.waitForTimeout(500);

    // Go back to memory
    const memoryBtn = page.locator("button").filter({ has: page.locator("[class*='lucide-gamepad']") }).first();
    await memoryBtn.click();

    await expect(page.locator("h1")).toContainText("משחקי זיכרון");
  });
});

test.describe("Themes Tab", () => {
  test("themes tab opens and shows theme builder", async ({ page }) => {
    await page.goto("/");
    const settingsFab = page.locator("button.fixed.rounded-full").filter({ has: page.locator("svg") }).last();
    await settingsFab.click();
    await expect(page.locator("text=הגדרות").first()).toBeVisible({ timeout: 5000 });

    await page.locator("button").filter({ hasText: "ערכות נושא" }).first().click();
    // Theme builder should render
    await page.waitForTimeout(500);
    // Should see theme-related content
    const themeContent = page.locator("[class*='grid']").or(page.locator("text=ערכת נושא"));
    await expect(themeContent.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Responsive / Mobile", () => {
  test("home page is usable on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("משחקי זיכרון");
    // Card sets should still be visible
    const setButtons = page.locator("button").filter({ hasText: /חיות|פירות/ });
    await expect(setButtons.first()).toBeVisible({ timeout: 10000 });
  });
});
