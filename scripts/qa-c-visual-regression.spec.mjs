import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { test, expect } = require(process.env.PLAYWRIGHT_MODULE ? path.join(process.env.PLAYWRIGHT_MODULE, 'test.js') : 'playwright/test');

const viewports = [
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 360, height: 844 },
];

for (const viewport of viewports) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
    test('approved C composition remains stable', async ({ page }) => {
      const response = await page.goto('/', { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      await page.locator('footer').scrollIntoViewIfNeeded();
      await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.scrollTo(0, 0));
      const actual = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth }));
      expect(actual).toEqual({ ...viewport, scrollWidth: viewport.width });
      const name = `home-${viewport.width}x${viewport.height}`;
      await expect(page).toHaveScreenshot(`${name}-first.png`, { animations: 'disabled', fullPage: false, maxDiffPixelRatio: 0.002 });
      await expect(page).toHaveScreenshot(`${name}-full.png`, { animations: 'disabled', fullPage: true, maxDiffPixelRatio: 0.002 });
    });
  });
}
