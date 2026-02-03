import { test } from '@playwright/test';
import { setupPrivyAuth } from './fixtures/auth';

/**
 * Authentication Setup Script
 *
 * This test is meant to be run MANUALLY with --headed flag
 * It will open a browser where you can complete Privy authentication
 * The auth state will be saved for use in other tests
 *
 * Usage:
 *   npx playwright test tests/e2e/auth-setup.spec.ts --project=chromium --headed
 *
 * After completing the login in the browser, the auth state will be saved
 * to tests/e2e/fixtures/.auth-state.json
 */

test.describe('Auth Setup', () => {
  test('setup authentication state (run with --headed)', async ({
    page,
    context,
  }) => {
    // Set a long timeout for manual authentication
    test.setTimeout(300000); // 5 minutes

    console.log('\n');
    console.log('='.repeat(60));
    console.log('FLEXIT AUTHENTICATION SETUP');
    console.log('='.repeat(60));
    console.log('\n');
    console.log('This will open a browser for you to complete Privy login.');
    console.log('Complete the following steps:\n');
    console.log('1. Click "Connect" button');
    console.log('2. Choose your login method (Email, Google, Twitter, or Wallet)');
    console.log('3. Complete the verification process');
    console.log('4. Wait for the page to load your profile');
    console.log('5. The test will automatically save your auth state\n');
    console.log('='.repeat(60));
    console.log('\n');

    await setupPrivyAuth(page, context);

    console.log('\n');
    console.log('='.repeat(60));
    console.log('SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n');
    console.log('Your authentication state has been saved.');
    console.log('Other tests will now use this auth state.');
    console.log('\n');
    console.log('To run tests with authentication:');
    console.log('  npx playwright test tests/e2e/feed.spec.ts');
    console.log('\n');
    console.log('='.repeat(60));
  });
});
