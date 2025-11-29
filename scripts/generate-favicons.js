/**
 * Favicon Generator for FlexIt
 *
 * This script provides instructions to generate proper favicon files
 * from the new logo design.
 *
 * Run: node scripts/generate-favicons.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🎨 FlexIt Favicon Generator\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Read the favicon.svg
const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('✅ Found favicon.svg');
console.log('\n📋 To generate PNG and ICO favicons, follow these steps:\n');

console.log('OPTION 1 - Use RealFaviconGenerator (Recommended)');
console.log('─────────────────────────────────────────────────────────');
console.log('1. Visit: https://realfavicongenerator.net/');
console.log('2. Upload: public/favicon.svg');
console.log('3. Generate all favicon formats');
console.log('4. Download the package');
console.log('5. Replace files in public/ folder\n');

console.log('OPTION 2 - Use Favicon.io');
console.log('─────────────────────────────────────────────────────────');
console.log('1. Visit: https://favicon.io/favicon-converter/');
console.log('2. Upload: public/favicon.svg');
console.log('3. Download generated files');
console.log('4. Replace in public/ folder\n');

console.log('OPTION 3 - Manual Quick Fix (Fastest)');
console.log('─────────────────────────────────────────────────────────');
console.log('1. Open public/favicon.svg in your browser');
console.log('2. Take a screenshot of JUST the logo');
console.log('3. Visit: https://favicon.io/favicon-converter/');
console.log('4. Upload the screenshot');
console.log('5. Download and replace files\n');

console.log('FILES TO REPLACE:');
console.log('─────────────────────────────────────────────────────────');
console.log('  • favicon.ico (16x16, 32x32, 48x48)');
console.log('  • favicon-16x16.png');
console.log('  • favicon-32x32.png');
console.log('  • apple-touch-icon.png (180x180)');
console.log('  • android-chrome-192x192.png');
console.log('  • android-chrome-512x512.png\n');

console.log('🚀 AFTER GENERATING:');
console.log('─────────────────────────────────────────────────────────');
console.log('1. Place all files in public/ folder');
console.log('2. Restart your dev server');
console.log('3. Hard refresh: Cmd/Ctrl + Shift + R');
console.log('4. Clear browser cache if needed\n');

// Create a simple HTML to view the SVG
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>FlexIt Favicon - For Conversion</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      background: #0A0A0F;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: system-ui;
      color: white;
    }
    .container {
      text-align: center;
    }
    h1 {
      background: linear-gradient(to right, #10B981, #5B21B6, #14F195);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .logo-box {
      background: white;
      padding: 40px;
      border-radius: 20px;
      margin: 20px 0;
      display: inline-block;
    }
    .instructions {
      max-width: 600px;
      text-align: left;
      background: rgba(255,255,255,0.05);
      padding: 20px;
      border-radius: 10px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>FlexIt Favicon</h1>
    <p>Screenshot this logo (on white background) for favicon conversion</p>

    <div class="logo-box">
      <img src="/favicon.svg" width="256" height="256" alt="FlexIt Logo">
    </div>

    <div class="instructions">
      <h3 style="margin-top: 0;">Quick Steps:</h3>
      <ol>
        <li>Screenshot JUST the logo above (the part with white background)</li>
        <li>Go to <a href="https://favicon.io/favicon-converter/" target="_blank" style="color: #14F195;">favicon.io/favicon-converter</a></li>
        <li>Upload your screenshot</li>
        <li>Download the generated favicon package</li>
        <li>Replace the files in your public/ folder</li>
        <li>Restart server and hard refresh</li>
      </ol>
    </div>
  </div>
</body>
</html>`;

const htmlPath = path.join(__dirname, '..', 'public', 'favicon-screenshot.html');
fs.writeFileSync(htmlPath, htmlContent);

console.log('📄 Created helper page: public/favicon-screenshot.html');
console.log('   Visit: http://localhost:3000/favicon-screenshot.html');
console.log('   Use this page to screenshot the logo for conversion!\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('💡 TIP: The fastest way is to visit the screenshot page,');
console.log('   take a screenshot, and use favicon.io to convert it!\n');
