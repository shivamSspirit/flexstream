#!/usr/bin/env node

/**
 * Convert FlexIt pitch deck backgrounds from SVG to PNG
 * High-resolution PNG exports for presentation software
 */

const fs = require('fs');
const path = require('path');

// Import sharp dynamically to avoid build issues
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('Error: sharp library not available. Using alternative method.');
  process.exit(1);
}

const publicDir = path.join(__dirname, 'public');
const desktopDir = path.join(process.env.HOME, 'Desktop');

// SVG files to convert
const backgroundFiles = [
  'deck-bg-hero.svg',
  'deck-bg-dark.svg',
  'deck-bg-minimal.svg',
  'deck-bg-closing.svg'
];

async function convertSVGtoPNG(svgPath, pngPath, width = 1920, height = 1080) {
  try {
    await sharp(svgPath, {
      density: 300 // High DPI for crisp presentation
    })
      .resize(width, height, {
        fit: 'contain',
        background: { r: 10, g: 10, b: 15, alpha: 1 } // #0A0A0F background
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
  console.log('🎨 Converting FlexIt pitch deck backgrounds to PNG...\n');

  for (const filename of backgroundFiles) {
    const svgPath = path.join(publicDir, filename);
    const pngFilename = filename.replace('.svg', '.png');
    const pngPath = path.join(desktopDir, pngFilename);

    // Check if SVG exists
    if (!fs.existsSync(svgPath)) {
      console.log(`❌ ${filename} not found in public/`);
      continue;
    }

    console.log(`Converting ${filename}...`);

    // Convert to standard 1920×1080 PNG
    const success = await convertSVGtoPNG(svgPath, pngPath);

    if (success) {
      const stats = fs.statSync(pngPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`✅ ${pngFilename} (1920×1080, ${sizeMB}MB)`);
      console.log(`   Saved to: ${pngPath}\n`);
    }
  }

  console.log('🚀 PNG conversion complete!');
  console.log(`📁 All files saved to: ${desktopDir}\n`);
  console.log('You can now use these PNG files in PowerPoint, Keynote, or Google Slides.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
