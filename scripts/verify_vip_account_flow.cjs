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

async function run() {
  const server = createStaticServer(ROOT_DIR);
  const address = await listen(server);
  const baseUrl = `http://${address.address}:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 1440, height: 1100 }
  });
  await context.route("https://fonts.googleapis.com/**", (route) => {
    route.fulfill({ status: 200, contentType: "text/css; charset=utf-8", body: "" });
  });
  await context.route("https://fonts.gstatic.com/**", (route) => {
    route.fulfill({ status: 204, body: "" });
  });
  const page = await context.newPage();
  const issues = [];
  const requests = [];
  attachIssueCollectors(page, issues, "vip-account");

  const profile = {
    id: "cust_1",
    email: "guest@example.com",
    fullName: "Meralis VIP",
    whatsapp: "+1 849-555-0100",
    locale: "en",
    country: "Dominican Republic",
    preferredContactChannel: "both",
    marketingConsent: true,
    whatsappConsent: true,
    notes: "Airport arrival profile",
    privacyAcceptedAt: "2026-04-12T10:00:00.000Z"
  };

  const bookings = [
    {
      code: "EVIP-1042",
      serviceLabel: "Airport transfer",
      pickupDate: "2026-04-18",
      pickupTime: "14:30",
      pickupPoint: "Punta Cana Airport",
      paymentStatus: "pending",
      status: "requested",
      offerCode: "VIP20-TEST",
      notificationStatus: "awaiting_payment",
      items: [{ routeLabel: "Punta Cana Airport -> Bavaro" }]
    }
  ];

  await context.route("**/api/account/profile", async (route) => {
    const request = route.request();
    requests.push({ url: request.url(), method: request.method(), body: request.postDataJSON ? request.postDataJSON() : null });
    if (request.method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({ ok: true, email: "guest@example.com" })
      });
      return;
    }
    if (request.method() === "PATCH") {
      const body = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({
          ok: true,
          profile: Object.assign({}, profile, {
            fullName: body.fullName,
            country: body.country,
            whatsapp: body.whatsapp,
            notes: body.notes
          })
        })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ profile, user: { id: "user_1", email: profile.email, role: "customer" } })
    });
  });

  await context.route("**/api/account/bookings", async (route) => {
    requests.push({ url: route.request().url(), method: route.request().method() });
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ bookings })
    });
  });

  await context.route("**/api/offers/claim", async (route) => {
    requests.push({ url: route.request().url(), method: route.request().method(), body: route.request().postDataJSON() });
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        ok: true,
        offer: {
          code: "VIP20-TEST",
          type: "discount",
          expiresAt: "2026-04-14T12:00:00.000Z"
        }
      })
    });
  });

  await page.goto("/excellentia-vip-account.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#accountMagicLinkButton");

  assert.match(await page.locator("#accountHeroTitle").textContent(), /profile/i, "Account hero should render");

  await page.locator("#accountEmail").fill("guest@example.com");
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/account/profile") && response.request().method() === "POST", { timeout: 12000 }),
    page.locator("#accountMagicLinkButton").click()
  ]);
  await page.waitForFunction(() => {
    return Boolean(document.querySelector("#accountMagicLinkStatus")?.textContent.trim());
  }, null, { timeout: 12000 });
  assert.match(await page.locator("#accountMagicLinkStatus").textContent(), /magic link|link/i, "Magic link status should confirm send");

  await page.evaluate(() => {
    localStorage.setItem("vip_customer_session_v1", JSON.stringify({
      accessToken: "test-token",
      expiresAt: Date.now() + 60 * 60 * 1000
    }));
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#accountBookingsList .account-booking-card");
  assert.equal((await page.locator("#accountSessionState").textContent()).trim(), "Active", "Session pill should switch to active");
  assert.equal(await page.locator("#accountFullName").inputValue(), "Meralis VIP", "Profile data should hydrate into the form");
  assert.match(await page.locator("#accountBookingsList").textContent(), /EVIP-1042/, "Bookings list should render mocked booking code");

  await page.locator("#accountCountry").fill("Dominican Republic / Punta Cana");
  await page.locator("#accountNotes").fill("Updated from customer area");
  await page.locator("#accountSaveProfileButton").click();
  await page.waitForTimeout(150);
  assert.match(await page.locator("#accountSaveStatus").textContent(), /Profile updated/i, "Save status should confirm profile update");

  await page.locator("#accountOfferCode").fill("vip20-test");
  await page.locator("#accountClaimOfferButton").click();
  await page.waitForTimeout(150);
  assert.match(await page.locator("#accountOfferPanel").textContent(), /VIP20-TEST/, "Claimed offer should render in the offer panel");

  await page.locator("#vipAccountLangPicker").selectOption("es");
  await page.waitForTimeout(200);
  assert.equal((await page.locator("#accountNavHomeLink").textContent()).trim(), "Inicio", "Spanish language switch should translate nav");

  const magicLinkRequest = requests.find((entry) => entry.method === "POST" && /account\/profile/.test(entry.url));
  assert.ok(magicLinkRequest, "Magic link request should hit the account profile endpoint");

  assert.deepEqual(issues, [], `VIP account flow emitted runtime issues: ${issues.join(" | ")}`);

  await context.close();
  await browser.close();
  await closeServer(server);
  console.log("VIP account flow PASS");
}

run().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
