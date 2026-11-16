# Evidence — automated Chromium run with a local Vaultwarden, 2026-11-16

Second pass of [`browser-validation.md`](../browser-validation.md), this time with a backend, so the
logged-in checks could run. It covers a production Chrome MV3 build in Chromium, against a local
Vaultwarden. It does not cover Firefox, a store-installed build or the hosted service. Status per
feature is in the [feature audit register](../feature-audit-register.md); the logged-out baseline from
the day before is in [`2026-11-15-chromium-automated.md`](./2026-11-15-chromium-automated.md).

## Environment

| Item     | Value                                                                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | branch `claude/upbeat-dijkstra-ha54fx` (PR #15) with the fixes below, built with `npm run build:prod:chrome` (`NODE_ENV=production`); manifest version `2026.6.0`, MV3 |
| Browser  | Chromium 153.0.8010.12, headless, Playwright 1.59.1, fresh profile per run, regular Chrome user agent (see the 2026-11-15 report for why)                              |
| Server   | Vaultwarden 1.37.5 (official `vaultwarden/server:latest-alpine` image), on `https://localhost:8443` with a self-signed certificate trusted by SPKI hash only           |
| Network  | Hermetic: every hostname except `localhost` resolved to NOTFOUND; attempted requests captured with a Chromium NetLog                                                   |
| Accounts | A new synthetic account per run (`bm-validation-<timestamp>@example.com`), created through the extension's signup screens                                              |

Reproduce with (after building the extension):

```bash
node scripts/validate-black-mask-chromium.js --extension apps/browser/build --out /tmp/bm-run \
  --server https://localhost:8443 --trust-spki <base64 SPKI sha256 of the server certificate>
```

## Results

All 30 checks from the final run. "Blocked" means the check could not complete for a reason outside
the product code as far as this run can tell; it is not a pass.

| Check    | Result      | Evidence                                                                                                                                                              |
| -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MAN-01   | Pass        | `nativeMessaging` and `privacy` are optional permissions in the built manifest                                                                                        |
| MAN-02   | Pass        | Tracker ruleset packaged with `enabled: false`                                                                                                                        |
| MAN-03   | Pass        | `nativeMessaging` not granted at runtime                                                                                                                              |
| ENV-01   | Pass        | Login form reads "Accessing: blackmask.app"                                                                                                                           |
| ENV-02   | Pass        | No tab outside the extension opened on install (was a fail on 2026-11-15)                                                                                             |
| WEL-01   | Pass        | First install opened `popup/index.html#/welcome`, which rendered "Welcome to Black Mask" and its three sections                                                       |
| TRK-01   | Pass        | Ruleset `black-mask-trackers` enabled on a fresh, logged-out install                                                                                                  |
| TRK-02   | Pass        | 5/5 tracker requests `net::ERR_BLOCKED_BY_CLIENT`; controls not blocked                                                                                               |
| TRK-03   | Pass        | Session count of 5 for the test tab                                                                                                                                   |
| CTR-01   | Pass        | `chrome.contextualIdentities` undefined on Chromium                                                                                                                   |
| AUTH-01  | Pass        | All 8 privacy routes redirect away when logged out                                                                                                                    |
| THEME-01 | Partial     | Renders in light and dark; primary buttons and links are still Bitwarden blue (`--color-brand-*`)                                                                     |
| SRV-01   | Pass        | Self-hosted server saved through the login screen's server picker (an `http://` URL is refused: "URLs must use HTTPS")                                                |
| REG-01   | Pass        | Account created through the signup and finish-signup screens; landed in the vault                                                                                     |
| LOG-01   | Pass        | Logged in with the master password                                                                                                                                    |
| VLT-01   | Pass        | Login item created and listed in the vault                                                                                                                            |
| SYNC-01  | Pass        | A second, fresh browser profile logged in to the same account and received the item from the server                                                                   |
| DASH-01  | Pass        | Privacy score shown; no fingerprint factor before the test had run                                                                                                    |
| FP-01    | Pass        | Probes returned values (≈56 bits across 15 signals, including canvas, WebGL, audio and fonts); the dashboard then gained the fingerprint factor                       |
| TRK-04   | Pass        | Trackers page shows tracker protection                                                                                                                                |
| PER-01   | Pass        | Persona created and listed under its layer straight after saving (failed before the persona-list fix below)                                                           |
| PER-02   | Pass        | Persona editor opened; layer changed to Creator with exactly one `Black Mask Layer` field; email and notes cleared (checked in the item view, field values included)  |
| EXP-01   | Pass        | With no `HIBP_API_KEY` on the server, the page says breach lookup isn't set up (reported "Found in 1 known breaches" before the fix below)                            |
| CTR-02   | Pass        | Containers page shows "Containers require Firefox…"                                                                                                                   |
| PH-01    | Pass        | Phishing protection page reads **Active**. Vaultwarden reports every account as premium, so this does not distinguish the premium-gate removal; unit tests cover that |
| AI-01    | Pass        | AI media detector page renders; the model download was not exercised (network blocked)                                                                                |
| ACC-01   | Pass        | Account security shows **Connect desktop app**                                                                                                                        |
| LOCK-01  | **Blocked** | The lock happened (background log: `[LockService] Locked user …`), but the extension never came back from the reload that locking triggers — see below                |
| ENV-03   | Pass        | No `bitwarden.com` requests other than the phishing feed                                                                                                              |
| ENV-04   | Info        | See [Hosts contacted](#hosts-contacted)                                                                                                                               |

## Server-side checks

Queried directly from the server's API with a test account:

- `GET /api/accounts/profile` returns `"premium": true` for a brand-new account. Vaultwarden treats
  every user as premium, so premium-gated behaviour cannot be told apart on this backend.
- `GET /api/hibp/breach` without `HIBP_API_KEY` returns one entry:
  `{"name": "HaveIBeenPwned", "title": "Manual HIBP Check", "pwnCount": 0, "dataClasses": ["Error - No API key set!"]}`.
- `GET /api/sync` lists the items the extension created (a login and a persona), so they reached the
  server encrypted, as expected.

## Hosts contacted

Compared against a baseline run of the same Chromium without the extension:

| Host                     | When                                    | What it is                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vault.blackmask.app`    | startup, before the server was switched | Default server's `/api/config`                                                                                                                                                                                                                                                                                                                                |
| `localhost:8443`         | logged in                               | The test server                                                                                                                                                                                                                                                                                                                                               |
| `assets.bitwarden.com`   | logged in                               | Phishing blocklist, fetched once protection turned on for the account (the documented exception)                                                                                                                                                                                                                                                              |
| `api.pwnedpasswords.com` | while saving the login item             | `/range/70D21` — the first five characters of the SHA-1 of that item's password (Have I Been Pwned's k-anonymity API). The only caller in the extension is the item form's **Check password** action (`libs/vault/src/cipher-form/components/login-details-section/login-details-section.component.ts:271-278`); what triggered it in this run is unconfirmed |

Chromium's own Google hosts appeared identically with and without the extension.

## Defects this run found (fixed in PR #15)

1. **Data exposure reported a breach that wasn't one.** Vaultwarden's no-API-key placeholder was
   counted as a breach ("Found in 1 known breaches"). The page now says breach lookup isn't set up.
2. **The persona list went blank after creating a persona.** `cipherViews$` emits `null` while the
   vault re-decrypts after a save; `personas$()` mapped over it, errored, and the list stayed empty
   until the popup reopened. The account audit had the same exposure.

## Lock and unlock (blocked)

Locking calls `chrome.runtime.reload()` once every popup view has closed, to clear secrets from
memory (`apps/browser/src/background/main.background.ts:1439-1447`). In this environment the
extension did not come back from that reload: no new service worker within 60 seconds and its pages
stayed `ERR_BLOCKED_BY_CLIENT`. What was tried:

| Experiment                                                               | Extension came back? |
| ------------------------------------------------------------------------ | -------------------- |
| Direct `chrome.runtime.reload()` from the service worker, logged out     | Yes, in ~2 s         |
| Two `chrome.runtime.reload()` calls in a row, logged out                 | Yes, in ~2 s         |
| Lock from the account switcher, `--load-extension`, nothing else touched | No (60 s)            |
| Lock from the account switcher, loaded with `Extensions.loadUnpacked`    | No (60 s)            |

The cause is not established. It may be specific to headless automation, or it may affect users;
**lock and unlock must be checked by hand in Chrome before release.** Logout triggers the same
reload, which is why sync was verified from a second profile instead of by logging out and back in.

## Not covered

- Lock and unlock (above); logout.
- Persona custom-field survival and the alias "traced back to you" warning.
- The phishing warning and bypass flow (needs a known phishing URL and network access).
- Real breach data (needs `HIBP_API_KEY`) and the AI model download (network blocked).
- Autofill, generator, Send, import and export.
- Firefox, a store-installed build, and the hosted backend.
