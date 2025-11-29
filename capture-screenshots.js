#!/usr/bin/env node

/**
 * FlexIt Screenshot Capture Tool
 * Automatically captures screenshots of key pages for pitch deck
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(process.env.HOME, 'Desktop', 'flexstream-screenshots');
const APP_URL = 'http://localhost:3000';

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('🎬 Starting FlexIt Screenshot Capture...\n');
  console.log(`📁 Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: false, // Show browser so you can see what's happening
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2, // Retina quality
    },
  });

  const page = await browser.newPage();

  try {
    // Screenshot 1: Homepage with Post Feed
    console.log('📸 Capturing homepage feed...');
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for animations
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-homepage-feed.png'),
      fullPage: false,
    });
    console.log('✅ Homepage feed captured!\n');

    // Screenshot 2: Single Post Card (cropped)
    console.log('📸 Capturing single post card...');
    const postCard = await page.$('article, [data-post-card], .card-base');
    if (postCard) {
      await postCard.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02-post-card-detail.png'),
      });
      console.log('✅ Post card captured!\n');
    } else {
      console.log('⚠️  No post card found on page\n');
    }

    // Screenshot 3: Create Token Page
    console.log('📸 Capturing create token page...');
    await page.goto(`${APP_URL}/create`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-create-token-page.png'),
      fullPage: false,
    });
    console.log('✅ Create token page captured!\n');

    // Screenshot 4: Profile Page (if available)
    console.log('📸 Capturing profile page...');
    await page.goto(`${APP_URL}/profile`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-profile-page.png'),
      fullPage: false,
    });
    console.log('✅ Profile page captured!\n');

    // Screenshot 5: Mobile View (iPhone size)
    console.log('📸 Capturing mobile view...');
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 3, // iPhone 14 Pro quality
    });
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-mobile-view.png'),
      fullPage: false,
    });
    console.log('✅ Mobile view captured!\n');

    console.log('🎉 All screenshots captured successfully!');
    console.log(`\n📂 Check your screenshots at:\n${SCREENSHOTS_DIR}\n`);

    // List all captured files
    const files = fs.readdirSync(SCREENSHOTS_DIR);
    console.log('📋 Captured files:');
    files.forEach((file, index) => {
      const stats = fs.statSync(path.join(SCREENSHOTS_DIR, file));
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ${index + 1}. ${file} (${sizeKB} KB)`);
    });

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error.message);
    console.error('\n💡 Make sure your dev server is running:');
    console.error('   pnpm dev\n');
  } finally {
    await browser.close();
  }
}

// Run the script
captureScreenshots().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
