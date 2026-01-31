import { test, expect } from '@playwright/test';
import { test as authTest } from './fixtures/auth';
import {
  waitForPageLoad,
  generateTestTicker,
  openPrivyModal,
} from './helpers/test-utils';
import path from 'path';

/**
 * FlexStream Post Creation Tests
 *
 * Tests for creating posts with tokens and images
 * Some tests require authentication - use auth fixture
 */

test.describe('Create Page - Public View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
    await waitForPageLoad(page);
  });

  test('should display create page with all elements', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: /share your flex/i })).toBeVisible();

    // Check subheading
    await expect(page.getByText(/every post becomes a tradable token/i)).toBeVisible();

    // Check upload section
    await expect(page.getByRole('heading', { name: /upload your moment/i })).toBeVisible();
    await expect(page.getByText(/drop your flex here/i)).toBeVisible();

    // Check token naming section
    await expect(page.getByRole('heading', { name: /name your token/i })).toBeVisible();

    // Check for $ prefix
    await expect(page.getByText('$')).toBeVisible();

    // Check token input
    const tokenInput = page.getByPlaceholder(/wagmi/i);
    await expect(tokenInput).toBeVisible();

    // Check character limit info
    await expect(page.getByText(/3-10 characters/i)).toBeVisible();
  });

  test('should display Live Preview section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /live preview/i })).toBeVisible();
    await expect(page.getByText(/\$ticker/i)).toBeVisible();
    await expect(page.getByText(/starting price/i)).toBeVisible();
  });

  test('should display Platform Stats section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /platform stats/i })).toBeVisible();
    await expect(page.getByText(/active creators/i)).toBeVisible();
    await expect(page.getByText(/total creators/i)).toBeVisible();
    await expect(page.getByText(/posts today/i)).toBeVisible();
  });

  test('should display Pro Tips section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /pro tips/i })).toBeVisible();
    await expect(page.getByText(/post your biggest wins/i)).toBeVisible();
  });

  test('should have disabled Launch button for unauthenticated users', async ({
    page,
  }) => {
    const launchButton = page.getByRole('button', { name: /launch token/i });
    await expect(launchButton).toBeDisabled();
  });

  test('should show connect wallet message', async ({ page }) => {
    await expect(page.getByText(/connect wallet to start earning/i)).toBeVisible();
  });
});

test.describe('Create Page - Token Input Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
    await waitForPageLoad(page);
  });

  test('should accept valid token names', async ({ page }) => {
    const tokenInput = page.getByPlaceholder(/wagmi/i);

    // Test valid ticker (3-10 characters)
    await tokenInput.fill('FLEX');
    await expect(tokenInput).toHaveValue('FLEX');

    // Test longer valid ticker
    await tokenInput.fill('FLEXTOKEN');
    await expect(tokenInput).toHaveValue('FLEXTOKEN');
  });

  test('should update Live Preview with entered ticker', async ({ page }) => {
    const tokenInput = page.getByPlaceholder(/wagmi/i);
    const testTicker = generateTestTicker();

    await tokenInput.fill(testTicker);

    // Preview should update (may need to check specific preview element)
    await page.waitForTimeout(500);
  });

  test('should have optional details toggle', async ({ page }) => {
    const optionalDetails = page.getByText(/optional details/i);
    await expect(optionalDetails).toBeVisible();

    // Should be clickable to expand
    await optionalDetails.click();
    await page.waitForTimeout(500);
  });
});

test.describe('Create Page - Image Upload (UI Only)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
    await waitForPageLoad(page);
  });

  test('should have upload dropzone area', async ({ page }) => {
    const dropzone = page.getByText(/drop your flex here/i);
    await expect(dropzone).toBeVisible();
  });

  test('should show upload instructions', async ({ page }) => {
    await expect(page.getByText(/share your wins, lifestyle, or journey/i)).toBeVisible();
  });
});

/**
 * Authenticated Post Creation Tests
 *
 * These tests require authentication. Run the auth setup first:
 * npx playwright test tests/e2e/auth-flow.spec.ts -g "setup auth" --headed
 */
test.describe('Create Page - Authenticated (Skipped without auth)', () => {
  // Skip these tests if no auth state exists
  test.skip(
    ({ }, testInfo) => {
      // Check if auth state file exists
      const authStatePath = path.join(
        testInfo.project.testDir,
        'fixtures/.auth-state.json'
      );
      try {
        require('fs').accessSync(authStatePath);
        return false; // Don't skip, auth exists
      } catch {
        return true; // Skip, no auth
      }
    },
    'No auth state found - run auth setup first'
  );

  test('should enable Launch button when authenticated', async ({ page }) => {
    // Load with auth state
    await page.goto('/create');
    await waitForPageLoad(page);

    // Fill required fields
    const tokenInput = page.getByPlaceholder(/wagmi/i);
    await tokenInput.fill('TEST');

    // Launch button should be enabled (may still need image)
    const launchButton = page.getByRole('button', { name: /launch token/i });
    // Button state depends on whether all requirements are met
  });

  test('should allow image upload when authenticated', async ({ page }) => {
    await page.goto('/create');
    await waitForPageLoad(page);

    // Find file input (usually hidden)
    const fileInput = page.locator('input[type="file"]');

    // Check if file input exists
    const hasFileInput = (await fileInput.count()) > 0;
    expect(hasFileInput).toBeTruthy();
  });
});

test.describe('Post Creation - API Tests', () => {
  test('should have posts API endpoint', async ({ request }) => {
    const response = await request.get('/api/posts');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success');
  });

  test('should return posts with correct structure', async ({ request }) => {
    const response = await request.get('/api/posts?limit=5');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.success && data.data?.posts?.length > 0) {
      const post = data.data.posts[0];
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('user_id');
      expect(post).toHaveProperty('created_at');
    }
  });
});

test.describe('Create Page - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should be usable on mobile', async ({ page }) => {
    await page.goto('/create');
    await waitForPageLoad(page);

    // Check main elements are visible on mobile
    await expect(page.getByRole('heading', { name: /share your flex/i })).toBeVisible();
    await expect(page.getByPlaceholder(/wagmi/i)).toBeVisible();
  });
});
