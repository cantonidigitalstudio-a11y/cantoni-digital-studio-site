#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="${EXCELLENTIA_PUBLIC_DIR:-$ROOT_DIR/.excellentia-public}"
DOMAIN="${EXCELLENTIA_PUBLIC_DOMAIN:-https://excellentiavip.com}"

rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"

copy_file() {
  local src="$1"
  mkdir -p "$PUBLIC_DIR/$(dirname "$src")"
  cp "$ROOT_DIR/$src" "$PUBLIC_DIR/$src"
}

copy_dir() {
  local src="$1"
  mkdir -p "$PUBLIC_DIR/$(dirname "$src")"
  cp -R "$ROOT_DIR/$src" "$PUBLIC_DIR/$src"
}

PUBLIC_FILES=(
  "_headers"
  "favicon.svg"
  "site-config.js"
  "excellentia-vip.css"
  "excellentia-vip.html"
  "excellentia-vip.js"
  "excellentia-vip-catalog.js"
  "excellentia-vip-fx.js"
  "excellentia-vip-i18n.js"
  "excellentia-vip-localization-extras.js"
  "excellentia-vip-seo.js"
  "excellentia-vip-account.html"
  "excellentia-vip-account.js"
  "excellentia-vip-admin.html"
  "excellentia-vip-admin.js"
  "excellentia-vip-booking.html"
  "excellentia-vip-booking-i18n.js"
  "excellentia-vip-fleet.html"
  "excellentia-vip-fleet-i18n.js"
  "excellentia-vip-operations.html"
  "excellentia-vip-operations-i18n.js"
  "excellentia-vip-packages.html"
  "excellentia-vip-packages-i18n.js"
)

for file in "${PUBLIC_FILES[@]}"; do
  copy_file "$file"
done

copy_dir "assets/excellentia-vip"

cat > "$PUBLIC_DIR/index.html" <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Excellentia VIP</title>
    <meta http-equiv="refresh" content="0; url=/excellentia-vip">
    <link rel="canonical" href="https://excellentiavip.com/excellentia-vip">
    <script>
      window.location.replace("/excellentia-vip");
    </script>
  </head>
  <body>
    <p>Redirecting to <a href="/excellentia-vip">Excellentia VIP</a>...</p>
  </body>
</html>
EOF

cat > "$PUBLIC_DIR/_redirects" <<'EOF'
/ /excellentia-vip 301
/excellentia-vip /excellentia-vip.html 200
/excellentia-vip-account /excellentia-vip-account.html 200
/excellentia-vip-booking /excellentia-vip-booking.html 200
/excellentia-vip-fleet /excellentia-vip-fleet.html 200
/excellentia-vip-operations /excellentia-vip-operations.html 200
/excellentia-vip-packages /excellentia-vip-packages.html 200
EOF

cat > "$PUBLIC_DIR/robots.txt" <<EOF
User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml
EOF

cat > "$PUBLIC_DIR/sitemap.xml" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${DOMAIN}/excellentia-vip</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${DOMAIN}/excellentia-vip-account</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${DOMAIN}/excellentia-vip-booking</loc><changefreq>weekly</changefreq><priority>0.95</priority></url>
  <url><loc>${DOMAIN}/excellentia-vip-packages</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${DOMAIN}/excellentia-vip-fleet</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${DOMAIN}/excellentia-vip-operations</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
</urlset>
EOF

printf 'public_dir=%s\n' "$PUBLIC_DIR"
