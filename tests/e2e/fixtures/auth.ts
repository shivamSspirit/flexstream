import { test as base, expect, Page, BrowserContext } from '@playwright/test';

/**
 * FlexStream Authentication Fixtures
 *
 * IMPORTANT: Privy authentication requires one of:
 * 1. Email OTP verification (needs email access)
 * 2. OAuth (Google/Twitter - needs real accounts)
 * 3. Wallet connection (needs browser extension like Phantom)
 *
 * For automated E2E testing, we recommend:
 * - Using Privy's test mode (if available in your Privy plan)
 * - Setting up a test account and storing the auth state
 * - Mocking the authentication layer for unit/integration tests
 */

// Test user data interface
export interface TestUser {
  walletAddress: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

// Authenticated test fixture
export const test = base.extend<{
  authenticatedPage: Page;
  testUser: TestUser;
}>({
  // Authenticated page fixture - loads saved auth state
  authenticatedPage: async ({ browser }, use) => {
    // Try to load saved auth state
    const authStatePath = 'tests/e2e/fixtures/.auth-state.json';

    try {
      const context = await browser.newContext({
        storageState: authStatePath,
      });
      const page = await context.newPage();
      await use(page);
      await context.close();
    } catch {
      // No auth state saved, create new context
      console.warn(
        'No auth state found. Run the auth setup script first:\n' +
          'npx playwright test tests/e2e/auth-setup.spec.ts --project=chromium'
      );
      const context = await browser.newContext();
      const page = await context.newPage();
      await use(page);
      await context.close();
    }
  },

  // Test user data fixture
  testUser: async ({}, use) => {
    const testUser: TestUser = {
      walletAddress: process.env.TEST_WALLET_ADDRESS || 'TEST_WALLET_NOT_SET',
      username: process.env.TEST_USERNAME || 'testuser',
      displayName: process.env.TEST_DISPLAY_NAME || 'Test User',
    };
    await use(testUser);
  },
});

export { expect };

/**
 * Helper to perform manual Privy authentication
 * Call this in a setup test to create the auth state file
 *
 * Usage:
 * 1. Run: npx playwright test tests/e2e/auth-setup.spec.ts --headed
 * 2. Manually complete the Privy login in the browser
 * 3. The auth state will be saved for future tests
 */
export async function setupPrivyAuth(
  page: Page,
  context: BrowserContext
): Promise<void> {
  // Navigate to homepage
  await page.goto('/');

  // Click Connect button
  const connectButton = page.getByRole('button', { name: /connect/i });
  await connectButton.click();

  // Wait for Privy modal
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

  console.log('\n========================================');
  console.log('MANUAL AUTHENTICATION REQUIRED');
  console.log('========================================');
  console.log('1. Complete the Privy login in the browser');
  console.log('2. Choose Email, Google, Twitter, or Wallet');
  console.log('3. Complete the verification process');
  console.log('4. Wait for redirect to feed/profile');
  console.log('5. The test will automatically continue');
  console.log('========================================\n');

  // Wait for authentication to complete (user redirected away from login modal)
  // This waits for the Connect button to disappear or user profile to appear
  await page.waitForFunction(
    () => {
      // Check if Connect button is gone (user logged in)
      const connectBtn = document.querySelector('button:has-text("Connect")');
      return !connectBtn || window.location.pathname.includes('/profile');
    },
    { timeout: 300000 } // 5 minute timeout for manual auth
  );

  // Wait for page to stabilize
  await page.waitForLoadState('networkidle');

  // Save the auth state
  await context.storageState({ path: 'tests/e2e/fixtures/.auth-state.json' });

  console.log('\n========================================');
  console.log('AUTH STATE SAVED SUCCESSFULLY!');
  console.log('Future tests will use this auth state.');
  console.log('========================================\n');
}

/**
 * Mock user session for testing without real auth
 * This sets up localStorage/sessionStorage to simulate logged-in state
 *
 * NOTE: This may not work with all Privy configurations
 * Use for smoke testing only
 */
export async function mockUserSession(
  page: Page,
  user: TestUser
): Promise<void> {
  await page.addInitScript((userData) => {
    // Set sessionStorage items that FlexStream uses
    sessionStorage.setItem('current_username', userData.username);
    sessionStorage.setItem(
      'current_user',
      JSON.stringify({
        id: 'test-user-id',
        wallet_address: userData.walletAddress,
        username: userData.username,
        display_name: userData.displayName,
        avatar_url: userData.avatarUrl || null,
        profile_completed: true,
      })
    );
  }, user);
}

/**
 * Clear all auth state
 */
export async function clearAuthState(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  // Clear storage for all pages
  const pages = context.pages();
  for (const page of pages) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}
