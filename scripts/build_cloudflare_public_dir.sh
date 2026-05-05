#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="${CLOUDFLARE_PAGES_OUTPUT_DIR:-$ROOT_DIR/.cloudflare-pages}"

rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR/assets/logo" "$PUBLIC_DIR/sales-kit"

copy_file() {
  local src="$1"
  local dest_dir
  dest_dir="$(dirname "$PUBLIC_DIR/$src")"
  mkdir -p "$dest_dir"
  cp "$ROOT_DIR/$src" "$PUBLIC_DIR/$src"
}

copy_file index.html
copy_file studio.html
copy_file servizi.html
copy_file preventivo.html
copy_file case-studies.html
copy_file identita-operativa.html
copy_file termini-commerciali.html
copy_file privacy.html
copy_file pagamento-confermato.html
copy_file styles.css
copy_file favicon.svg
copy_file i18n.json
copy_file app.js
copy_file app-bootstrap.js
copy_file app-analytics.js
copy_file app-forms.js
copy_file app-fx.js
copy_file app-i18n.js
copy_file app-quote-estimator.js
copy_file app-seo.js
copy_file robots.txt
copy_file sitemap.xml
copy_file _headers
copy_file sales-kit/fx_rates.json

cat > "$PUBLIC_DIR/site-config.js" <<'CONFIG'
window.CDS_CONFIG = {
  leadCaptureEndpoint: 'https://script.google.com/macros/s/AKfycbwuFXalSZeJUDgqWZlHVqY0CFXipuElIX7lrc-X9FgK1VozP60PuXqiF8IgzF9rbGYWwg/exec',
  leadCaptureMode: 'google-apps-script',
  backupToGmail: false,
  analytics: {
    enabled: true,
    requiresConsent: true,
    endpoint: 'https://script.google.com/macros/s/AKfycbwuFXalSZeJUDgqWZlHVqY0CFXipuElIX7lrc-X9FgK1VozP60PuXqiF8IgzF9rbGYWwg/exec',
    action: 'track_event',
    consentStorageKey: 'cds_cookie_consent_v1',
    localBufferKey: 'cds_analytics_buffer_v1',
    sessionKey: 'cds_analytics_session_v1',
    maxBufferedEvents: 250
  },
  fx: {
    mode: 'local',
    ratesPath: 'sales-kit/fx_rates.json',
    remoteEndpoint: 'https://api.frankfurter.app/latest?from=EUR'
  }
};
CONFIG

cp "$ROOT_DIR/assets/logo/cantoni_primary_horizontal_small.svg" "$PUBLIC_DIR/assets/logo/"
cp "$ROOT_DIR/assets/logo/cantoni_icona_quadrata.svg" "$PUBLIC_DIR/assets/logo/"
cp "$ROOT_DIR/assets/logo/cantoni_icona_quadrata.png" "$PUBLIC_DIR/assets/logo/"

echo "public_dir=$PUBLIC_DIR"
