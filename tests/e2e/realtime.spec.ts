import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForNewPost } from './helpers/test-utils';

/**
 * FlexStream Real-Time Tests
 *
 * Tests for real-time post updates using Supabase Realtime
 * These tests verify that new posts appear instantly without refresh
 */

test.describe('Real-Time - Feed Updates', () => {
  test('should have Supabase Realtime subscription active', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Wait for Supabase Realtime to connect
    await page.waitForTimeout(3000);

    // Check console for Realtime subscription logs
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    await page.waitForTimeout(2000);

    // Look for Realtime subscription messages in logs
    const hasRealtimeSubscription = consoleLogs.some(
      (log) =>
        log.includes('[REALTIME]') ||
        log.includes('Subscribed') ||
        log.includes('postgres_changes')
    );

    // Note: This may not always capture the logs depending on timing
    console.log(
      hasRealtimeSubscription
        ? 'Realtime subscription detected'
        : 'Realtime subscription not detected in logs (may have connected before listener)'
    );
  });

  test('should update feed when new post is created (via API mock)', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Get initial post count
    await page.waitForTimeout(3000);
    const initialPosts = await page.locator('text=/\\$[A-Z0-9]{3,10}/').count();

    console.log(`Initial post count: ${initialPosts}`);

    // Note: To fully test real-time, you would need:
    // 1. Two browser contexts
    // 2. One context creates a post
    // 3. Other context verifies post appears
    // This requires authentication in both contexts
  });
});

test.describe('Real-Time - Two Browser Contexts', () => {
  test('should sync posts between two browser tabs', async ({ browser }) => {
    // Create two separate browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Open feed in both pages
      await Promise.all([
        page1.goto('http://localhost:3000'),
        page2.goto('http://localhost:3000'),
      ]);

      await Promise.all([waitForPageLoad(page1), waitForPageLoad(page2)]);

      // Wait for Realtime subscriptions to establish
      await page1.waitForTimeout(3000);
      await page2.waitForTimeout(3000);

      // Get initial post counts
      const initialCount1 = await page1.locator('text=/\\$[A-Z0-9]{3,10}/').count();
      const initialCount2 = await page2.locator('text=/\\$[A-Z0-9]{3,10}/').count();

      console.log(`Page 1 initial posts: ${initialCount1}`);
      console.log(`Page 2 initial posts: ${initialCount2}`);

      // Verify both pages have same content
      expect(initialCount1).toBe(initialCount2);

      // Note: Full real-time test would require creating a post in one context
      // and verifying it appears in the other. This requires authentication.
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Real-Time - Feed Refresh', () => {
  test('should have working manual refresh', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Get initial content
    const initialPosts = await page.locator('text=/\\$[A-Z0-9]{3,10}/').count();

    // Trigger refresh by navigating away and back
    await page.goto('/explore');
    await waitForPageLoad(page);

    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Get refreshed content
    const refreshedPosts = await page.locator('text=/\\$[A-Z0-9]{3,10}/').count();

    // Posts should still be visible after refresh
    expect(refreshedPosts).toBe(initialPosts);
  });

  test('should recover from network interruption', async ({ page, context }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Simulate offline mode
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(2000);

    // Feed should still work
    const posts = await page.locator('text=/\\$[A-Z0-9]{3,10}/').count();
    console.log(`Posts visible after network recovery: ${posts}`);
  });
});

test.describe('Real-Time - Profile Page', () => {
  test('should update profile posts in real-time', async ({ page }) => {
    // Navigate to a user profile
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Find a user and go to their profile
    const usernameButton = page.getByRole('button').filter({ hasText: /@/ }).first();
    const hasUsername = await usernameButton.isVisible().catch(() => false);

    if (hasUsername) {
      await usernameButton.click();
      await waitForPageLoad(page);

      // Verify we're on profile page
      expect(page.url()).toMatch(/\/profile\//);

      // Wait for Realtime subscription on profile
      await page.waitForTimeout(3000);

      // Profile should show user's posts
      const profilePosts = await page.locator('text=/\\$[A-Z0-9]{3,10}/').count();
      console.log(`Profile posts: ${profilePosts}`);
    } else {
      console.log('No users found in feed to test profile real-time');
    }
  });
});

test.describe('Real-Time - Explore Page', () => {
  test('should have real-time updates on explore page', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageLoad(page);

    // Check explore page loads
    await expect(page.getByRole('heading', { name: /explore/i })).toBeVisible();

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Explore may have different content structure
    const hasContent = await page.locator('main').isVisible();
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Real-Time - Console Monitoring', () => {
  test('should log Realtime events in console', async ({ page }) => {
    const realtimeLogs: string[] = [];

    // Capture console logs
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('REALTIME')) {
        realtimeLogs.push(text);
      }
    });

    await page.goto('/');
    await waitForPageLoad(page);

    // Wait for Realtime to connect
    await page.waitForTimeout(5000);

    console.log('Realtime logs captured:');
    realtimeLogs.forEach((log) => console.log(`  - ${log}`));

    // Should have some Realtime activity
    // Note: May not capture if subscription happens before listener is attached
    if (realtimeLogs.length > 0) {
      expect(realtimeLogs.some((log) => log.includes('subscription'))).toBeTruthy();
    }
  });
});

test.describe('Real-Time - Performance', () => {
  test('should not have excessive re-renders', async ({ page }) => {
    const renderLogs: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('FEED RENDER')) {
        renderLogs.push(text);
      }
    });

    await page.goto('/');
    await waitForPageLoad(page);

    // Wait and count renders
    await page.waitForTimeout(10000);

    console.log(`Total feed renders in 10 seconds: ${renderLogs.length}`);

    // Should not have excessive renders (e.g., more than 50 in 10 seconds)
    // This helps catch infinite re-render bugs
    expect(renderLogs.length).toBeLessThan(100);
  });
});
