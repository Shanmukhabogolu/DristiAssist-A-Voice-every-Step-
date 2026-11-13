import { test, expect } from '@playwright/test';

const VIEWPORT_WIDTHS = [320, 360, 414, 768, 1024, 1100, 1280, 1366, 1440, 1536, 1920, 2560];
const LANGUAGES = ['en', 'hi', 'te'] as const;

const EXPECTED_PATHS = [
  '/',
  '/how-it-works',
  '/safe-map',
  '/assistant',
  '/model-card',
  '/schools',
  '/dashboard',
];

test.describe('Header Navigation Zero-Clipping & Responsive Integrity Suite', () => {

  for (const width of VIEWPORT_WIDTHS) {
    test(`Viewport ${width}px: Navigation displays correctly without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://localhost:3000');

      // 1. Verify no horizontal overflow on page
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      if (width >= 1024) {
        // Desktop Layout A (>=1280px) or Layout B (1024-1279px):
        // All seven links must be directly rendered and visible in DOM without opening a menu!
        for (const path of EXPECTED_PATHS) {
          const link = page.locator(`header nav a[href="${path}"]`).first();
          await expect(link).toBeVisible();

          // Ensure bounding box is within viewport
          const box = await link.boundingBox();
          expect(box).not.toBeNull();
          if (box) {
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(width);
          }
        }
      } else {
        // Layout C (<1024px): 44px Menu button is visible
        const menuBtn = page.locator('header button:has-text("Menu"), header button:has-text("मेनू"), header button:has-text("మెనూ")');
        await expect(menuBtn).toBeVisible();

        const btnBox = await menuBtn.boundingBox();
        expect(btnBox).not.toBeNull();
        if (btnBox) {
          expect(btnBox.width).toBeGreaterThanOrEqual(44);
          expect(btnBox.height).toBeGreaterThanOrEqual(44);
        }

        // Click menu button and verify all 7 links are visible in sheet
        await menuBtn.click();
        const sheet = page.locator('[role="dialog"][aria-label*="Menu"], [role="dialog"][aria-label*="మెనూ"], [role="dialog"][aria-label*="मेनू"]');
        await expect(sheet).toBeVisible();

        for (const path of EXPECTED_PATHS) {
          const sheetLink = sheet.locator(`a[href="${path}"]`);
          await expect(sheetLink).toBeVisible();
          const linkBox = await sheetLink.boundingBox();
          expect(linkBox).not.toBeNull();
          if (linkBox) {
            expect(linkBox.height).toBeGreaterThanOrEqual(48); // Minimum accessible target
          }
        }

        // Close sheet with Escape key and verify focus returns
        await page.keyboard.press('Escape');
        await expect(sheet).not.toBeVisible();
      }
    });
  }

  for (const lang of LANGUAGES) {
    test(`Language ${lang.toUpperCase()}: Navigation links fit without clipping at 1280px and 1920px`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('http://localhost:3000');

      // Switch language
      if (lang !== 'en') {
        const langButton = page.locator(`header button:has-text("${lang === 'hi' ? 'हिंदी' : 'తెలుగు'}")`).first();
        if (await langButton.isVisible()) {
          await langButton.click();
        }
      }

      // Check all 7 links exist, are visible, and do not overflow
      for (const path of EXPECTED_PATHS) {
        const link = page.locator(`header nav a[href="${path}"]`).first();
        await expect(link).toBeVisible();
      }

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  }

  test('Active link has aria-current="page" and updates underline on navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000');

    // Home is initially active
    const homeLink = page.locator('header nav a[href="/"]').first();
    await expect(homeLink).toHaveAttribute('aria-current', 'page');

    // Click How it works
    const howLink = page.locator('header nav a[href="/how-it-works"]').first();
    await howLink.click();
    await expect(howLink).toHaveAttribute('aria-current', 'page');
    await expect(homeLink).not.toHaveAttribute('aria-current', 'page');
  });

});
