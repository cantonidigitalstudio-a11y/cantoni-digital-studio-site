const assert = require("assert/strict");
const path = require("path");
const { pathToFileURL } = require("url");

const ROOT_DIR = path.resolve(__dirname, "..");

async function loadModule(relativePath) {
  return import(pathToFileURL(path.join(ROOT_DIR, relativePath)).href);
}

async function run() {
  const auth = await loadModule("server/lib/supabase-auth.js");
  const readiness = await loadModule("server/lib/booking-readiness.js");

  assert.equal(auth.adminKeyFallbackEnabled({ NODE_ENV: "production" }), false, "Production should default to staff-session auth without admin-key fallback");
  assert.equal(auth.adminKeyFallbackEnabled({ NODE_ENV: "production", VIP_ADMIN_KEY_FALLBACK_ENABLED: "true" }), true, "Fallback flag should explicitly re-enable admin-key access");

  const noFallbackRequest = new Request("https://example.com/api/bookings/records", {
    headers: {
      "x-vip-admin-key": "secret-key"
    }
  });
  const noFallbackResult = await auth.requireStaffAccess(noFallbackRequest, {
    VIP_ADMIN_API_KEY: "secret-key",
    NODE_ENV: "production"
  });
  assert.equal(noFallbackResult.ok, false, "Admin key alone should not authorize production staff access when fallback is disabled");
  assert.equal(noFallbackResult.status, 401, "Disabled fallback should surface as unauthorized");

  const fallbackRequest = new Request("https://example.com/api/bookings/records", {
    headers: {
      "x-vip-admin-key": "secret-key"
    }
  });
  const fallbackResult = await auth.requireStaffAccess(fallbackRequest, {
    VIP_ADMIN_API_KEY: "secret-key",
    NODE_ENV: "production",
    VIP_ADMIN_KEY_FALLBACK_ENABLED: "true"
  });
  assert.equal(fallbackResult.ok, true, "Explicit fallback should still allow local emergency admin-key access");
  assert.equal(fallbackResult.type, "admin_key", "Fallback authorization should identify the emergency admin-key path");

  const readinessSessionOnly = readiness.buildBookingReadiness({
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    NODE_ENV: "production"
  });
  const sessionOnlyCheck = readinessSessionOnly.checks.find((item) => item.id === "admin-api");
  assert.equal(sessionOnlyCheck && sessionOnlyCheck.status, "ready", "Staff-session admin access should count as ready without the admin-key fallback");
  assert.match(sessionOnlyCheck && sessionOnlyCheck.detail || "", /staff sessions/i, "Readiness should explain that staff sessions are the standard admin path");
  assert.match(sessionOnlyCheck && sessionOnlyCheck.detail || "", /fallback stays off/i, "Readiness should reflect that the admin-key fallback is disabled by default");

  const readinessWithFallback = readiness.buildBookingReadiness({
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    VIP_ADMIN_API_KEY: "secret-key",
    VIP_ADMIN_KEY_FALLBACK_ENABLED: "true",
    NODE_ENV: "production"
  });
  const fallbackCheck = readinessWithFallback.checks.find((item) => item.id === "admin-api");
  assert.equal(fallbackCheck && fallbackCheck.status, "ready", "Staff-session admin access should remain ready when fallback is enabled");
  assert.match(fallbackCheck && fallbackCheck.detail || "", /fallback enabled/i, "Readiness should call out when emergency admin-key fallback is enabled");

  console.log("VIP server logic PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
