#!/bin/bash

# FlexIt Favicon Updater
# This script helps you replace favicon files after converting them

echo ""
echo "🎨 FlexIt Favicon Updater"
echo "══════════════════════════════════════════════════════════"
echo ""

# Get the project root directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
PUBLIC_DIR="$PROJECT_DIR/public"

echo "Project: $PROJECT_DIR"
echo "Public folder: $PUBLIC_DIR"
echo ""

# Check if favicon_io folder exists in Downloads
FAVICON_DIR=""

if [ -d "$HOME/Downloads/favicon_io" ]; then
    FAVICON_DIR="$HOME/Downloads/favicon_io"
    echo "✅ Found favicon files in: $FAVICON_DIR"
elif [ -d "$HOME/Downloads/favicon" ]; then
    FAVICON_DIR="$HOME/Downloads/favicon"
    echo "✅ Found favicon files in: $FAVICON_DIR"
else
    echo "❌ Favicon folder not found in Downloads"
    echo ""
    echo "📋 Please follow these steps:"
    echo ""
    echo "1. Download logo from: http://localhost:3000/download-logo.html"
    echo "   → Click 'Download PNG' under 'Logo on White'"
    echo ""
    echo "2. Convert to favicon:"
    echo "   → Visit: https://favicon.io/favicon-converter/"
    echo "   → Upload the PNG you downloaded"
    echo "   → Click 'Download' to get favicon_io.zip"
    echo ""
    echo "3. Extract the ZIP file (should create 'favicon_io' folder in Downloads)"
    echo ""
    echo "4. Run this script again:"
    echo "   bash scripts/update-favicon.sh"
    echo ""
    exit 1
fi

echo ""
echo "📁 Files to copy:"
echo "─────────────────────────────────────────────────────────"

FILES=(
    "favicon.ico"
    "favicon-16x16.png"
    "favicon-32x32.png"
    "apple-touch-icon.png"
    "android-chrome-192x192.png"
    "android-chrome-512x512.png"
)

# Check which files exist
MISSING_FILES=()
for file in "${FILES[@]}"; do
    if [ -f "$FAVICON_DIR/$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Some files are missing. Please regenerate favicon package."
    exit 1
fi

echo ""
echo "🔄 Ready to copy files to public/ folder"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Copying files..."
echo "─────────────────────────────────────────────────────────"

for file in "${FILES[@]}"; do
    cp "$FAVICON_DIR/$file" "$PUBLIC_DIR/$file"
    echo "  ✓ Copied $file"
done

echo ""
echo "══════════════════════════════════════════════════════════"
echo "✅ Favicon files updated successfully!"
echo ""
echo "🚀 Next steps:"
echo "  1. Restart your dev server (Ctrl+C, then: pnpm dev)"
echo "  2. Visit: http://localhost:3000"
echo "  3. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "  4. Check browser tab for new favicon!"
echo ""
echo "💡 Tip: If favicon still doesn't change, clear browser cache:"
echo "   Chrome: Settings → Privacy → Clear browsing data → Cached images"
echo ""
