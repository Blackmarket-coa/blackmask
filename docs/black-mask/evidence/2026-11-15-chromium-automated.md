# Evidence — automated Chromium run, 2026-11-15

First automated pass over the parts of [`browser-validation.md`](../browser-validation.md) that need
no backend account, plus the unit-test baseline for the [feature audit register](../feature-audit-register.md).
This is evidence for a **logged-out, fresh-install** state only. Everything behind login is listed under
[Not covered](#not-covered) and stays unverified.

## Environment

| Item    | Value                                                                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source  | branch `claude/upbeat-dijkstra-ha54fx` at `6117c0c8`; extension sources identical to `main` at `68d184bd` (the branch only changes docs and desktop Rust) |
| Build   | `npm run build:prod:chrome` in `apps/browser` (`NODE_ENV=production`, so every dev flag is off); exit 0 in 2m51s; manifest version `2026.6.0`, MV3        |
| Browser | Chromium 153.0.8010.12, headless, driven by Playwright 1.59.1 (`launchPersistentContext` with `--load-extension`, fresh profile per run)                  |
| Network | Hermetic: `--host-resolver-rules=MAP * ~NOTFOUND`. Nothing left the machine; attempted requests were captured with a Chromium NetLog                      |
| Backend | None — see [Not covered](#not-covered)                                                                                                                    |
| Node    | 22.23.4                                                                                                                                                   |

Reproduce with:

```bash
cd apps/browser && npm run build:prod:chrome && cd ../..
node scripts/validate-black-mask-chromium.js --extension apps/browser/build --out /tmp/bm-run \
  --chromium /path/to/full/chromium   # only if Playwright's bundled browser doesn't match
```

**User-agent override (test-environment artifact, not a product bug).** The inherited device detection
recognizes Chrome only by `" Chrome/"` in the user agent. Headless Chromium reports `HeadlessChrome/`,
which that detection classifies as **Safari**: with the default headless UA the background logged
`Phishing detection is unavailable on Safari` and no welcome tab opened. The harness therefore presents
a regular Chrome UA. Real Chrome is unaffected; anyone automating this extension headlessly needs the
same override or their results describe Safari code paths.

## Results

| Check    | Result      | Evidence                                                                                                                                                                                                                                                                                    |
| -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MAN-01   | Pass        | Built manifest: `nativeMessaging` and `privacy` are in `optional_permissions`, absent from `permissions`                                                                                                                                                                                    |
| MAN-02   | Pass        | Ruleset `black-mask-trackers` (`privacy/trackers.dnr.json`) is packaged with `enabled: false`                                                                                                                                                                                               |
| MAN-03   | Pass        | `chrome.permissions.getAll()` at runtime does not include `nativeMessaging`                                                                                                                                                                                                                 |
| ENV-01   | Pass        | Login form reads "Accessing: blackmask.app" with no manual entry. The background requested `https://vault.blackmask.app/api/config` on startup (4 attempts in this run; DNS sinkholed by the harness)                                                                                       |
| ENV-02   | **Fail**    | First install opened a tab to `https://bitwarden.com/browser-start/` (`WELCOME_PAGE_URL`, `apps/browser/src/platform/services/browser-initial-install.service.ts:14`). Known leftover, still open                                                                                           |
| ENV-03   | Pass        | No `bitwarden.com` request other than that welcome tab. The phishing feed was **not** fetched: it needs an active account (see register BM-08)                                                                                                                                              |
| ENV-04   | Info        | Hosts contacted only with the extension loaded: `vault.blackmask.app` (startup, popup) and `bitwarden.com` (install tab), plus the harness's own control URLs. Chromium's own Google hosts were identical in a no-extension baseline run                                                    |
| TRK-01   | Pass        | `declarativeNetRequest.getEnabledRulesets()` returned `["black-mask-trackers"]` on a fresh, logged-out install with no reachable server (flag default applied)                                                                                                                              |
| TRK-02   | Pass        | All 5 tracker requests (`www.google-analytics.com`, `www.googletagmanager.com`, `connect.facebook.net`, `stats.wp.com`, `px.ads.linkedin.com`) failed with `net::ERR_BLOCKED_BY_CLIENT`; both controls failed differently (not blocked)                                                     |
| TRK-03   | Pass        | `chrome.storage.session.blackMaskTrackerCounts` recorded exactly 5 for the test tab                                                                                                                                                                                                         |
| CTR-01   | Pass        | `chrome.contextualIdentities` is undefined on Chromium, so the containers page must show its notice (the page itself is behind login)                                                                                                                                                       |
| AUTH-01  | Pass        | All 8 privacy routes, opened logged out, ended on `#/intro-carousel` (guarded by `authGuard`)                                                                                                                                                                                               |
| THEME-01 | **Partial** | Landing and login screens render legibly in light and dark. Primary buttons, wordmark, focus ring and links are Bitwarden blue: `--color-brand-*` in `libs/components/src/tw-theme.css` still holds Bitwarden's ramp (`--color-brand-700: #175ddc`); only `--color-primary-*` was rebranded |

## Unit tests run today

`npx jest` in `apps/browser` and `libs/common` — 17 suites, 190 tests, 0 failures:

| Suite                                                                                          | Tests |
| ---------------------------------------------------------------------------------------------- | ----- |
| `apps/browser/src/privacy/account-audit.spec.ts`                                               | 13    |
| `apps/browser/src/privacy/ai-media-detector.spec.ts`                                           | 9     |
| `apps/browser/src/privacy/data-exposure.spec.ts`                                               | 5     |
| `apps/browser/src/privacy/fingerprint-exposure-store.spec.ts`                                  | 2     |
| `apps/browser/src/privacy/fingerprint.spec.ts`                                                 | 6     |
| `apps/browser/src/privacy/persona-container.spec.ts`                                           | 4     |
| `apps/browser/src/privacy/phishing-protection.spec.ts`                                         | 3     |
| `apps/browser/src/privacy/popup/services/ai-media-detector.service.spec.ts`                    | 11    |
| `apps/browser/src/privacy/popup/services/persona.service.spec.ts`                              | 17    |
| `apps/browser/src/privacy/privacy-score.spec.ts`                                               | 13    |
| `apps/browser/src/privacy/trackers/tracker-count-store.spec.ts`                                | 5     |
| `apps/browser/src/privacy/trackers/tracker-matcher.spec.ts`                                    | 8     |
| `apps/browser/src/auth/popup/settings/account-security.component.spec.ts`                      | 24    |
| `apps/browser/src/tools/popup/settings/settings-v2.component.spec.ts`                          | 11    |
| `apps/browser/src/background/native-messaging.background.spec.ts`                              | 31    |
| `libs/common/src/platform/services/default-environment.service.spec.ts`                        | 18    |
| `libs/common/src/dirt/services/phishing-detection/phishing-detection-settings.service.spec.ts` | 10    |

Desktop Rust (not a shipping surface), on Linux after the dependency fix in `6117c0c8`: `cargo deny check all`,
`cargo clippy --all-features --tests` with `-D warnings`, `cargo test --lib` (keyring tests under dbus and
gnome-keyring, as CI runs them) and `cargo test --doc` all pass. macOS and Windows were not run.

## Not covered

- **Anything behind login** — personas, the privacy dashboard and score, the trackers page UI,
  fingerprint probes, data exposure, the containers notice, the phishing page, the AI media detector, the
  Connect desktop app button, register/login/sync/autofill. Every privacy page requires an unlocked vault
  (AUTH-01). A local Vaultwarden 1.37.5 (official `vaultwarden/server:latest-alpine` image) was prepared
  for this run but not started: this session's permission policy did not allow running a downloaded server
  binary. Re-run these items against a Vaultwarden you control.
- **Firefox** — not installed here; containers and Firefox MV3 blocking remain manual.
- **The install prompt itself** — unpacked loading skips Chrome's permission prompt, so MAN-01/MAN-03
  are manifest and runtime evidence, not a screenshot of the prompt.
- **A store-installed build in branded Chrome** — this was an unpacked production build in Chromium.
