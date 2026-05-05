const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const assert = require("assert/strict");
const { chromium } = require("playwright");

const ROOT_DIR = path.resolve(__dirname, "..");

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}

function createStaticServer(rootDir) {
  return http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url, "http://127.0.0.1");
      const pathname = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
      const targetPath = path.normalize(path.join(rootDir, pathname));

      if (!targetPath.startsWith(rootDir)) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Forbidden");
        return;
      }

      const data = await fs.readFile(targetPath);
      res.writeHead(200, { "Content-Type": contentTypeFor(targetPath) });
      res.end(data);
    } catch (error) {
      const statusCode = error && error.code === "ENOENT" ? 404 : 500;
      res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(statusCode === 404 ? "Not found" : "Internal server error");
    }
  });
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server.address();
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function attachIssueCollectors(page, issues, scope) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      issues.push(`${scope}:console:${msg.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    issues.push(`${scope}:pageerror:${error.message}`);
  });
}

async function buildContext(browser, baseUrl, requestLog) {
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 1440, height: 1100 }
  });

  await context.route("https://api.frankfurter.app/**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ rates: { USD: 1 } })
    });
  });

  await context.route("https://fonts.googleapis.com/**", (route) => {
    route.fulfill({ status: 200, contentType: "text/css; charset=utf-8", body: "" });
  });

  await context.route("https://fonts.gstatic.com/**", (route) => {
    route.fulfill({ status: 204, body: "" });
  });

  await context.route("https://script.google.com/macros/s/**", (route) => {
    const requestUrl = new URL(route.request().url());
    const callbackName = requestUrl.searchParams.get("callback") || "__noop";
    route.fulfill({
      status: 200,
      contentType: "application/javascript; charset=utf-8",
      body: `${callbackName}(${JSON.stringify({ ok: true })});`
    });
  });

  await context.route("**/api/leads/capture", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ ok: true })
    });
  });

  context.on("request", (request) => {
    requestLog.push(request.url());
  });

  return context;
}

async function text(page, selector) {
  return (await page.locator(selector).textContent()).trim();
}

async function fillAndCommit(page, selector, value) {
  const field = page.locator(selector);
  await field.fill(value);
  await field.dispatchEvent("change");
  await page.waitForTimeout(80);
}

async function run() {
  const server = createStaticServer(ROOT_DIR);
  const address = await listen(server);
  const baseUrl = `http://${address.address}:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  const requestLog = [];
  const context = await buildContext(browser, baseUrl, requestLog);
  const page = await context.newPage();
  const issues = [];
  attachIssueCollectors(page, issues, "vip-interactions");

  try {
    await page.goto("/excellentia-vip-booking.html", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#bookingReadinessPill");

    const catalogState = await page.evaluate(() => {
      const shared = window.ExcellentiaVipShared || {};
      const catalog = shared.catalog || {};
      return {
        version: catalog.version || "",
        airportMode: typeof shared.requestModeKey === "function" ? shared.requestModeKey("airport") : "",
        conciergeMode: typeof shared.requestModeKey === "function" ? shared.requestModeKey("concierge") : "",
        routeId: typeof shared.routeIdForService === "function" ? shared.routeIdForService("airport", 1) : "",
        bookNowServices: typeof shared.serviceIdsForRequestMode === "function" ? shared.serviceIdsForRequestMode("book_now") : [],
        hasRicaJuices: Array.isArray(shared.extras) ? shared.extras.some((item) => item.id === "ricaJuices") : false
      };
    });
    assert.equal(catalogState.version, "vip-catalog-v1", "VIP booking must expose the unified catalog version");
    assert.equal(catalogState.airportMode, "bookNow", "Airport service should remain book-now in the unified catalog");
    assert.equal(catalogState.conciergeMode, "askFirst", "Concierge service should remain quote-first in the unified catalog");
    assert.equal(catalogState.routeId, "airport-bavaro", "Route IDs should come from the unified catalog");
    assert.deepEqual(catalogState.bookNowServices, ["airport", "chauffeur"], "Book-now services should stay constrained to airport and chauffeur");
    assert.equal(catalogState.hasRicaJuices, true, "Unified catalog should preserve the Dominican juice assortment extra");

    assert.equal(await page.locator("#stripeDepositCTA").isDisabled(), true, "Deposit CTA must stay disabled when Stripe is off");
    assert.equal(await page.locator("#stripeFullCTA").isDisabled(), true, "Full CTA must stay disabled when Stripe is off");

    await fillAndCommit(page, "#guestName", "Meralis VIP");
    await fillAndCommit(page, "#guestEmail", "guest@example.com");
    await fillAndCommit(page, "#guestWhatsapp", "+1 849-555-0100");
    await fillAndCommit(page, "#guestCountry", "Dominican Republic");
    await fillAndCommit(page, "#pickupDate", "2026-04-18");
    await fillAndCommit(page, "#pickupTime", "14:30");
    await fillAndCommit(page, "#pickupPoint", "Punta Cana Airport");
    await page.waitForTimeout(120);

    assert.match(await text(page, "#bookingReadinessTitle"), /ready/i, "Readiness title should switch to ready after filling required details");
    assert.equal(await text(page, "#bookingReadinessPill"), "Locked", "Readiness pill should switch to locked");
    assert.equal(await page.locator("#stripeDepositCTA").isDisabled(), true, "Deposit CTA must still remain disabled with payment setup pending");
    assert.match(await text(page, "#paymentNotice"), /(pending|setup|configured)/i, "Payment notice should clearly stay in pending/setup mode");

    await page.selectOption("#routeSelect", { label: "Punta Cana Airport -> Bavaro" });
    await page.locator("#addToCartCTA").click();
    await page.waitForTimeout(120);
    assert.equal(await text(page, "#cartCount"), "1", "Cart should contain one saved selection after first save");

    await page.locator("[data-duplicate-cart]").first().click();
    await page.waitForTimeout(120);
    assert.equal(await text(page, "#cartCount"), "2", "Cart duplicate should increase saved-item count");

    await page.selectOption("#routeSelect", { label: "Punta Cana Airport -> La Romana" });
    await page.waitForTimeout(80);
    assert.match(await text(page, "#summaryList"), /La Romana/i, "Summary should reflect changed route before load-back");

    await page.locator("[data-load-cart]").first().click();
    await page.waitForTimeout(200);
    assert.match(await text(page, "#summaryList"), /Bavaro/i, "Loading a saved cart item must restore the saved route into the builder");

    await page.goto("/excellentia-vip-admin.html", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#adminPriorityGrid");
    await page.locator('[data-admin-action="import-current"]').first().click();
    await page.waitForTimeout(250);

    assert.equal(await text(page, "#adminKpiTotal"), "1", "Admin import should create one record from the staged itinerary");
    assert.equal(await text(page, "#adminVisibleCount"), "1", "Admin ledger should show the imported record");
    assert.equal(await text(page, "#adminClientEmailLink"), "Email client", "Client email quick action should render");
    assert.match(await page.locator("#adminClientEmailLink").getAttribute("href"), /^mailto:guest@example\.com/i, "Client email quick action should be enabled after import");
    assert.match(await text(page, "#adminPriorityGrid"), /Missing core details/i, "Priority board should render");
    assert.match(await text(page, "#adminPriorityGrid"), /Unassigned operator/i, "Priority board should track operator assignment gaps");

    await fillAndCommit(page, "#detailOperatorEmail", "ops@example.com");
    await fillAndCommit(page, "#detailOperatorWhatsapp", "+1 849-555-0111");
    await page.waitForTimeout(250);

    assert.match(await page.locator("#adminOperatorEmailLink").getAttribute("href"), /^mailto:ops@example\.com/i, "Operator email quick action should enable after operator contact is added");
    assert.match(await page.locator("#adminOperatorWhatsappLink").getAttribute("href"), /^https:\/\/wa\.me\/18495550111/i, "Operator WhatsApp quick action should enable after operator phone is added");

    const stripeRequests = requestLog.filter((url) => {
      return url.includes("/api/stripe/") || url.includes("api.stripe.com");
    });
    assert.deepEqual(stripeRequests, [], "No Stripe network request should fire during the no-charge smoke flow");
    assert.deepEqual(issues, [], `VIP interactions emitted runtime issues: ${issues.join(" | ")}`);

    console.log("VIP interaction smoke PASS");
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
