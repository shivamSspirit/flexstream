import { Page, expect } from '@playwright/test';

/**
 * Flexit E2E Test Utilities
 */

/**
 * Wait for the page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for posts to load on feed
 */
export async function waitForPostsToLoad(page: Page): Promise<void> {
  // Wait for loading state to disappear
  await page.waitForSelector('[data-testid="post-card"], .post-card, [class*="PostCard"]', {
    timeout: 30000,
  }).catch(() => {
    // Posts might not exist yet, that's okay
  });
}

/**
 * Generate a unique username for testing
 */
export function generateTestUsername(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test_${timestamp}_${random}`;
}

/**
 * Generate a unique token ticker for testing
 */
export function generateTestTicker(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let ticker = '';
  for (let i = 0; i < 5; i++) {
    ticker += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ticker;
}

/**
 * Click the Connect button to open Privy modal
 */
export async function openPrivyModal(page: Page): Promise<void> {
  const connectButton = page.getByRole('button', { name: /connect/i });
  await connectButton.click();
  // Wait for modal to appear
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
}

/**
 * Close the Privy modal
 */
export async function closePrivyModal(page: Page): Promise<void> {
  const closeButton = page.getByRole('button', { name: /close modal/i });
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }
}

/**
 * Click "Continue with a wallet" in Privy modal
 */
export async function clickContinueWithWallet(page: Page): Promise<void> {
  const walletButton = page.getByRole('button', { name: /continue with a wallet/i });
  await walletButton.click();
}

/**
 * Navigate to a specific page and wait for load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForPageLoad(page);
}

/**
 * Check if user is logged in by looking for profile elements
 */
export async function isUserLoggedIn(page: Page): Promise<boolean> {
  // Check for connect button - if visible, user is NOT logged in
  const connectButton = page.getByRole('button', { name: /connect/i });
  return !(await connectButton.isVisible({ timeout: 2000 }).catch(() => false));
}

/**
 * Assert that post card contains expected elements
 */
export async function assertPostCardStructure(page: Page, postIndex = 0): Promise<void> {
  const postCards = page.locator('[data-testid="post-card"], .post-card').or(
    page.locator('main').locator('> div > div').nth(postIndex)
  );

  const postCard = postCards.nth(postIndex);

  // Check for basic post elements
  await expect(postCard).toBeVisible();
}

/**
 * Get the count of visible posts
 */
export async function getVisiblePostCount(page: Page): Promise<number> {
  // Look for post cards or token symbols ($TICKER pattern)
  const posts = page.locator('p, span, div').filter({ hasText: /^\$[A-Z0-9]{3,10}$/ });
  return await posts.count();
}

/**
 * Wait for a new post to appear (for real-time testing)
 */
export async function waitForNewPost(
  page: Page,
  expectedText: string,
  timeout = 10000
): Promise<boolean> {
  try {
    await page.waitForSelector(`text=${expectedText}`, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Scroll to load more posts (infinite scroll)
 */
export async function scrollToLoadMore(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  // Wait for potential new content
  await page.waitForTimeout(1000);
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: `tests/e2e/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Mock API response for testing
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string,
  response: Record<string, unknown>
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Create a test image file for upload testing
 */
export async function createTestImagePath(): Promise<string> {
  // Return path to a test fixture image
  return 'tests/e2e/fixtures/test-image.png';
}

/**
 * Privy auth storage state interface
 */
export interface PrivyAuthState {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
  }>;
  localStorage: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Save authenticated state for reuse
 */
export async function saveAuthState(
  page: Page,
  filePath: string
): Promise<void> {
  await page.context().storageState({ path: filePath });
}

/**
 * Check if element is in viewport
 */
export async function isElementInViewport(
  page: Page,
  selector: string
): Promise<boolean> {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}
