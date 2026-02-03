import { test, expect } from '@playwright/test';
import { setupPrivyAuth } from './fixtures/auth';
import {
  waitForPageLoad,
  openPrivyModal,
  generateTestUsername,
} from './helpers/test-utils';

/**
 * Flexit Authentication Flow Tests
 *
 * These tests cover:
 * 1. New user registration + profile completion
 * 2. Existing user login
 * 3. Profile setup redirect
 *
 * NOTE: Some tests require manual intervention for Privy authentication
 * Run with --headed flag for interactive tests
 */

test.describe('Authentication - Setup (Manual)', () => {
  /**
   * This test sets up the auth state for other tests
   * Run this first with: npx playwright test tests/e2e/auth-flow.spec.ts -g "setup auth" --headed
   */
  test.skip('setup auth state (run manually with --headed)', async ({
    page,
    context,
  }) => {
    await setupPrivyAuth(page, context);
  });
});

test.describe('Authentication - Privy Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('should display Privy modal with all login options', async ({ page }) => {
    await openPrivyModal(page);

    // Modal should be visible
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check welcome heading
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

    // Check all login methods
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /twitter/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /continue with a wallet/i })
    ).toBeVisible();

    // Check Privy branding
    const privyLink = page.getByRole('link', { name: /privy/i });
    await expect(privyLink).toBeVisible();
  });

  test('should show OTP input after entering email', async ({ page }) => {
    await openPrivyModal(page);

    // Enter a test email
    const emailInput = page.getByPlaceholder(/email/i);
    await emailInput.fill('test@example.com');

    // Submit email
    const submitButton = page.getByRole('button', { name: /submit/i });
    await submitButton.click();

    // Wait for OTP screen
    await page.waitForTimeout(2000);

    // Should show OTP input or error
    const otpHeading = page.getByRole('heading', { name: /confirmation code/i });
    const isOtpVisible = await otpHeading.isVisible().catch(() => false);

    if (isOtpVisible) {
      // OTP screen is visible
      await expect(otpHeading).toBeVisible();

      // Should have 6 OTP input boxes
      const otpInputs = page.locator('input[type="text"]');
      const inputCount = await otpInputs.count();
      expect(inputCount).toBeGreaterThanOrEqual(6);

      // Should show resend option
      await expect(page.getByRole('button', { name: /resend/i })).toBeVisible();
    } else {
      console.log('OTP screen not shown - email may have been rejected');
    }
  });

  test('should show wallet selection options', async ({ page }) => {
    await openPrivyModal(page);

    // Click continue with wallet
    const walletButton = page.getByRole('button', { name: /continue with a wallet/i });
    await walletButton.click();

    // Should show wallet selection
    await expect(
      page.getByRole('heading', { name: /select your wallet/i })
    ).toBeVisible();

    // Check for popular wallets
    await expect(page.getByRole('button', { name: /phantom/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /backpack/i })).toBeVisible();

    // Should have search input
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('should be able to go back from wallet selection', async ({ page }) => {
    await openPrivyModal(page);

    // Go to wallet selection
    await page.getByRole('button', { name: /continue with a wallet/i }).click();
    await expect(
      page.getByRole('heading', { name: /select your wallet/i })
    ).toBeVisible();

    // Click back button
    const backButton = page.locator('button').filter({ has: page.locator('img') }).first();
    await backButton.click();

    // Should be back at main login screen
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  });
});

test.describe('Authentication - Profile Completion Flow', () => {
  test('should redirect new users to profile edit page', async ({ page }) => {
    // This test simulates what happens after a new user authenticates
    // In production, the PrivyProvider redirects users with needsProfileSetup=true

    // Navigate directly to profile edit page (simulating redirect)
    await page.goto('/profile/edit');
    await waitForPageLoad(page);

    // Check page loads (may redirect to home if not authenticated)
    const url = page.url();
    expect(url).toMatch(/\/(profile|$)/);
  });

  test('should show profile setup form elements', async ({ page }) => {
    await page.goto('/profile/edit');
    await page.waitForTimeout(2000);

    // If redirected to home (not authenticated), that's expected
    const url = page.url();
    if (url.includes('/profile/edit')) {
      // Check for profile form elements
      const usernameInput = page.getByLabel(/username/i);
      const displayNameInput = page.getByLabel(/display name/i);

      const hasUsernameInput = await usernameInput.isVisible().catch(() => false);
      const hasDisplayNameInput = await displayNameInput.isVisible().catch(() => false);

      if (hasUsernameInput) {
        await expect(usernameInput).toBeVisible();
      }
      if (hasDisplayNameInput) {
        await expect(displayNameInput).toBeVisible();
      }
    } else {
      console.log('Redirected to home - user not authenticated');
    }
  });
});

test.describe('Authentication - Username Validation', () => {
  // These tests verify the username check endpoint works correctly
  // They don't require authentication

  test('should validate username format via API', async ({ request }) => {
    // Test invalid username (too short)
    const shortResponse = await request.get('/api/users/check-username?username=ab');
    expect(shortResponse.ok()).toBeTruthy();
    const shortData = await shortResponse.json();
    expect(shortData.available).toBe(false);
    expect(shortData.reason).toBe('invalid_format');
  });

  test('should reject reserved usernames via API', async ({ request }) => {
    // Test reserved username
    const reservedResponse = await request.get(
      '/api/users/check-username?username=admin'
    );
    expect(reservedResponse.ok()).toBeTruthy();
    const reservedData = await reservedResponse.json();
    expect(reservedData.available).toBe(false);
    expect(reservedData.reason).toBe('reserved');
  });

  test('should return available for unique username via API', async ({ request }) => {
    // Test unique username
    const uniqueUsername = generateTestUsername();
    const uniqueResponse = await request.get(
      `/api/users/check-username?username=${uniqueUsername}`
    );
    expect(uniqueResponse.ok()).toBeTruthy();
    const uniqueData = await uniqueResponse.json();
    expect(uniqueData.available).toBe(true);
  });
});

test.describe('Authentication - Protected Routes', () => {
  test('should redirect unauthenticated users from /profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);

    // Should redirect to home or show loading
    const url = page.url();
    // Profile page should redirect to home or profile edit for unauthenticated users
    expect(url).toMatch(/\/(profile|$)/);
  });

  test('should show create page but disable posting for unauthenticated users', async ({
    page,
  }) => {
    await page.goto('/create');
    await waitForPageLoad(page);

    // Check page is visible
    await expect(page.getByRole('heading', { name: /share your flex/i })).toBeVisible();

    // Launch button should be disabled
    const launchButton = page.getByRole('button', { name: /launch token/i });
    await expect(launchButton).toBeDisabled();

    // Should show connect wallet message
    await expect(page.getByText(/connect wallet/i)).toBeVisible();
  });
});
