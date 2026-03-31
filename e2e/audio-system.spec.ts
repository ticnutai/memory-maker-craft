import { test, expect, Locator, Page } from "@playwright/test";

async function openSettings(page: Page) {
  const settingsFab = page
    .locator("button.fixed.rounded-full")
    .filter({ has: page.locator("svg") })
    .last();
  await settingsFab.click();
  await expect(page.locator("text=הגדרות").first()).toBeVisible({ timeout: 5000 });
}

async function openMusicTab(page: Page) {
  await page.locator("button").filter({ hasText: "מוזיקה" }).last().click();
  await expect(page.locator("text=מוזיקת רקע")).toBeVisible();
}

async function startMemoryGame(page: Page) {
  await page.locator("button").filter({ hasText: "חיות" }).first().click();
  await expect(page.getByRole("button", { name: "קלף הפוך" }).first()).toBeVisible({ timeout: 10000 });
}

async function openAudioMixer(page: Page) {
  const directMixerButton = page.locator('button[title="מיקסר שמע"]').first();
  if (await directMixerButton.count()) {
    await directMixerButton.click();
  } else {
    await page.locator('button[title*="עוצמה"]').first().dblclick();
  }
  await expect(page.locator("text=מיקסר שמע סטריאו")).toBeVisible();
}

async function setSliderToMin(slider: Locator) {
  await slider.focus();
  await slider.press("Home");
}

async function setSliderToMax(slider: Locator) {
  await slider.focus();
  await slider.press("End");
}

test.describe("Audio System — Playwright", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("music settings expose all core audio controls", async ({ page }) => {
    await openSettings(page);
    await openMusicTab(page);

    await expect(page.locator("text=מוזיקת רקע")).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "ללא" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "שירים" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "העלאה" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "ענן" }).first()).toBeVisible();

    await expect(page.locator("text=מקור אפקטי צליל")).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "מובנה" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "ElevenLabs" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "שניהם" }).first()).toBeVisible();

    await expect(page.locator("text=אפקטי קול AI")).toBeVisible();
    await expect(page.locator("text=שפת קריינות")).toBeVisible();
  });

  test("sfx mode and speech language can switch in settings", async ({ page }) => {
    await openSettings(page);
    await openMusicTab(page);

    const elevenLabsBtn = page.locator("button").filter({ hasText: "ElevenLabs" }).first();
    await elevenLabsBtn.click();
    await expect(page.locator("text=אפקטי צליל מיוצרים על ידי AI")).toBeVisible();

    const bothBtn = page.locator("button").filter({ hasText: "שניהם" }).first();
    await bothBtn.click();
    await expect(page.locator("text=שילוב של שני המקורות יחד")).toBeVisible();

    const englishBtn = page.locator("button").filter({ hasText: "English" }).first();
    await englishBtn.click();
    await expect(englishBtn).toHaveClass(/bg-game-pink/);

    const germanBtn = page.locator("button").filter({ hasText: "Deutsch" }).first();
    await germanBtn.click();
    await expect(germanBtn).toHaveClass(/bg-game-pink/);
  });

  test("game audio mixer opens with three working sliders", async ({ page }) => {
    await startMemoryGame(page);
    await openAudioMixer(page);

    const mixerPanel = page.locator("div").filter({ hasText: "מיקסר שמע סטריאו" }).last();
    const sliders = mixerPanel.getByRole("slider");
    await expect(sliders).toHaveCount(3);

    const musicSlider = sliders.nth(0);
    await setSliderToMin(musicSlider);
    await expect(musicSlider).toHaveAttribute("aria-valuenow", "0");

    await setSliderToMax(musicSlider);
    await expect(musicSlider).toHaveAttribute("aria-valuenow", "100");

    await expect(mixerPanel.locator("text=/dbg:/")).toBeVisible();
  });

  test("mixer sliders update debug readout for sound and speech", async ({ page }) => {
    await startMemoryGame(page);
    await openAudioMixer(page);

    const mixerPanel = page.locator("div").filter({ hasText: "מיקסר שמע סטריאו" }).last();
    const sliders = mixerPanel.getByRole("slider");

    const soundSlider = sliders.nth(1);
    const speechSlider = sliders.nth(2);

    await setSliderToMin(soundSlider);
    await setSliderToMin(speechSlider);

    await expect(mixerPanel.locator("text=/dbg:/")).toContainText("s:0");
    await expect(mixerPanel.locator("text=/dbg:/")).toContainText("v:0");
  });
});
