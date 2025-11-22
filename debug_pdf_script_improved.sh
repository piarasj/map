#!/bin/bash

set -e  # Exit on any error

echo "=== PDF Generation Debug Script ==="
echo "Timestamp: $(date)"

# Choose where to save the PDF
OUT="$HOME/Desktop/DebugOutput.pdf"
echo "Output file: $OUT"

# Check if pandoc exists
if [[ ! -x "/opt/homebrew/bin/pandoc" ]]; then
    echo "ERROR: pandoc not found at /opt/homebrew/bin/pandoc"
    exit 1
fi

# Check if xelatex exists
if ! command -v xelatex >/dev/null 2>&1; then
    echo "ERROR: xelatex not found in PATH"
    exit 1
fi

# Grab KM variable and check if it's empty
HTML_CONTENT="$(echo "$KMVAR_DebugOutput")"
echo "HTML content length: ${#HTML_CONTENT} characters"

if [[ -z "$HTML_CONTENT" ]]; then
    echo "WARNING: KMVAR_DebugOutput is empty or undefined"
    echo "Creating sample HTML for testing..."
    HTML_CONTENT='<!DOCTYPE html>
<html>
<head>
    <title>Test Document</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Test Document</h1>
    <p>This is a test HTML document for debugging the PDF conversion script.</p>
    <p>Generated at: '$(date)'</p>
</body>
</html>'
fi

# Show first 200 characters of HTML content
echo "HTML preview (first 200 chars):"
echo "${HTML_CONTENT:0:200}..."

# Create temp file for debugging
TEMP_HTML="/tmp/debug_input.html"
echo "$HTML_CONTENT" > "$TEMP_HTML"
echo "Saved HTML to: $TEMP_HTML"

echo "Running pandoc conversion..."

# Pipe it to pandoc with verbose output
echo "$HTML_CONTENT" | /opt/homebrew/bin/pandoc \
  --from=html \
  --standalone \
  --embed-resources \
  --pdf-engine=xelatex \
  -V geometry:margin=25mm \
  -V papersize=A4 \
  --verbose \
  -o "$OUT"

if [[ -f "$OUT" ]]; then
    echo "SUCCESS: PDF created successfully"
    echo "File size: $(du -h "$OUT" | cut -f1)"
    echo "File path: $OUT"
else
    echo "ERROR: PDF was not created"
    exit 1
fi
