import { test, expect } from '@playwright/test';

test.describe('DrishtiAssist Accessible Assistive Walk Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant camera and microphone permissions automatically for testing
    await context.grantPermissions(['camera', 'microphone']);

    // Emulate media devices with fake video stream
    await page.addInitScript(() => {
      // Mock getUserMedia with a simulated video canvas stream
      const origGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia = async (constraints) => {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#333333';
          ctx.fillRect(0, 0, 640, 480);
          const stream = (canvas as any).captureStream(10);
          return stream;
        };
      }
    });

    await page.goto('http://localhost:3000');
  });

  test('completes first-run onboarding and starts hazard detection', async ({ page }) => {
    // 1. Verify Onboarding Modal appears on first visit with cane safety reminder
    const onboardingTitle = page.locator('#onboarding-title');
    await expect(onboardingTitle).toBeVisible();
    await expect(page.locator('text=White Cane Safety Rule')).toBeVisible();

    // 2. Dismiss onboarding
    const dismissButton = page.locator('button:has-text("I understand, start using Drishti")');
    await dismissButton.click();
    await expect(onboardingTitle).not.toBeVisible();

    // 3. Verify Skip-to-content accessibility link exists
    const skipLink = page.locator('a:has-text("Skip to main content")');
    await expect(skipLink).toBeAttached();

    // 4. Verify Giant Start Button is present
    const startButton = page.locator('button[aria-label="Start Hazard Detection"]');
    await expect(startButton).toBeVisible();

    // 5. Start Hazard Detection
    await startButton.click();

    // 6. Verify Stop Button appears
    const stopButton = page.locator('button[aria-label="Stop Hazard Detection"]');
    await expect(stopButton).toBeVisible();

    // 7. Verify 3-Zone Hazard Radar renders Left, Ahead, Right cards
    await expect(page.locator('text=LEFT')).toBeVisible();
    await expect(page.locator('text=AHEAD')).toBeVisible();
    await expect(page.locator('text=RIGHT')).toBeVisible();

    // 8. Verify Spoken Live Region is present and aria-live="assertive"
    const liveRegion = page.locator('[aria-live="assertive"]');
    await expect(liveRegion).toBeVisible();

    // 9. Stop Detection
    await stopButton.click();
    await expect(page.locator('button[aria-label="Start Hazard Detection"]')).toBeVisible();
  });

  test('switches language between English and Hindi', async ({ page }) => {
    // Dismiss onboarding if present
    const dismissButton = page.locator('button:has-text("I understand, start using Drishti")');
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }

    // Click Hindi toggle button
    const langToggle = page.locator('button[aria-label*="Switch to Hindi"]');
    await langToggle.click();

    // Verify UI reflects Hindi copy
    await expect(page.locator('text=पहचान शुरू करें')).toBeVisible();
    await expect(page.locator('text=खतरा रडार')).toBeVisible();
  });
});
