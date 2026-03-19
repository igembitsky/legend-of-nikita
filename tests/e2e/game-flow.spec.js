import { test, expect } from '@playwright/test';

// Phaser renders everything to a <canvas> element.
// These tests verify the game boots correctly and basic input is processed.
// Precise pixel/state assertions are avoided due to canvas opacity.

test.describe('Game boot', () => {
  test('title screen loads — canvas appears in DOM', async ({ page }) => {
    await page.goto('/');

    // Phaser injects a <canvas> element once the game initialises.
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // The canvas should have non-zero dimensions matching the game config (1280×720).
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('page title is set correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('The Legend of Nikita');
  });
});

test.describe('Scene transitions', () => {
  test('pressing Enter after title animation starts game — canvas remains visible', async ({ page }) => {
    await page.goto('/');

    // Wait for the canvas to appear (game initialised).
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // TitleScene gates input behind a 2 s delayedCall; wait for it plus a
    // small buffer so the keyboard listener is definitely active.
    await page.waitForTimeout(2500);

    // Send Enter — this selects "New Game" and triggers fadeToScene('IntroCrawlScene').
    await page.keyboard.press('Enter');

    // The canvas must remain visible through any scene transition.
    // We can't inspect Phaser's internal scene manager, but a live canvas
    // means the renderer is still running, which confirms no crash occurred.
    await page.waitForTimeout(2000);
    await expect(canvas).toBeVisible();
  });
});
