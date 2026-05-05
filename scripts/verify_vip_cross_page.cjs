const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const assert = require("assert/strict");
const { chromium, devices } = require("playwright");

const ROOT_DIR = path.resolve(__dirname, "..");
const LANGS = ["en", "es", "de", "it", "fr", "pt", "ru", "zh"];
const SCENARIO_TIMEOUT_MS = 45000;
const VIEWS = [
  { name: "desktop", contextOptions: { viewport: { width: 1440, height: 1100 } } },
  { name: "mobile", contextOptions: devices["iPhone 12"] }
];

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

async function goto(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(150);
}

function expectedLangParam(lang) {
  return lang === "en" ? null : lang;
}

function buildUrl(baseUrl, pagePath, lang) {
  const url = new URL(pagePath, `${baseUrl}/`);
  if (lang !== "en") {
    url.searchParams.set("lang", lang);
  }
  return url.toString();
}

async function setLang(page, pickerSelector, lang) {
  const picker = page.locator(pickerSelector);
  await picker.waitFor({ state: "visible", timeout: 10000 });
  const currentValue = await picker.inputValue();
  if (currentValue !== lang) {
    await Promise.allSettled([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 4000 }),
      picker.selectOption(lang)
    ]);
  }

  await page.waitForFunction(
    ({ selector, expected }) => document.querySelector(selector)?.value === expected,
    { selector: pickerSelector, expected: lang },
    { timeout: 5000 }
  );
  await page.waitForTimeout(150);
  assert.equal(await picker.inputValue(), lang, `Expected ${pickerSelector}=${lang}`);
}

async function runWithTimeout(work, timeoutMs, label) {
  let timer;
  try {
    return await Promise.race([
      work(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function assertPathAndLang(page, expectedPath, lang, label) {
  const currentUrl = new URL(page.url());
  assert.equal(currentUrl.pathname, expectedPath, `${label} path mismatch: ${currentUrl.pathname}`);
  assert.equal(
    currentUrl.searchParams.get("lang"),
    expectedLangParam(lang),
    `${label} lang mismatch: ${currentUrl.search}`
  );
}

function assertHrefLang(href, lang, label, requiredKeys = []) {
  assert.ok(href, `${label} is missing href`);
  const url = new URL(href, "http://127.0.0.1");
  assert.equal(url.searchParams.get("lang"), expectedLangParam(lang), `${label} lost lang=${lang}`);
  for (const key of requiredKeys) {
    assert.ok(url.searchParams.get(key), `${label} missing ${key} preconfig`);
  }
}

async function clickAndWait(page, locator, expectedPathname) {
  const href = await locator.getAttribute("href");
  assert.ok(href, `Missing href for ${expectedPathname}`);
  await goto(page, new URL(href, page.url()).toString());
  const currentUrl = new URL(page.url());
  assert.ok(currentUrl.pathname.endsWith(expectedPathname), `Expected ${expectedPathname}, got ${currentUrl.pathname}`);
}

async function bookingState(page) {
  return page.evaluate(() => ({
    service: document.querySelector("#serviceChips [data-service].is-active")?.getAttribute("data-service") || null,
    packageId: document.querySelector("#packageCards [data-package].is-active")?.getAttribute("data-package") || null,
    vehicle: document.querySelector("#vehicleSelect")?.value || null,
    route: document.querySelector("#routeSelect")?.value || null,
    extras: Array.from(document.querySelectorAll("#extrasGrid [data-extra].is-active"))
      .map((el) => el.getAttribute("data-extra"))
      .sort()
  }));
}

async function bookingCartCount(page) {
  return Number(await page.locator("#cartCount").textContent());
}

async function saveCurrentBookingSelection(page, expectedCount, label) {
  await page.locator("#addToCartCTA").click();
  const count = await bookingCartCount(page);
  assert.equal(count, expectedCount, `${label} expected cart count ${expectedCount}, got ${count}`);
}

async function assertBookingRailLocalized(page, lang, label) {
  if (!["it", "fr", "pt", "ru", "zh"].includes(lang)) return;

  const railText = (await page.locator(".builder-rail").innerText()).replace(/\s+/g, " ").trim();
  const forbiddenTokens = [
    "Live concept summary",
    "Premium itinerary cart",
    "Save selection",
    "Email request",
    "WhatsApp request",
    "Email full itinerary",
    "WhatsApp full itinerary",
    "Request readiness",
    "Load into builder",
    "Duplicate",
    "Clear",
    "Route:",
    "Package:",
    "Timing:",
    "Add-ons:"
  ];

  for (const token of forbiddenTokens) {
    assert.ok(!railText.includes(token), `${label} left English booking-rail token "${token}" in ${lang}`);
  }

  const emailHref = await page.locator("#emailCartCTA").getAttribute("href");
  const whatsappHref = await page.locator("#whatsappCartCTA").getAttribute("href");
  assert.ok(emailHref && emailHref.startsWith("mailto:"), `${label} missing populated email itinerary CTA`);
  assert.ok(whatsappHref && whatsappHref.startsWith("https://wa.me/"), `${label} missing populated WhatsApp itinerary CTA`);
}

async function attachIssueCollectors(page, issues, scope) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      issues.push(`${scope}:console:${msg.type()}:${msg.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    issues.push(`${scope}:pageerror:${error.message}`);
  });
}

async function createScenarioPage(browser, view, lang, issues) {
  const context = await browser.newContext(view.contextOptions);
  await context.route("https://fonts.googleapis.com/**", (route) => {
    route.fulfill({ status: 200, contentType: "text/css; charset=utf-8", body: "" });
  });
  await context.route("https://fonts.gstatic.com/**", (route) => {
    route.fulfill({ status: 204, body: "" });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(15000);
  await attachIssueCollectors(page, issues, `${view.name}/${lang}`);
  return { context, page };
}

async function auditHome(browser, baseUrl, view, lang, issues) {
  const { context, page } = await createScenarioPage(browser, view, lang, issues);
  const scope = `[${view.name}/${lang}] home`;

  try {
    await goto(page, buildUrl(baseUrl, "excellentia-vip.html", lang));
    await setLang(page, "#vipLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip.html", lang, `${scope} landing`);

    if (lang === "es") {
      const packagesText = (await page.locator('.nav-links a[href*="excellentia-vip-packages.html"]').first().textContent())
        .trim()
        .toLowerCase();
      assert.ok(packagesText.includes("paquet"), `${scope} packages nav label did not translate to Spanish`);
    }

    if (lang === "de") {
      const bookingText = (await page.locator('.nav-links a[href*="excellentia-vip-booking.html"]').first().textContent())
        .trim()
        .toLowerCase();
      assert.ok(bookingText.includes("buch"), `${scope} booking nav label did not translate to German`);
    }

    const headerBooking = page.locator('.site-header .btn.btn-primary[href*="excellentia-vip-booking.html"]').first();
    const packagesLink = page.locator('.nav-links a[href*="excellentia-vip-packages.html"]').first();
    const fleetFooter = page.locator('.footer-links a[href*="excellentia-vip-fleet.html"]').first();
    const bookingFooter = page.locator('.footer-links a[href*="excellentia-vip-booking.html"]').first();

    assertHrefLang(await headerBooking.getAttribute("href"), lang, `${scope} header CTA`);
    assertHrefLang(await packagesLink.getAttribute("href"), lang, `${scope} packages nav`);
    assertHrefLang(await fleetFooter.getAttribute("href"), lang, `${scope} fleet footer`);
    assertHrefLang(await bookingFooter.getAttribute("href"), lang, `${scope} booking footer`);

    await clickAndWait(page, headerBooking, "/excellentia-vip-booking.html");
    await setLang(page, "#vipBookingLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-booking.html", lang, `${scope} header CTA landing`);
  } finally {
    await context.close();
  }
}

async function auditBookingChrome(browser, baseUrl, view, lang, issues) {
  const { context, page } = await createScenarioPage(browser, view, lang, issues);
  const scope = `[${view.name}/${lang}] booking`;

  try {
    await goto(page, buildUrl(baseUrl, "excellentia-vip-booking.html", lang));
    await setLang(page, "#vipBookingLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-booking.html", lang, `${scope} landing`);

    const homeLink = page.locator("#bookMainNavHomeLink");
    const opsLink = page.locator("#bookMainNavOperationsLink");
    const packagesFooter = page.locator("#bookFooterPackagesLink");

    assertHrefLang(await homeLink.getAttribute("href"), lang, `${scope} home nav`);
    assertHrefLang(await opsLink.getAttribute("href"), lang, `${scope} operations nav`);
    assertHrefLang(await packagesFooter.getAttribute("href"), lang, `${scope} packages footer`);

    await clickAndWait(page, opsLink, "/excellentia-vip-operations.html");
    await setLang(page, "#vipOpsLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-operations.html", lang, `${scope} operations nav landing`);
  } finally {
    await context.close();
  }
}

async function auditPackages(browser, baseUrl, view, lang, issues) {
  const { context, page } = await createScenarioPage(browser, view, lang, issues);
  const scope = `[${view.name}/${lang}] packages`;

  try {
    await goto(page, buildUrl(baseUrl, "excellentia-vip-packages.html", lang));
    await setLang(page, "#vipPackagesLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-packages.html", lang, `${scope} landing`);

    const utilityHome = page.locator('.utility-links a[href*="excellentia-vip.html"]').first();
    const footerOps = page.locator('.footer-links a[href*="excellentia-vip-operations.html"]').first();
    const packageCta = page.locator('a[href*="excellentia-vip-booking.html"][href*="service="][href*="package="]').first();

    assertHrefLang(await utilityHome.getAttribute("href"), lang, `${scope} utility home`);
    assertHrefLang(await footerOps.getAttribute("href"), lang, `${scope} footer operations`);
    assertHrefLang(await packageCta.getAttribute("href"), lang, `${scope} package CTA`, ["service", "package", "vehicle"]);

    await clickAndWait(page, packageCta, "/excellentia-vip-booking.html");
    await setLang(page, "#vipBookingLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-booking.html", lang, `${scope} booking landing`);

    const state = await bookingState(page);
    assert.ok(state.service, `${scope} missing service prefill ${JSON.stringify(state)}`);
    assert.ok(state.packageId, `${scope} missing package prefill ${JSON.stringify(state)}`);
    assert.ok(state.vehicle, `${scope} missing vehicle prefill ${JSON.stringify(state)}`);
    await saveCurrentBookingSelection(page, 1, `${scope} save`);
    await assertBookingRailLocalized(page, lang, `${scope} save`);
  } finally {
    await context.close();
  }
}

async function auditFleet(browser, baseUrl, view, lang, issues) {
  const { context, page } = await createScenarioPage(browser, view, lang, issues);
  const scope = `[${view.name}/${lang}] fleet`;

  try {
    await goto(page, buildUrl(baseUrl, "excellentia-vip-fleet.html", lang));
    await setLang(page, "#vipFleetLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-fleet.html", lang, `${scope} landing`);

    const utilityPackages = page.locator('.utility-links a[href*="excellentia-vip-packages.html"]').first();
    const fleetCta = page.locator('a[href*="excellentia-vip-booking.html"][href*="vehicle="]').first();

    assertHrefLang(await utilityPackages.getAttribute("href"), lang, `${scope} utility packages`);
    assertHrefLang(await fleetCta.getAttribute("href"), lang, `${scope} fleet CTA`, ["vehicle"]);

    await clickAndWait(page, fleetCta, "/excellentia-vip-booking.html");
    await setLang(page, "#vipBookingLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-booking.html", lang, `${scope} booking landing`);

    const state = await bookingState(page);
    assert.ok(state.vehicle, `${scope} missing vehicle prefill ${JSON.stringify(state)}`);
  } finally {
    await context.close();
  }
}

async function auditOperations(browser, baseUrl, view, lang, issues) {
  const { context, page } = await createScenarioPage(browser, view, lang, issues);
  const scope = `[${view.name}/${lang}] operations`;

  try {
    await goto(page, buildUrl(baseUrl, "excellentia-vip-operations.html", lang));
    await setLang(page, "#vipOpsLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-operations.html", lang, `${scope} landing`);

    const heroBooking = page.locator('.site-header .btn.btn-primary[href*="excellentia-vip-booking.html"]').first();
    const utilityPackages = page.locator('.utility-links a[href*="excellentia-vip-packages.html"]').first();
    const footerFleet = page.locator('.footer-links a[href*="excellentia-vip-fleet.html"]').first();
    const opsCta = page.locator('a[href*="excellentia-vip-booking.html"][href*="extras="]').first();

    assertHrefLang(await heroBooking.getAttribute("href"), lang, `${scope} header CTA`);
    assertHrefLang(await utilityPackages.getAttribute("href"), lang, `${scope} utility packages`);
    assertHrefLang(await footerFleet.getAttribute("href"), lang, `${scope} footer fleet`);
    assertHrefLang(await opsCta.getAttribute("href"), lang, `${scope} ops CTA`, ["extras"]);

    if (lang === "it") {
      const deskText = (await page.locator("#opsDeskEyebrow").textContent()).trim().toLowerCase();
      assert.ok(deskText.includes("chiarezza") || deskText.includes("servizio"), `${scope} desk eyebrow did not translate cleanly to Italian`);
    }

    if (lang === "fr") {
      const channelsText = (await page.locator("#opsChannelsEyebrow").textContent()).trim().toLowerCase();
      assert.ok(channelsText.includes("acheminement"), `${scope} channels eyebrow did not translate cleanly to French`);
    }

    if (lang === "pt") {
      const closeText = (await page.locator("#opsCloseTitle").textContent()).trim().toLowerCase();
      assert.ok(closeText.includes("hóspede") || closeText.includes("atendido"), `${scope} close title did not translate cleanly to Portuguese`);
    }

    await clickAndWait(page, opsCta, "/excellentia-vip-booking.html");
    await setLang(page, "#vipBookingLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-booking.html", lang, `${scope} booking landing`);

    const state = await bookingState(page);
    assert.ok(state.extras.length > 0, `${scope} lost extras prefill ${JSON.stringify(state)}`);
    await saveCurrentBookingSelection(page, 1, `${scope} save`);
    await assertBookingRailLocalized(page, lang, `${scope} save`);
  } finally {
    await context.close();
  }
}

async function auditAccount(browser, baseUrl, view, lang, issues) {
  const { context, page } = await createScenarioPage(browser, view, lang, issues);
  const scope = `[${view.name}/${lang}] account`;

  try {
    await goto(page, buildUrl(baseUrl, "excellentia-vip-account.html", lang));
    await setLang(page, "#vipAccountLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-account.html", lang, `${scope} landing`);

    const utilityHome = page.locator("#accountUtilityHomeLink");
    const utilityBooking = page.locator("#accountUtilityBookingLink");
    const primaryBooking = page.locator("#accountPrimaryBookingCTA");
    const railBooking = page.locator("#accountRailBookingLink");

    assertHrefLang(await utilityHome.getAttribute("href"), lang, `${scope} utility home`);
    assertHrefLang(await utilityBooking.getAttribute("href"), lang, `${scope} utility booking`);
    assertHrefLang(await primaryBooking.getAttribute("href"), lang, `${scope} primary booking`);
    assertHrefLang(await railBooking.getAttribute("href"), lang, `${scope} rail booking`);

    await page.locator("#accountMagicLinkButton").waitFor({ state: "visible", timeout: 5000 });
    await page.locator("#accountSaveProfileButton").waitFor({ state: "visible", timeout: 5000 });
    await page.locator("#accountClaimOfferButton").waitFor({ state: "visible", timeout: 5000 });

    if (lang === "it") {
      const title = (await page.locator("#accountHeroTitle").textContent()).trim().toLowerCase();
      assert.ok(title.includes("profilo") || title.includes("offerte"), `${scope} hero title did not translate cleanly to Italian`);
    }

    if (lang === "fr") {
      const accessTitle = (await page.locator("#accountAccessTitle").textContent()).trim().toLowerCase();
      assert.ok(accessTitle.includes("lien") || accessTitle.includes("connexion"), `${scope} access title did not translate cleanly to French`);
    }

    await clickAndWait(page, primaryBooking, "/excellentia-vip-booking.html");
    await setLang(page, "#vipBookingLangPicker", lang);
    assertPathAndLang(page, "/excellentia-vip-booking.html", lang, `${scope} booking landing`);
  } finally {
    await context.close();
  }
}

async function auditAdmin(browser, baseUrl, view, issues) {
  const { context, page } = await createScenarioPage(browser, view, "en", issues);
  const scope = `[${view.name}/en] admin`;

  try {
    await goto(page, new URL("excellentia-vip-admin.html", `${baseUrl}/`).toString());
    const currentUrl = new URL(page.url());
    assert.equal(currentUrl.pathname, "/excellentia-vip-admin.html", `${scope} path mismatch: ${currentUrl.pathname}`);

    await page.locator("#adminSearch").waitFor({ state: "visible", timeout: 5000 });
    await page.locator('[data-admin-action="import-current"]').first().waitFor({ state: "visible", timeout: 5000 });
    await page.locator("#adminApiKeyInput").waitFor({ state: "visible", timeout: 5000 });
    await page.locator("#adminLedgerList").waitFor({ state: "visible", timeout: 5000 });
    await page.locator("#adminDetailTitle").waitFor({ state: "visible", timeout: 5000 });

    const headerBooking = page.locator('.site-header .btn.btn-primary[href*="excellentia-vip-booking.html"]').first();
    const utilityHome = page.locator('.utility-links a[href*="excellentia-vip.html"]').first();

    assert.ok((await headerBooking.getAttribute("href"))?.includes("excellentia-vip-booking.html"), `${scope} missing booking CTA`);
    assert.ok((await utilityHome.getAttribute("href"))?.includes("excellentia-vip.html"), `${scope} missing home utility link`);
  } finally {
    await context.close();
  }
}

async function runScenario(browser, baseUrl, view, lang, issues, scenario) {
  const label = `${view.name}/${lang} ${scenario.name}`;
  const startedAt = Date.now();
  console.log(`START ${label}`);
  await runWithTimeout(() => scenario.run(browser, baseUrl, view, lang, issues), SCENARIO_TIMEOUT_MS, label);
  console.log(`PASS ${label} ${Date.now() - startedAt}ms`);
  return `[${view.name}/${lang}] ${scenario.name} PASS`;
}

async function run() {
  const server = createStaticServer(ROOT_DIR);
  const address = await listen(server);
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  const issues = [];
  const results = [];
  const scenarios = [
    { name: "home", run: auditHome },
    { name: "booking", run: auditBookingChrome },
    { name: "packages", run: auditPackages },
    { name: "fleet", run: auditFleet },
    { name: "operations", run: auditOperations },
    { name: "account", run: auditAccount }
  ];

  try {
    for (const view of VIEWS) {
      for (const lang of LANGS) {
        for (const scenario of scenarios) {
          results.push(await runScenario(browser, baseUrl, view, lang, issues, scenario));
        }
      }
    }

    for (const view of VIEWS) {
      results.push(await runScenario(browser, baseUrl, view, "en", issues, { name: "admin", run: (currentBrowser, currentBaseUrl, currentView) => auditAdmin(currentBrowser, currentBaseUrl, currentView, issues) }));
    }

    if (issues.length) {
      throw new Error(`Console/page issues detected:\n${issues.join("\n")}`);
    }

    console.log(results.join("\n"));
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

run().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
