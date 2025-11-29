#!/usr/bin/env node

/**
 * Export FlexIt Logo to PNG
 * Renders the SVG logo to high-quality PNG files
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG logo content - Multi-colored Figma-quality F logo
const logoSVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Multi-color gradients -->
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#9945FF" stop-opacity="1" />
      <stop offset="50%" stop-color="#7C3AED" stop-opacity="1" />
      <stop offset="100%" stop-color="#9945FF" stop-opacity="1" />
    </linearGradient>

    <linearGradient id="cyanGreenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14F195" stop-opacity="1" />
      <stop offset="50%" stop-color="#00D787" stop-opacity="1" />
      <stop offset="100%" stop-color="#14F195" stop-opacity="1" />
    </linearGradient>

    <linearGradient id="purplePinkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#9945FF" stop-opacity="1" />
      <stop offset="50%" stop-color="#FF6B9D" stop-opacity="1" />
      <stop offset="100%" stop-color="#9945FF" stop-opacity="1" />
    </linearGradient>

    <linearGradient id="jellyShine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6" />
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <filter id="solidGlow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feOffset in="coloredBlur" dx="0" dy="2" result="offsetBlur"/>
      <feMerge>
        <feMergeNode in="offsetBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Circular container background -->
  <circle cx="50" cy="50" r="48" fill="rgba(10, 10, 15, 0.95)" />
  <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2" />

  <!-- Vertical stem - Purple gradient -->
  <ellipse cx="28" cy="50" rx="11" ry="40" fill="url(#purpleGrad)" filter="url(#solidGlow)" opacity="1" />
  <ellipse cx="26" cy="35" rx="6" ry="20" fill="url(#jellyShine)" opacity="0.4" />

  <!-- Top bar - Cyan to Green gradient -->
  <ellipse cx="60" cy="22" rx="36" ry="13" fill="url(#cyanGreenGrad)" filter="url(#solidGlow)" opacity="1" />
  <ellipse cx="55" cy="20" rx="20" ry="6" fill="url(#jellyShine)" opacity="0.5" />

  <!-- Top bar extension - Bright cyan overlay -->
  <ellipse cx="68" cy="24" rx="28" ry="10" fill="#14F195" filter="url(#solidGlow)" opacity="0.85" transform="rotate(-3 68 24)" />

  <!-- Middle bar - Purple to Pink gradient -->
  <ellipse cx="54" cy="50" rx="28" ry="11" fill="url(#purplePinkGrad)" filter="url(#solidGlow)" opacity="1" />
  <ellipse cx="50" cy="48" rx="16" ry="5" fill="url(#jellyShine)" opacity="0.5" />

  <!-- Middle bar accent - Electric purple -->
  <ellipse cx="62" cy="52" rx="22" ry="9" fill="#9945FF" filter="url(#solidGlow)" opacity="0.85" transform="rotate(-5 62 52)" />

  <!-- Top right curve - Vibrant green -->
  <ellipse cx="88" cy="22" rx="9" ry="11" fill="#00D787" filter="url(#solidGlow)" opacity="0.95" transform="rotate(12 88 22)" />
  <ellipse cx="87" cy="20" rx="4" ry="5" fill="#FFFFFF" opacity="0.35" transform="rotate(12 87 20)" />

  <!-- Middle right curve - Bright pink accent -->
  <ellipse cx="78" cy="50" rx="8" ry="10" fill="#FF6B9D" filter="url(#solidGlow)" opacity="0.95" transform="rotate(10 78 50)" />
  <ellipse cx="77" cy="48" rx="3.5" ry="4.5" fill="#FFFFFF" opacity="0.35" transform="rotate(10 77 48)" />

  <!-- Bottom stem glow - Deep purple tail -->
  <ellipse cx="28" cy="78" rx="10" ry="14" fill="#7C3AED" filter="url(#solidGlow)" opacity="0.9" />

  <!-- Depth shadows -->
  <ellipse cx="28" cy="82" rx="8" ry="6" fill="#000000" opacity="0.15" />
  <ellipse cx="85" cy="24" rx="6" ry="4" fill="#000000" opacity="0.12" />
  <ellipse cx="75" cy="52" rx="5" ry="4" fill="#000000" opacity="0.12" />
</svg>
`;

const desktopDir = path.join(process.env.HOME, 'Desktop');

const sizes = [
  { name: 'flexstream-logo-icon-512.png', size: 512 },
  { name: 'flexstream-logo-icon-256.png', size: 256 },
  { name: 'flexstream-logo-icon-128.png', size: 128 },
  { name: 'flexstream-logo-icon-64.png', size: 64 },
];

async function exportLogos() {
  console.log('🎨 Exporting FlexIt Logo to PNG...\n');

  for (const { name, size } of sizes) {
    const outputPath = path.join(desktopDir, name);

    try {
      await sharp(Buffer.from(logoSVG))
        .resize(size, size)
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`✅ ${name} (${size}x${size}, ${sizeKB}KB)`);
      console.log(`   Saved to: ${outputPath}\n`);
    } catch (error) {
      console.error(`❌ Error creating ${name}:`, error.message);
    }
  }

  console.log('🚀 Logo export complete! Check your Desktop for PNG files.');
}

exportLogos().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
