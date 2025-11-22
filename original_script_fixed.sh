#!/bin/bash

# Set PATH explicitly for Keyboard Maestro
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Library/TeX/texbin:$PATH"

# Choose where to save the PDF
OUT="$HOME/Desktop/DebugOutput.pdf"

# Grab KM variable
HTML_CONTENT="$(echo "$KMVAR_DebugOutput")"

# Pipe it to pandoc
echo "$HTML_CONTENT" | /opt/homebrew/bin/pandoc \
  --from=html \
  --standalone \
  --embed-resources \
  --pdf-engine=xelatex \
  -V geometry:margin=25mm \
  -V papersize=A4 \
  -o "$OUT"
