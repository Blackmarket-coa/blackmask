#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Black Mask — automated Chromium checks for the parts of docs/black-mask/browser-validation.md
 * that need no backend account.
 *
 * Loads a built extension (default: apps/browser/build) into a fresh Chromium profile with
 * Playwright, the way a first install would, and records:
 *   - the built manifest's permissions and declarativeNetRequest ruleset
 *   - the tabs opened on install, and the default server shown at login
 *   - whether the tracker ruleset is enabled at runtime, whether tracker requests are actually
 *     blocked (net::ERR_BLOCKED_BY_CLIENT), and whether the per-tab count increments
 *   - whether the logged-out privacy routes redirect to login
 *   - every host the browser tried to contact (from a Chromium NetLog)
 *   - light and dark screenshots of the login screen
 *
 * The run is hermetic: every external hostname resolves to NOTFOUND, so nothing leaves the
 * machine. Blocking still shows up as ERR_BLOCKED_BY_CLIENT because declarativeNetRequest acts
 * before DNS, and the NetLog still records every attempted request.
 *
 * Usage:
 *   node scripts/validate-black-mask-chromium.js [--extension <dir>] [--out <dir>] [--chromium <path>]
 *
 * Build the extension first (e.g. `npm run build:prod:chrome` in apps/browser). --chromium (or
 * CHROMIUM_PATH) points at a full Chromium binary when Playwright's bundled browser does not match
 * the installed Playwright version; headless-shell builds cannot load extensions.
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
  const args = { extension: "apps/browser/build", out: null, chromium: process.env.CHROMIUM_PATH };
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

async function browserChecks(context, args, results, mark) {
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
  let installTabs = [];
  for (let i = 0; i < 20 && installTabs.length === 0; i++) {
    await sleep(1000);
    installTabs = await inBackground(context, async () =>
      (await chrome.tabs.query({}))
        .map((tab) => tab.pendingUrl || tab.url)
        .filter((url) => url && !/^(about|chrome|chrome-extension|chrome-error):/.test(url)),
    );
  }
  results.installTabs = installTabs;
  check(
    results,
    "ENV-02",
    "No third-party tab opened on install",
    installTabs.length === 0 ? "PASS" : "FAIL",
    { tabsOpenedOnInstall: installTabs },
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

const CHROMIUM_ARGS = [
  "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost",
  `--user-agent=${CHROME_USER_AGENT}`,
];

/** Hosts Chromium contacts on its own, so they can be told apart from the extension's. */
async function baselineHosts(args) {
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "bm-baseline-"));
  const netLogPath = path.join(args.out, "netlog-baseline.json");
  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: args.chromium,
    headless: true,
    args: [...CHROMIUM_ARGS, `--log-net-log=${netLogPath}`],
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
    args: [
      ...CHROMIUM_ARGS,
      `--disable-extensions-except=${args.extension}`,
      `--load-extension=${args.extension}`,
      `--log-net-log=${netLogPath}`,
    ],
  });
  results.browserVersion = context.browser()?.version() ?? "unknown";

  let run;
  try {
    run = await browserChecks(context, args, results, mark);
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
