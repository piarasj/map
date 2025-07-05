#!/bin/bash

# MapaLister Icon Generator
# Requires: npm install -g sharp-cli

echo "🎨 Generating MapaLister icons with sharp..."

# Create icons directory
mkdir -p icons

# Check if sharp is installed
if ! command -v sharp &> /dev/null; then
    echo "📦 Installing sharp-cli..."
    /opt/homebrew/bin/npm install -g sharp-cli
fi

# Array of sizes needed
SIZES=(72 96 128 144 152 192 384 512)

# Generate all icon sizes
for size in "${SIZES[@]}"; do
    echo "📏 Generating ${size}x${size} icon..."
    sharp -i logo.svg -o icons/icon-${size}x${size}.png resize $size $size
done

# Generate maskable versions (these can be the same for now)
echo "🎭 Generating maskable icons..."
cp icons/icon-192x192.png icons/icon-192x192-maskable.png
cp icons/icon-512x512.png icons/icon-512x512-maskable.png

# Generate favicon sizes
echo "🌐 Generating favicon sizes..."
sharp -i logo.svg -o favicon-16x16.png resize 16 16
sharp -i logo.svg -o favicon-32x32.png resize 32 32
sharp -i logo.svg -o apple-touch-icon.png resize 180 180

echo "✅ All icons generated successfully!"
echo "📁 Files created in ./icons/ directory"
echo "🔗 Don't forget to update your manifest.json and HTML!"

# List generated files
echo ""
echo "📋 Generated files:"
ls -la icons/
ls -la favicon-*.png apple-touch-icon.png 2>/dev/null || echo "Favicon files in root directory"