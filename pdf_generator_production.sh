#!/bin/bash

# Production version of HTML to PDF converter for Keyboard Maestro
# Uses the DebugOutput variable from Keyboard Maestro

set -e  # Exit on any error

# Choose where to save the PDF
OUT="$HOME/Desktop/DebugOutput.pdf"

# Check if pandoc exists at the expected location
if [[ ! -x "/opt/homebrew/bin/pandoc" ]]; then
    echo "ERROR: pandoc not found at /opt/homebrew/bin/pandoc" >&2
    exit 1
fi

# Check if xelatex exists
if ! command -v xelatex >/dev/null 2>&1; then
    echo "ERROR: xelatex not found in PATH" >&2
    exit 1
fi

# Grab KM variable and check if it's empty
HTML_CONTENT="$(echo "$KMVAR_DebugOutput")"

if [[ -z "$HTML_CONTENT" ]]; then
    echo "ERROR: KMVAR_DebugOutput is empty or undefined" >&2
    echo "Make sure the Keyboard Maestro variable 'DebugOutput' contains HTML content" >&2
    exit 1
fi

# Convert HTML to PDF using pandoc
if echo "$HTML_CONTENT" | /opt/homebrew/bin/pandoc \
  --from=html \
  --standalone \
  --embed-resources \
  --pdf-engine=xelatex \
  -V geometry:margin=25mm \
  -V papersize=A4 \
  -o "$OUT"; then
    echo "PDF created successfully: $OUT"
else
    echo "ERROR: Failed to create PDF" >&2
    exit 1
fi
