#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Black Mask — automated Chromium checks for docs/black-mask/browser-validation.md.
 *
 * Loads a built extension (default: apps/browser/build) into a fresh Chromium profile with
 * Playwright, the way a first install would, and records:
 *   - the built manifest's permissions and declarativeNetRequest ruleset
 *   - the tabs opened on install (the bundled welcome page), and the default server at login
 *   - whether the tracker ruleset is enabled at runtime, whether tracker requests are actually
 *     blocked (net::ERR_BLOCKED_BY_CLIENT), and whether the per-tab count increments
 *   - whether the logged-out privacy routes redirect to login
 *   - every host the browser tried to contact (from a Chromium NetLog)
 *   - light and dark screenshots of the welcome and login screens
 *
 * With --server it also creates a synthetic account on that server through the UI and walks the
 * logged-in checks: vault item and sync (from a second profile), privacy dashboard, fingerprint
 * test, trackers page, personas, data exposure, containers notice, phishing, AI detector page,
 * account security and lock.
 *
 * The run is hermetic: every hostname except localhost and the --server host resolves to
 * NOTFOUND, so nothing else leaves the machine. Blocking still shows up as ERR_BLOCKED_BY_CLIENT
 * because declarativeNetRequest acts before DNS, and the NetLog still records every attempt.
 *
 * Usage:
 *   node scripts/validate-black-mask-chromium.js [--extension <dir>] [--out <dir>]
 *     [--chromium <path>] [--server <https url> [--trust-spki <base64>] [--email <e>] [--password <p>]]
 *
 * Build the extension first (e.g. `npm run build:prod:chrome` in apps/browser). --chromium (or
 * CHROMIUM_PATH) points at a full Chromium binary when Playwright's bundled browser does not match
 * the installed Playwright version; headless-shell builds cannot load extensions.
 *
 * --server must be HTTPS: the extension's self-hosted form refuses plain-HTTP URLs. For a test
 * server with a self-signed certificate, pass its SPKI hash as --trust-spki, e.g.
 *   openssl x509 -in cert.pem -pubkey -noout | openssl pkey -pubin -outform der \
 *     | openssl dgst -sha256 -binary | base64
 * The default --email is unique per run, so repeated runs never collide on the same server.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const { chromium } = require("playwright");

// The inherited device detection recognizes Chrome only by " Chrome/" in the user agent. Headless
// Chromium reports "HeadlessChrome/", which that detection classifies as Safari, sending the
// background down Safari-only paths (phishing detection reports unavailable, no welcome tab).
// Present a regular Chrome user agent so the run exercises the Chrome code paths.
const CHROME_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";

const PRIVACY_ROUTES = [
  "privacy-dashboard",
  "personas",
  "trackers",
  "fingerprint",
  "data-exposure",
  "persona-containers",
  "phishing-protection",
  "ai-media-detector",
];

// Requests the tracker ruleset should block (domains or subdomains from trackers.dnr.json) and
// controls it must leave alone.
const TRACKER_URLS = [
  "https://www.google-analytics.com/collect?v=1&bm=1",
  "https://www.googletagmanager.com/gtag/js?id=G-BMTEST",
  "https://connect.facebook.net/en_US/fbevents.js",
  "https://stats.wp.com/g.gif?bm=1",
  "https://px.ads.linkedin.com/collect?bm=1",
];
const CONTROL_URLS = ["https://example.org/control.gif", "https://cdn.jsdelivr.net/control.js"];
const TEST_ORIGIN = "https://bm-validation.test";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const step = (message) => console.error(`[${new Date().toISOString()}] ${message}`);

function parseArgs(argv) {
  const args = {
    extension: "apps/browser/build",
    out: null,
    chromium: process.env.CHROMIUM_PATH,
    server: null,
    // Base64 SHA-256 of the server certificate's SPKI, for a self-signed test server. Chromium
    // then trusts that one key, rather than ignoring certificate errors in general.
    "trust-spki": null,
    // A fresh synthetic account per run, so re-runs against the same server never collide.
    email: `bm-validation-${Date.now()}@example.com`,
    password: "correct-horse-battery-staple-2026",
  };
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    if (!(key in args)) {
      throw new Error(`Unknown argument ${argv[i]}`);
    }
    args[key] = argv[i + 1];
  }
  args.extension = path.resolve(args.extension);
  args.out = path.resolve(args.out ?? fs.mkdtempSync(path.join(os.tmpdir(), "bm-validation-")));
  return args;
}

function check(results, id, title, status, evidence) {
  results.checks.push({ id, title, status, evidence });
}

/** English UI strings from the build itself, so checks match what the extension renders. */
function loadMessages(extensionDir) {
  const messages = JSON.parse(
    fs.readFileSync(path.join(extensionDir, "_locales", "en", "messages.json"), "utf8"),
  );
  return (key) => {
    if (!messages[key]) {
      throw new Error(`No English message for ${key}`);
    }
    return messages[key].message;
  };
}

/** Runs one check; a thrown error becomes a FAIL with a screenshot instead of aborting the run. */
async function attempt(results, currentPage, args, id, title, fn) {
  try {
    const { status, evidence } = await fn();
    check(results, id, title, status, evidence);
    return status;
  } catch (error) {
    const screenshot = `${id}-failure.png`;
    await currentPage()
      .screenshot({ path: path.join(args.out, screenshot) })
      .catch(() => undefined);
    check(results, id, title, "FAIL", { error: String(error).slice(0, 600), screenshot });
    return "FAIL";
  }
}

/** Evaluates in the extension service worker, retrying if MV3 restarted it mid-run. */
async function inBackground(context, fn) {
  for (let attempt = 1; ; attempt++) {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
    try {
      return await worker.evaluate(fn);
    } catch (error) {
      if (attempt >= 3 || !/closed/i.test(String(error))) {
        throw error;
      }
      await sleep(1000);
    }
  }
}

function manifestChecks(results, extensionDir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(extensionDir, "manifest.json"), "utf8"));
  results.manifest = {
    version: manifest.version,
    manifest_version: manifest.manifest_version,
    permissions: manifest.permissions,
    optional_permissions: manifest.optional_permissions,
    declarative_net_request: manifest.declarative_net_request,
  };
  const required = manifest.permissions ?? [];
  const optional = manifest.optional_permissions ?? [];
  check(
    results,
    "MAN-01",
    "nativeMessaging is optional, not requested at install",
    !required.includes("nativeMessaging") && optional.includes("nativeMessaging") ? "PASS" : "FAIL",
    { permissions: required, optional_permissions: optional },
  );
  const rulesets = manifest.declarative_net_request?.rule_resources ?? [];
  const trackers = rulesets.find((r) => r.id === "black-mask-trackers");
  check(
    results,
    "MAN-02",
    "Tracker ruleset is packaged, disabled until the background enables it",
    trackers && trackers.enabled === false ? "PASS" : "FAIL",
    { rule_resources: rulesets },
  );
}

async function browserChecks(context, args, results, mark, msg) {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const extensionId = new URL(worker.url()).host;
  const launchedAt = Date.now();
  results.extensionId = extensionId;
  results.serviceWorkerConsole = [];
  const watch = (w) =>
    w.on("console", (msg) => results.serviceWorkerConsole.push(`[${msg.type()}] ${msg.text()}`));
  context.serviceWorkers().forEach(watch);
  context.on("serviceworker", watch);

  step(`extension ${extensionId} loaded; watching for tabs opened on install`);
  // Read tab URLs from the extension itself: with DNS sinkholed, a welcome tab lands on an error
  // page before Playwright attaches to it, but chrome.tabs still reports the URL it tried to open.
  let openedTabs = [];
  for (let i = 0; i < 20 && openedTabs.length === 0; i++) {
    await sleep(1000);
    openedTabs = await inBackground(context, async () =>
      (await chrome.tabs.query({}))
        .map((tab) => tab.pendingUrl || tab.url)
        .filter((url) => url && !/^(about|chrome|chrome-error):/.test(url)),
    );
  }
  const installTabs = openedTabs.filter((url) => !url.startsWith("chrome-extension:"));
  results.installTabs = installTabs;
  results.extensionTabsOnInstall = openedTabs.filter((url) => url.startsWith("chrome-extension:"));
  check(
    results,
    "ENV-02",
    "No third-party tab opened on install",
    installTabs.length === 0 ? "PASS" : "FAIL",
    { tabsOpenedOnInstall: installTabs },
  );

  const welcomeUrl = `chrome-extension://${extensionId}/popup/index.html#/welcome`;
  const welcomeOpened = results.extensionTabsOnInstall.includes(welcomeUrl);
  let welcomeText = "";
  if (welcomeOpened) {
    const welcome = await context.newPage();
    await welcome.setViewportSize({ width: 900, height: 1000 });
    await welcome.goto(welcomeUrl);
    await sleep(3000);
    welcomeText = await welcome.evaluate(() => document.body.innerText);
    await welcome.screenshot({ path: path.join(args.out, "welcome-light.png"), fullPage: true });
    await welcome.emulateMedia({ colorScheme: "dark" });
    await welcome.reload();
    await sleep(3000);
    await welcome.screenshot({ path: path.join(args.out, "welcome-dark.png"), fullPage: true });
    await welcome.close();
  }
  check(
    results,
    "WEL-01",
    "First install opens the bundled welcome page",
    welcomeOpened && welcomeText.includes(msg("blackMaskWelcomeTitle")) ? "PASS" : "FAIL",
    {
      expected: welcomeUrl,
      extensionTabsOnInstall: results.extensionTabsOnInstall,
      text: welcomeText.slice(0, 300),
      screenshots: welcomeOpened ? ["welcome-light.png", "welcome-dark.png"] : [],
    },
  );

  // Give the background time to bootstrap, fail its config fetch and settle on flag defaults.
  await sleep(Math.max(0, 15000 - (Date.now() - launchedAt)));
  step("reading background state");
  const background = await inBackground(context, async () => {
    const local = await chrome.storage.local.get(null);
    const environment = Object.fromEntries(
      Object.entries(local).filter(([key]) => /environment|region/i.test(key)),
    );
    return {
      enabledRulesets: await chrome.declarativeNetRequest.getEnabledRulesets(),
      permissions: await chrome.permissions.getAll(),
      contextualIdentities: typeof chrome.contextualIdentities,
      environment,
      localStorageKeys: Object.keys(local).sort(),
    };
  });
  results.background = background;
  check(
    results,
    "TRK-01",
    "Tracker ruleset enabled at runtime on a fresh, logged-out install",
    background.enabledRulesets.includes("black-mask-trackers") ? "PASS" : "FAIL",
    { enabledRulesets: background.enabledRulesets },
  );
  check(
    results,
    "MAN-03",
    "nativeMessaging not granted at runtime",
    background.permissions.permissions.includes("nativeMessaging") ? "FAIL" : "PASS",
    { granted: background.permissions.permissions },
  );
  check(
    results,
    "CTR-01",
    "Chromium has no contextualIdentities API (containers page must fall back to its notice)",
    background.contextualIdentities === "undefined" ? "PASS" : "FAIL",
    { typeofContextualIdentities: background.contextualIdentities },
  );

  // Tracker blocking and counting, on a page served by Playwright so no network is involved.
  mark("tracker-test");
  step("loading the tracker test page");
  const tag = (url) =>
    url.endsWith(".js") || url.includes(".js?")
      ? `<script src="${url}"></script>`
      : `<img src="${url}">`;
  const html = [
    "<!doctype html><title>Black Mask tracker check</title>",
    ...TRACKER_URLS.map(tag),
    ...CONTROL_URLS.map(tag),
  ].join("\n");
  await context.route(`${TEST_ORIGIN}/**`, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: html }),
  );
  const page = await context.newPage();
  const outcomes = {};
  page.on("requestfailed", (r) => (outcomes[r.url()] = r.failure()?.errorText ?? "failed"));
  page.on("requestfinished", (r) => (outcomes[r.url()] = outcomes[r.url()] ?? "finished"));
  await page.goto(`${TEST_ORIGIN}/`, { waitUntil: "load" });
  await sleep(3000);
  const pick = (urls) => Object.fromEntries(urls.map((u) => [u, outcomes[u] ?? "not observed"]));
  const allBlocked = TRACKER_URLS.every((u) => outcomes[u] === "net::ERR_BLOCKED_BY_CLIENT");
  const controlsUnblocked = CONTROL_URLS.every(
    (u) => outcomes[u] && outcomes[u] !== "net::ERR_BLOCKED_BY_CLIENT",
  );
  check(
    results,
    "TRK-02",
    "Tracker requests are blocked by the extension; non-tracker requests are not",
    allBlocked && controlsUnblocked ? "PASS" : "FAIL",
    { trackers: pick(TRACKER_URLS), controls: pick(CONTROL_URLS) },
  );
  const counts = await inBackground(context, () =>
    chrome.storage.session.get("blackMaskTrackerCounts"),
  );
  const tabCounts = counts.blackMaskTrackerCounts ?? {};
  const maxCount = Math.max(0, ...Object.values(tabCounts).map(Number));
  check(
    results,
    "TRK-03",
    "Per-tab tracker count increments for the blocked requests",
    maxCount >= TRACKER_URLS.length ? "PASS" : "FAIL",
    { expectedAtLeast: TRACKER_URLS.length, sessionCounts: tabCounts },
  );
  await page.close();

  // Logged-out popup: the intro carousel, then the login form with its server picker.
  mark("popup");
  step("opening the popup and the login form");
  const popup = await context.newPage();
  const popupUrl = `chrome-extension://${extensionId}/popup/index.html`;
  await popup.goto(popupUrl);
  await sleep(4000);
  results.landingRoute = new URL(popup.url()).hash;
  results.landingText = (await popup.evaluate(() => document.body.innerText)).slice(0, 400);
  await popup.screenshot({ path: path.join(args.out, "landing-light.png") });
  await popup
    .getByRole("button", { name: /log in/i })
    .first()
    .click();
  await sleep(3000);
  results.loginRoute = new URL(popup.url()).hash;
  const loginText = await popup.evaluate(() => document.body.innerText);
  results.loginText = loginText.slice(0, 600);
  await popup.screenshot({ path: path.join(args.out, "login-light.png") });
  await popup.emulateMedia({ colorScheme: "dark" });
  await popup.reload();
  await sleep(4000);
  await popup.screenshot({ path: path.join(args.out, "login-dark.png") });
  await popup.emulateMedia({ colorScheme: "light" });
  const mentionsDefault = /blackmask\.app/i.test(loginText);
  check(
    results,
    "ENV-01",
    "Login screen defaults to the Black Mask server with no manual entry",
    mentionsDefault ? "PASS" : "FAIL",
    { loginScreenMentionsBlackmaskApp: mentionsDefault, stored: background.environment },
  );

  step("probing logged-out privacy routes");
  const routeResults = {};
  for (const route of PRIVACY_ROUTES) {
    await popup.goto(`${popupUrl}#/${route}`);
    await sleep(2500);
    routeResults[route] = new URL(popup.url()).hash;
  }
  const allRedirected = Object.entries(routeResults).every(
    ([route, hash]) => hash !== `#/${route}`,
  );
  check(
    results,
    "AUTH-01",
    "Privacy routes require login (logged-out navigation is redirected)",
    allRedirected ? "PASS" : "FAIL",
    { finalHashByRoute: routeResults },
  );
  check(results, "THEME-01", "Login screen renders in light and dark themes", "MANUAL", {
    screenshots: ["landing-light.png", "login-light.png", "login-dark.png"],
  });

  return { extensionId, installTabs };
}

const ITEM_NAME = "Black Mask validation login";
const PERSONA_NAME = "Validation persona";
const PERSONA_LAYER_FIELD = "Black Mask Layer";

/**
 * Logged-in checks against a server you control (--server). Creates a synthetic account through
 * the UI, then walks the checklist sections that need an unlocked vault.
 */
async function loggedInChecks(context, args, results, extensionId, msg) {
  // The popup closes its open views when the vault locks or logs out, which closes this tab, so
  // every helper reopens it when needed.
  let page = await context.newPage();
  const popupUrl = `chrome-extension://${extensionId}/popup/index.html`;
  const reopenIfClosed = async () => {
    if (page.isClosed()) {
      page = await context.newPage();
    }
  };
  const open = async (route, settle = 3000) => {
    await reopenIfClosed();
    // Locking and logging out reload the extension (chrome.runtime.reload) to clear secrets from
    // memory. Until it is back its pages fail with ERR_BLOCKED_BY_CLIENT, and a tab from before
    // the reload stays unusable, so each retry uses a fresh tab.
    for (let attempt = 1; ; attempt++) {
      try {
        await page.goto(`${popupUrl}#/${route}`);
        break;
      } catch (error) {
        if (attempt >= 15 || !String(error).includes("ERR_BLOCKED_BY_CLIENT")) {
          throw error;
        }
        await sleep(2000);
        await page.close().catch(() => undefined);
        page = await context.newPage();
      }
    }
    await sleep(settle);
  };
  /** Clicks something that may close the tab or navigate away, and waits for either. */
  const clickAndSettle = async (locator, settledUrl) => {
    const closed = page.waitForEvent("close").catch(() => undefined);
    const navigated = page.waitForURL(settledUrl, { timeout: 20000 }).catch(() => undefined);
    await locator.click();
    await Promise.race([closed, navigated]);
    await sleep(1500);
    await reopenIfClosed();
  };
  const text = () => page.evaluate(() => document.body.innerText);
  /** Page text plus form-control values, which innerText leaves out (the item view uses them). */
  const textWithValues = () =>
    page.evaluate(() =>
      [
        document.body.innerText,
        ...Array.from(document.querySelectorAll("input, textarea"), (control) => control.value),
      ].join("\n"),
    );
  /** Resolves true when the extension's service worker starts again (after a reload). */
  const waitForRestart = () =>
    context.waitForEvent("serviceworker", { timeout: 45000 }).then(
      () => true,
      () => false,
    );
  const route = () => new URL(page.url()).hash;
  const run = (id, title, fn) => attempt(results, () => page, args, id, title, fn);
  const chooseLayer = async (label) => {
    await page.locator("bit-select[formcontrolname='layer']").click();
    await page.getByRole("option", { name: label, exact: true }).click();
  };
  /** On the login screen: open the server picker and save --server as a self-hosted server. */
  const pickServer = async (target) => {
    await target.getByRole("button", { name: /blackmask\.app/i }).click();
    await target.getByRole("menuitem", { name: /self-hosted/i }).click();
    await target.locator("#self_hosted_env_settings_form_input_base_url").fill(args.server);
    await target.getByRole("button", { name: msg("save"), exact: true }).click();
    await sleep(2000);
  };
  /** On the login screen: email, then master password, until the vault opens. */
  const enterCredentials = async (target) => {
    await target.locator("#email").fill(args.email);
    await target.getByRole("button", { name: msg("continue"), exact: true }).click();
    await target.locator("#masterPassword").fill(args.password);
    await target.getByRole("button", { name: msg("loginWithMasterPassword") }).click();
    await target.waitForURL((url) => url.hash.startsWith("#/tabs/"), { timeout: 90000 });
  };
  const logIn = async () => {
    await open("login");
    await enterCredentials(page);
  };

  await run("SRV-01", "A self-hosted server can be chosen on the login screen", async () => {
    await open("login");
    await pickServer(page);
    // The self-hosted form refuses plain-HTTP URLs ("URLs must use HTTPS"), so a test server
    // needs TLS; a refusal leaves the dialog open and nothing stored.
    const stored = await inBackground(context, async () =>
      JSON.stringify(
        Object.entries(await chrome.storage.local.get(null)).filter(([key]) =>
          /environment|region/i.test(key),
        ),
      ),
    );
    const saved = stored.includes(args.server.replace(/\/$/, ""));
    const pageText = (await text()).replace(/\s+/g, " ");
    return {
      status: saved ? "PASS" : "FAIL",
      evidence: { server: args.server, saved, accessing: pageText.match(/Accessing:\s*\S+/)?.[0] },
    };
  });

  await run("REG-01", "A new account can be created on the server", async () => {
    await open("signup");
    await page.locator("#register-start_form_input_email").fill(args.email);
    await page.locator("#register-start_form_input_name").fill("Black Mask validation");
    await page.getByRole("button", { name: msg("continue"), exact: true }).click();
    await page.waitForURL(/finish-signup/, { timeout: 20000 });
    await page.locator("#input-password-form_new-password").fill(args.password);
    await page.locator("#input-password-form_new-password-confirm").fill(args.password);
    // The breach check would query api.pwnedpasswords.com, which this run blocks.
    const breachCheck = page.locator("#input-password-form_check-for-breaches");
    if ((await breachCheck.count()) > 0 && (await breachCheck.isChecked())) {
      await breachCheck.uncheck();
    }
    await page.getByRole("button", { name: msg("createAccount"), exact: true }).click();
    await page.waitForURL((url) => !url.hash.includes("finish-signup"), { timeout: 90000 });
    await sleep(3000);
    return { status: "PASS", evidence: { email: args.email, landedOn: route() } };
  });

  const loggedIn = await run(
    "LOG-01",
    "Logging in with the master password reaches the vault",
    async () => {
      if (!route().startsWith("#/tabs/")) {
        await logIn();
      }
      return { status: "PASS", evidence: { route: route() } };
    },
  );

  const checks = [
    [
      "VLT-01",
      "A login item can be created and appears in the vault",
      async () => {
        await open("add-cipher?type=1");
        await page.getByLabel(/^item name/i).fill(ITEM_NAME);
        await page.getByLabel(/^username/i).fill("validator");
        await page
          .getByLabel(/^password/i)
          .first()
          .fill("Validation-Password-2026");
        await page.getByRole("button", { name: msg("save"), exact: true }).click();
        await sleep(3000);
        await open("tabs/vault");
        const listed = (await text()).includes(ITEM_NAME);
        return { status: listed ? "PASS" : "FAIL", evidence: { listed } };
      },
    ],
    [
      "DASH-01",
      "Privacy dashboard shows a score, with no fingerprint factor before the test runs",
      async () => {
        await open("privacy-dashboard", 4000);
        const t = await text();
        const hasScore = t.includes(msg("blackMaskPrivacyScore"));
        const fingerprintFactor = t.includes(msg("blackMaskScoreFingerprint"));
        return {
          status: hasScore && !fingerprintFactor ? "PASS" : "FAIL",
          evidence: { hasScore, fingerprintFactor, text: t.slice(0, 600) },
        };
      },
    ],
    [
      "FP-01",
      "Fingerprint probes return values, and the dashboard then gains a fingerprint factor",
      async () => {
        await open("fingerprint", 2000);
        await page.waitForFunction(
          (running) => !document.body.innerText.includes(running),
          msg("blackMaskFpRunning"),
          { timeout: 30000 },
        );
        const t = await text();
        const total = /≈\s*[\d.]+\s*bits of identifying information/.test(t);
        await open("privacy-dashboard", 4000);
        const factorAfter = (await text()).includes(msg("blackMaskScoreFingerprint"));
        return {
          status: total && factorAfter ? "PASS" : "FAIL",
          evidence: { totalBitsShown: total, factorAfter, text: t.slice(0, 900) },
        };
      },
    ],
    [
      "TRK-04",
      "Trackers page shows tracker protection",
      async () => {
        await open("trackers");
        const t = await text();
        return {
          status: t.includes(msg("blackMaskTrackerProtection")) ? "PASS" : "FAIL",
          evidence: { text: t.slice(0, 400) },
        };
      },
    ],
    [
      "PER-01",
      "A persona can be created and is grouped under its layer",
      async () => {
        await open("personas");
        await page.locator("#personas_button_new").click();
        await page.waitForURL(/create-persona/, { timeout: 15000 });
        await sleep(1000);
        await chooseLayer(msg("blackMaskLayerBusiness"));
        await page.locator("#create-persona_input_name").fill(PERSONA_NAME);
        await page.locator("#create-persona_input_email").fill("persona@example.com");
        await page.locator("#create-persona_input_notes").fill("validation notes");
        await page.locator("#create-persona_button_save").click();
        await page.waitForURL(/#\/personas/, { timeout: 20000 });
        // The list fills in once the new item has been saved and decrypted.
        const grouped = await page
          .waitForFunction(
            ([name, layer]) =>
              document.body.innerText.includes(name) && document.body.innerText.includes(layer),
            [PERSONA_NAME, msg("blackMaskLayerBusiness")],
            { timeout: 20000 },
          )
          .then(
            () => true,
            () => false,
          );
        const t = await text();
        return { status: grouped ? "PASS" : "FAIL", evidence: { grouped, text: t.slice(0, 400) } };
      },
    ],
    [
      "PER-02",
      "The persona editor changes the layer without duplicating its field, and clears email and notes",
      async () => {
        await open("personas");
        await page.getByText(PERSONA_NAME, { exact: true }).click();
        await page.waitForURL(/edit-persona\?cipherId=/, { timeout: 15000 });
        const cipherId = new URLSearchParams(route().split("?")[1]).get("cipherId");
        await sleep(1000);
        await chooseLayer(msg("blackMaskLayerCreator"));
        await page.locator("#edit-persona_input_email").fill("");
        await page.locator("#edit-persona_input_notes").fill("");
        await page.locator("#edit-persona_button_save").click();
        await page.waitForURL(/#\/personas/, { timeout: 20000 });
        await page
          .waitForFunction(
            (layer) => document.body.innerText.includes(layer),
            msg("blackMaskLayerCreator"),
            { timeout: 20000 },
          )
          .catch(() => undefined);
        // Check the stored item in the generic vault view: one layer field, holding the new value.
        await open(`view-cipher?cipherId=${cipherId}`, 4000);
        const view = await textWithValues();
        const layerFields = view.split(PERSONA_LAYER_FIELD).length - 1;
        const moved = view.includes("Creator") && !view.includes("Business");
        const cleared = !view.includes("persona@example.com") && !view.includes("validation notes");
        return {
          status: moved && layerFields === 1 && cleared ? "PASS" : "FAIL",
          evidence: { openedEditor: true, moved, layerFields, cleared },
        };
      },
    ],
    [
      "EXP-01",
      "Without a breach-lookup key on the server, data exposure says the email wasn't checked",
      async () => {
        await open("data-exposure");
        await page.locator("#data-exposure_button_check").click();
        await sleep(6000);
        const t = await text();
        const notConfigured = t.includes(msg("blackMaskExposureNotConfigured"));
        // Vaultwarden answers with a placeholder "breach"; it must not be reported as one.
        const reportsBreach = /known breach/i.test(t);
        return {
          status: notConfigured && !reportsBreach ? "PASS" : "FAIL",
          evidence: { notConfigured, reportsBreach, text: t.slice(0, 400) },
        };
      },
    ],
    [
      "CTR-02",
      "Containers page shows the requires-Firefox notice on Chromium",
      async () => {
        await open("persona-containers");
        const notice = (await text()).includes(msg("blackMaskContainersUnsupported"));
        return { status: notice ? "PASS" : "FAIL", evidence: { notice } };
      },
    ],
    [
      "PH-01",
      "Phishing protection is active for a logged-in account",
      async () => {
        await open("phishing-protection", 5000);
        const t = await text();
        const active =
          t.includes(msg("blackMaskPhishingActive")) &&
          !t.includes(msg("blackMaskPhishingUnavailable"));
        return { status: active ? "PASS" : "FAIL", evidence: { active, text: t.slice(0, 400) } };
      },
    ],
    [
      "AI-01",
      "AI media detector page renders (model download not exercised: network is blocked)",
      async () => {
        await open("ai-media-detector");
        const renders = (await text()).includes(msg("blackMaskAiMediaDescription"));
        return { status: renders ? "PASS" : "FAIL", evidence: { renders } };
      },
    ],
    [
      "ACC-01",
      "Account security offers Connect desktop app",
      async () => {
        await open("account-security");
        const button = await page.locator("#account-security_button_connect-desktop").isVisible();
        return { status: button ? "PASS" : "FAIL", evidence: { connectDesktopVisible: button } };
      },
    ],
    [
      "SYNC-01",
      "A second, fresh browser profile logs in and receives the item from the server",
      async () => {
        // A separate browser and profile, so this proves the round trip through the server
        // without logging out (logout reloads the extension, like lock below).
        const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "bm-second-profile-"));
        const second = await chromium.launchPersistentContext(profileDir, {
          executablePath: args.chromium,
          headless: true,
          viewport: { width: 380, height: 600 },
          ignoreDefaultArgs: ["--disable-extensions"],
          args: [
            ...chromiumArgs(args),
            `--disable-extensions-except=${args.extension}`,
            `--load-extension=${args.extension}`,
          ],
        });
        try {
          if (second.serviceWorkers().length === 0) {
            await second.waitForEvent("serviceworker");
          }
          await sleep(5000);
          const other = await second.newPage();
          await other.goto(`${popupUrl}#/intro-carousel`);
          await sleep(3000);
          await other
            .getByRole("button", { name: /log in/i })
            .first()
            .click();
          await sleep(2000);
          await pickServer(other);
          await enterCredentials(other);
          await other.goto(`${popupUrl}#/tabs/vault`);
          await sleep(5000);
          const received = (await other.evaluate(() => document.body.innerText)).includes(
            ITEM_NAME,
          );
          return { status: received ? "PASS" : "FAIL", evidence: { received } };
        } finally {
          await second.close();
          fs.rmSync(profileDir, { recursive: true, force: true });
        }
      },
    ],
    [
      "LOCK-01",
      "Lock now locks the vault and the master password unlocks it",
      async () => {
        await open("account-switcher");
        // Locking reloads the extension (chrome.runtime.reload) once every popup view has closed.
        const restarted = waitForRestart();
        await clickAndSettle(page.getByRole("button", { name: msg("lockNow") }), (url) =>
          url.hash.startsWith("#/lock"),
        );
        if (!(await restarted)) {
          // Seen under headless automation with both --load-extension and CDP-loaded unpacked
          // extensions: after the lock-triggered reload the extension never returns, although a
          // direct chrome.runtime.reload() recovers in about two seconds. Report it as blocked,
          // not as a product failure, and check lock and unlock by hand in Chrome.
          const lockLogged = results.serviceWorkerConsole.some((line) =>
            line.includes("[LockService] Locked user"),
          );
          return {
            status: "BLOCKED",
            evidence: {
              lockLogged,
              reason:
                "the extension did not come back within 45s of its lock-triggered reload; verify lock and unlock manually",
            },
          };
        }
        await open("lock", 4000);
        const locked = route().startsWith("#/lock");
        await page
          .getByLabel(/master password/i)
          .first()
          .fill(args.password);
        await page.getByRole("button", { name: msg("unlock"), exact: true }).click();
        await page.waitForURL((url) => url.hash.startsWith("#/tabs/"), { timeout: 60000 });
        return { status: locked ? "PASS" : "FAIL", evidence: { locked, unlockedTo: route() } };
      },
    ],
  ];

  for (const [id, title, fn] of checks) {
    if (loggedIn !== "PASS") {
      check(results, id, title, "BLOCKED", { reason: "login failed (LOG-01)" });
      continue;
    }
    step(`logged in: ${id}`);
    await run(id, title, fn);
  }
  await page.close();
}

function summarizeNetLog(netLogPath, phases) {
  const log = JSON.parse(fs.readFileSync(netLogPath, "utf8"));
  const typeNames = Object.fromEntries(
    Object.entries(log.constants.logEventTypes).map(([name, id]) => [id, name]),
  );
  const tickOffset = Number(log.constants.timeTickOffset);
  const phaseAt = (wallMs) => {
    let current = "before-launch";
    for (const phase of phases) {
      if (wallMs >= phase.at) {
        current = phase.name;
      }
    }
    return current;
  };
  const hosts = new Map();
  for (const event of log.events) {
    if (typeNames[event.type] !== "URL_REQUEST_START_JOB" || !event.params?.url) {
      continue;
    }
    let url;
    try {
      url = new URL(event.params.url);
    } catch {
      continue;
    }
    if (!url.protocol.startsWith("http")) {
      continue;
    }
    const phase = phaseAt(Number(event.time) + tickOffset);
    const entry = hosts.get(url.host) ?? {
      host: url.host,
      count: 0,
      phases: new Set(),
      sample: [],
    };
    entry.count += 1;
    entry.phases.add(phase);
    if (entry.sample.length < 3) {
      entry.sample.push(`${url.origin}${url.pathname}`);
    }
    hosts.set(url.host, entry);
  }
  return [...hosts.values()]
    .map((h) => ({ ...h, phases: [...h.phases] }))
    .sort((a, b) => a.host.localeCompare(b.host));
}

/** Every external hostname resolves to NOTFOUND, except localhost and the --server host. */
function chromiumArgs(args) {
  const excluded = ["localhost"];
  if (args.server) {
    excluded.push(new URL(args.server).hostname);
  }
  const rules = ["MAP * ~NOTFOUND", ...new Set(excluded)].join(", EXCLUDE ");
  const flags = [`--host-resolver-rules=${rules}`, `--user-agent=${CHROME_USER_AGENT}`];
  if (args["trust-spki"]) {
    flags.push(`--ignore-certificate-errors-spki-list=${args["trust-spki"]}`);
  }
  return flags;
}

/** Hosts Chromium contacts on its own, so they can be told apart from the extension's. */
async function baselineHosts(args) {
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "bm-baseline-"));
  const netLogPath = path.join(args.out, "netlog-baseline.json");
  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: args.chromium,
    headless: true,
    args: [...chromiumArgs(args), `--log-net-log=${netLogPath}`],
  });
  try {
    await sleep(20000);
  } finally {
    await context.close();
    fs.rmSync(profileDir, { recursive: true, force: true });
  }
  return new Set(summarizeNetLog(netLogPath, []).map((h) => h.host));
}

async function main() {
  const args = parseArgs(process.argv);
  fs.mkdirSync(args.out, { recursive: true });
  step("baseline: running Chromium without the extension for 20s");
  const baseline = await baselineHosts(args);
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "bm-profile-"));
  const netLogPath = path.join(args.out, "netlog.json");
  const phases = [];
  const mark = (name) => phases.push({ name, at: Date.now() });

  const results = {
    date: new Date().toISOString(),
    extension: args.extension,
    chromium: args.chromium ?? "playwright default",
    playwright: require("playwright/package.json").version,
    userAgentOverride: CHROME_USER_AGENT,
    checks: [],
  };
  manifestChecks(results, args.extension);

  mark("install-and-startup");
  step("launching Chromium with the extension");
  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: args.chromium,
    headless: true,
    viewport: { width: 380, height: 600 },
    deviceScaleFactor: 2,
    // Playwright's default --disable-extensions keeps a reloaded extension (lock, logout) unloaded.
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      ...chromiumArgs(args),
      `--disable-extensions-except=${args.extension}`,
      `--load-extension=${args.extension}`,
      `--log-net-log=${netLogPath}`,
    ],
  });
  results.browserVersion = context.browser()?.version() ?? "unknown";

  const msg = loadMessages(args.extension);
  let run;
  try {
    run = await browserChecks(context, args, results, mark, msg);
    if (args.server) {
      mark("logged-in");
      step(`logged-in checks against ${args.server} as ${args.email}`);
      await loggedInChecks(context, args, results, run.extensionId, msg);
    }
  } finally {
    mark("shutdown");
    step("closing Chromium and parsing the NetLog");
    await context.close();
    fs.rmSync(profileDir, { recursive: true, force: true });
  }

  results.hostsContacted = summarizeNetLog(netLogPath, phases).map((h) => ({
    ...h,
    alsoWithoutExtension: baseline.has(h.host),
  }));
  const extensionHosts = results.hostsContacted
    .filter((h) => !h.alsoWithoutExtension)
    .map((h) => `${h.host} (${h.phases.join(", ")})`);
  check(results, "ENV-04", "Hosts contacted only when the extension is loaded", "INFO", {
    extensionHosts,
    browserOwnHosts: [...baseline].sort(),
  });
  const tabHosts = new Set(run.installTabs.map((t) => new URL(t).host));
  const bitwardenHosts = results.hostsContacted
    .map((h) => h.host)
    .filter((host) => /(^|\.)bitwarden\.(com|net)$/.test(host) && !tabHosts.has(host));
  check(
    results,
    "ENV-03",
    "No bitwarden.com requests other than the documented phishing-feed exception",
    bitwardenHosts.every((host) => host === "assets.bitwarden.com") ? "PASS" : "FAIL",
    { bitwardenHostsExcludingInstallTabs: bitwardenHosts },
  );

  fs.writeFileSync(path.join(args.out, "results.json"), JSON.stringify(results, null, 2));
  console.log(`Chromium ${results.browserVersion}, Playwright ${results.playwright}`);
  console.log(
    `Extension ${results.manifest.version} (${run.extensionId}) from ${args.extension}\n`,
  );
  for (const c of results.checks) {
    console.log(`${c.status.padEnd(7)} ${c.id.padEnd(9)} ${c.title}`);
  }
  console.log(`\nDetails: ${path.join(args.out, "results.json")}`);
  process.exitCode = results.checks.some((c) => c.status === "FAIL") ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 2;
});
