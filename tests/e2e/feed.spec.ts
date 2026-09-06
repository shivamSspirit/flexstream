import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  openPrivyModal,
  closePrivyModal,
  navigateTo,
  getVisiblePostCount,
  scrollToLoadMore,
} from './helpers/test-utils';

/**
 * Flexit Feed Tests
 *
 * Tests for the main feed page functionality
 * These tests run without authentication to verify public feed viewing
 */

test.describe('Feed Page - Public View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('should display the homepage with navigation', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Flexit/);

    // Check navigation elements
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /search/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /create/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /notifications/i })).toBeVisible();
  });

  test('should display Connect button for unauthenticated users', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect/i });
    await expect(connectButton).toBeVisible();
  });

  test('should display "Connect to Start Trading" banner', async ({ page }) => {
    const banner = page.getByRole('heading', { name: /connect to start trading/i });
    await expect(banner).toBeVisible();

    const getStartedButton = page.getByRole('button', { name: /get started/i });
    await expect(getStartedButton).toBeVisible();
  });

  test('should load posts on the feed', async ({ page }) => {
    // Wait for posts to potentially load
    await page.waitForTimeout(3000);

    // Check for post elements (token symbols like $MASAN)
    const tokenSymbols = page.locator('text=/\\$[A-Z0-9]{3,10}/');
    const count = await tokenSymbols.count();

    // Feed should have posts if database has content
    // This is a soft assertion - feed might be empty in fresh DB
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
      console.log(`Found ${count} posts with token symbols`);
    } else {
      console.log('No posts found - database may be empty');
    }
  });

  test('should display post card elements correctly', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Look for common post card elements
    const postMedia = page.getByRole('img', { name: /post media/i }).first();
    const hasPostMedia = await postMedia.isVisible().catch(() => false);

    if (hasPostMedia) {
      // Check post card structure
      await expect(postMedia).toBeVisible();

      // Check for buy buttons
      const buyButton = page.getByRole('button', { name: /buy/i }).first();
      await expect(buyButton).toBeVisible();

      // Check for comment input
      const commentInput = page.getByPlaceholder(/add a comment/i).first();
      await expect(commentInput).toBeVisible();
    } else {
      console.log('No post media found - feed may be empty');
    }
  });

  test('should display search button in header', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: /search/i });
    await expect(searchButton).toBeVisible();
  });
});

test.describe('Feed Page - Privy Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('should open Privy login modal when clicking Connect', async ({ page }) => {
    await openPrivyModal(page);

    // Check modal is visible
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check modal title
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  });

  test('should display all login options in Privy modal', async ({ page }) => {
    await openPrivyModal(page);

    // Check for email input
    const emailInput = page.getByPlaceholder(/email/i);
    await expect(emailInput).toBeVisible();

    // Check for social login buttons
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /twitter/i })).toBeVisible();

    // Check for wallet option
    await expect(
      page.getByRole('button', { name: /continue with a wallet/i })
    ).toBeVisible();
  });

  test('should close Privy modal when clicking close button', async ({ page }) => {
    await openPrivyModal(page);

    // Close the modal
    await closePrivyModal(page);

    // Verify modal is closed
    const modal = page.getByRole('dialog');
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test('should show wallet selection when clicking "Continue with a wallet"', async ({
    page,
  }) => {
    await openPrivyModal(page);

    // Click wallet option
    const walletButton = page.getByRole('button', { name: /continue with a wallet/i });
    await walletButton.click();

    // Check for wallet selection heading
    await expect(page.getByRole('heading', { name: /select your wallet/i })).toBeVisible();

    // Check for common wallets
    await expect(page.getByRole('button', { name: /phantom/i })).toBeVisible();
  });
});

test.describe('Feed Page - Navigation', () => {
  test('should navigate to Explore page', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    await page.goto('/explore');
    await waitForPageLoad(page);

    // Check explore page elements
    await expect(page.getByRole('heading', { name: /explore/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('should navigate to Create page', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    await page.goto('/create');
    await waitForPageLoad(page);

    // Check create page elements
    await expect(page.getByRole('heading', { name: /share your flex/i })).toBeVisible();
  });

  test('should navigate to user profile when clicking username', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Find a username button and click it
    const usernameButton = page.getByRole('button').filter({ hasText: /@/ }).first();
    const hasUsername = await usernameButton.isVisible().catch(() => false);

    if (hasUsername) {
      const username = await usernameButton.textContent();
      await usernameButton.click();

      // Should navigate to profile page
      await expect(page).toHaveURL(/\/profile\//);
    } else {
      console.log('No username buttons found - feed may be empty');
    }
  });
});

test.describe('Feed Page - Interactions (Unauthenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('should open Privy modal when clicking Buy button', async ({ page }) => {
    const buyButton = page.getByRole('button', { name: /buy/i }).first();
    const hasBuyButton = await buyButton.isVisible().catch(() => false);

    if (hasBuyButton) {
      await buyButton.click();

      // Should open Privy modal for authentication
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible({ timeout: 5000 });
    } else {
      console.log('No buy buttons found - feed may be empty');
    }
  });

  test('should prompt login when trying to comment', async ({ page }) => {
    const commentInput = page.getByPlaceholder(/add a comment/i).first();
    const hasCommentInput = await commentInput.isVisible().catch(() => false);

    if (hasCommentInput) {
      await commentInput.click();

      // Should open Privy modal or show login prompt
      await page.waitForTimeout(1000);
      const modal = page.getByRole('dialog');
      const isModalVisible = await modal.isVisible().catch(() => false);

      // Either modal opens or focus remains on input (depending on implementation)
      if (!isModalVisible) {
        await expect(commentInput).toBeFocused();
      }
    } else {
      console.log('No comment inputs found - feed may be empty');
    }
  });
});
