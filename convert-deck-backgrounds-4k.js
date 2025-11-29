#!/usr/bin/env node

/**
 * Convert FlexIt pitch deck backgrounds to 4K PNG (3840×2160)
 * For ultra high-resolution presentations
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, 'public');
const desktopDir = path.join(process.env.HOME, 'Desktop');

const backgroundFiles = [
  'deck-bg-hero.svg',
  'deck-bg-dark.svg',
  'deck-bg-minimal.svg',
  'deck-bg-closing.svg'
];

async function convertSVGtoPNG4K(svgPath, pngPath) {
  try {
    await sharp(svgPath, {
      density: 600 // Ultra high DPI
    })
      .resize(3840, 2160, {
        fit: 'contain',
        background: { r: 10, g: 10, b: 15, alpha: 1 }
      })
      .png({
        quality: 100,
        compressionLevel: 9
      })
      .toFile(pngPath);

    return true;
  } catch (error) {
    console.error(`Error converting ${path.basename(svgPath)}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Converting FlexIt backgrounds to 4K PNG (3840×2160)...\n');

  for (const filename of backgroundFiles) {
    const svgPath = path.join(publicDir, filename);
    const pngFilename = filename.replace('.svg', '-4k.png');
    const pngPath = path.join(desktopDir, pngFilename);

    if (!fs.existsSync(svgPath)) {
      console.log(`❌ ${filename} not found`);
      continue;
    }

    console.log(`Converting ${filename} to 4K...`);

    const success = await convertSVGtoPNG4K(svgPath, pngPath);

    if (success) {
      const stats = fs.statSync(pngPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`✅ ${pngFilename} (3840×2160, ${sizeMB}MB)`);
      console.log(`   Saved to: ${pngPath}\n`);
    }
  }

  console.log('🚀 4K PNG conversion complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
