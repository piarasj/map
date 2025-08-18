#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Library/TeX/texbin:$PATH"

OUT="$HOME/Sites/html/popuphtml.pdf "
HTML_FILE="/Users/pjackson/Sites/html/popuphtml.html"

if [[ ! -f "$HTML_FILE" ]]; then
  echo "ERROR: Source HTML file not found: $HTML_FILE" >&2
  exit 1
fi

/opt/homebrew/bin/pandoc \
  --from=html \
  --standalone \
  --embed-resources \
  --pdf-engine=xelatex \
  -V geometry:margin=25mm \
  -V papersize=A4 \
  "$HTML_FILE" -o "$OUT"

echo "PDF created successfully: $OUT"
