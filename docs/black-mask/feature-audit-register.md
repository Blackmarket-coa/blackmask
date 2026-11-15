# Black Mask — Feature Audit Register

The register required by §2 of the [AI-first audit plan](./ai-first-audit-and-release-plan.md): one
record per user-visible feature, entry point or critical dependency, with code presence, unit tests,
browser verification, backend verification and security approval kept as **separate** fields.

**Started 2026-11-15 (Waves 0–1, partial Wave 2).** Evidence so far:
[automated Chromium run](./evidence/2026-11-15-chromium-automated.md) — logged-out fresh install only —
plus today's unit-test run and a static inventory of routes, flags and external hosts. No backend was
available, so nothing behind login has runtime evidence yet. Dispositions below are **proposals** for
review, not decisions.

## How to read and update it

- **Status** uses the plan's vocabulary: Verified · Implemented, unverified · Broken · Partial ·
  Blocked · Deferred/hidden · Removed. A record is **Verified** only when it has passed in every target
  environment (Chrome MV3 and Firefox MV3, against the intended backend) with reproducible evidence.
  Code inspection or green unit tests never make a record Verified.
- **Browser** and **Backend** cite evidence IDs from the evidence report (e.g. `TRK-02`), with browser,
  build and date. "Not run" means no attempt; "Blocked" means an attempt could not happen.
- **Security approval** is "Not reviewed" for every record: no independent review has happened.
- **Severity** follows the plan (§8): P0 stop-ship · P1 fix or remove before release · P2 fix if
  bounded, otherwise hide · P3 polish. "—" means no known defect yet (not "no defect").
- **Release gate** refers to the MVP pillars in [`mvp.md`](./mvp.md) §3: A foundation · B trackers ·
  C phishing · D personas · E separation · F exposure · G control and trust · H usability.
- When you retest, update the record's evidence line with environment, date and result, and link the
  new evidence report. Keep superseded evidence in `docs/black-mask/evidence/`.

## Summary

| ID      | Feature or dependency                | Status                  | Code | Unit (2026-11-15) | Browser                                       | Backend  | Sev | Proposed disposition             |
| ------- | ------------------------------------ | ----------------------- | ---- | ----------------- | --------------------------------------------- | -------- | --- | -------------------------------- |
| BM-01   | Privacy dashboard and score          | Implemented, unverified | Yes  | 13 pass           | Blocked (login)                               | Not run  | P2  | Finish now (score truthfulness)  |
| BM-02   | Account audit (password health, 2FA) | Implemented, unverified | Yes  | 13 pass           | Blocked (login)                               | Not run  | —   | Keep, verify                     |
| BM-03   | Tracker blocking (DNR)               | Implemented, unverified | Yes  | 8 pass (matcher)  | Chromium pass; Firefox not run                | n/a      | P2  | Keep; Firefox retest             |
| BM-04   | Tracker counting and trackers page   | Implemented, unverified | Yes  | 5 pass            | Count pass; page blocked                      | n/a      | P3  | Keep, verify page                |
| BM-05   | Persona vault and alias warning      | Implemented, unverified | Yes  | 17 pass           | Blocked (login)                               | Not run  | —   | Keep, verify                     |
| BM-06   | Per-persona containers               | Implemented, unverified | Yes  | 4 pass            | API absent on Chromium (pass); notice blocked | n/a      | P3  | Keep (Firefox-only)              |
| BM-07   | Fingerprint exposure test            | Implemented, unverified | Yes  | 8 pass            | Blocked (login)                               | n/a      | —   | Keep, verify labels              |
| BM-08   | Phishing protection                  | Implemented, unverified | Yes  | 13 pass           | Blocked (login)                               | Not run  | P1  | Decision: premium gate           |
| BM-09   | Data exposure (breach lookup)        | Implemented, unverified | Yes  | 5 pass            | Blocked (login)                               | Not run  | P2  | Verify; hide if backend lacks it |
| BM-10   | AI-generated media detector          | Implemented, unverified | Yes  | 20 pass           | Blocked (login)                               | n/a      | P3  | Keep as bonus or hide            |
| BM-11   | Desktop integration permission       | Implemented, unverified | Yes  | 31 + 24 pass      | Manifest/runtime pass; button blocked         | n/a      | —   | Keep                             |
| CORE-01 | Account: register, log in, 2FA       | Blocked                 | Yes  | Not run           | Login form renders (ENV-01)                   | Blocked  | —   | Block release until verified     |
| CORE-02 | Lock, unlock, vault timeout          | Blocked                 | Yes  | Not run           | Blocked (login)                               | Blocked  | —   | Block release until verified     |
| CORE-03 | Vault items and sync                 | Blocked                 | Yes  | Not run           | Blocked (login)                               | Blocked  | —   | Block release until verified     |
| CORE-04 | Autofill                             | Implemented, unverified | Yes  | Not run           | Not run                                       | Blocked  | —   | Verify                           |
| CORE-05 | Generator and email-alias forwarders | Implemented, unverified | Yes  | Not run           | Blocked (login)                               | n/a      | —   | Verify                           |
| CORE-06 | Send                                 | Implemented, unverified | Yes  | Not run           | Blocked (login)                               | Blocked  | —   | Decide: keep or hide             |
| CORE-07 | Import and export                    | Implemented, unverified | Yes  | Not run           | Blocked (login)                               | Blocked  | —   | Verify export                    |
| CORE-08 | Self-hosted web vault                | Implemented, unverified | Yes  | Not run           | Not run                                       | Blocked  | —   | Verify                           |
| CORE-09 | Premium and billing surfaces         | Implemented, unverified | Yes  | Not run           | Not run                                       | Not run  | P2  | Decision (one-time purchases)    |
| DEP-01  | Default server `vault.blackmask.app` | Blocked                 | Yes  | 18 pass           | Default applied (ENV-01)                      | Not live | P0  | Block release                    |
| DEP-02  | Welcome tab on install               | Broken                  | Yes  | —                 | Fail (ENV-02)                                 | n/a      | P1  | Finish now                       |
| DEP-03  | Phishing feed hosted by Bitwarden    | Implemented, unverified | Yes  | —                 | Not fetched logged out (ENV-03)               | n/a      | P2  | Disclose or self-host            |
| DEP-04  | AI model hosted by Hugging Face      | Implemented, unverified | Yes  | —                 | Blocked (login)                               | n/a      | P3  | Self-host weights                |
| DEP-05  | Breach endpoint (`HIBP_API_KEY`)     | Blocked                 | Yes  | —                 | Blocked (login)                               | Not run  | P2  | Configure backend or hide BM-09  |
| DEP-06  | Feature-flag delivery                | Implemented, unverified | Yes  | —                 | Defaults applied (TRK-01)                     | Not run  | P3  | Keep                             |
| DEP-07  | Bitwarden destinations left in UI    | Broken                  | Yes  | —                 | Not run                                       | n/a      | P1  | Finish now                       |
| DEP-08  | Brand palette                        | Partial                 | Yes  | —                 | Partial (THEME-01)                            | n/a      | P3  | Finish with design review        |
| DEP-09  | Privacy policy and store listing     | Blocked                 | No   | —                 | n/a                                           | n/a      | P1  | Human: write and host            |
| DEP-10  | CI health                            | Partial                 | Yes  | —                 | n/a                                           | n/a      | P2  | Merge fixes; fix macOS runners   |

## Black Mask features

### BM-01 · Privacy dashboard and score

- **Promise:** One screen that summarizes exposure as a 0–100 score with per-factor breakdown.
- **Entry points:** Settings → Privacy dashboard (`/privacy-dashboard`, `authGuard`). Links only to the AI media detector.
- **Platforms:** all builds.
- **Code:** `apps/browser/src/privacy/popup/privacy-dashboard.component.ts`, `apps/browser/src/privacy/privacy-score.ts`.
- **Flag:** `black-mask-privacy-dashboard`, default on.
- **Backend/remote:** none; reads local vault data.
- **Privacy impact:** local computation only.
- **Unit tests:** `privacy-score.spec.ts` 13 pass.
- **Browser evidence:** blocked — page requires login (AUTH-01).
- **Defects:** the tracker factor reads the **flag**, not the ruleset's real state (`privacy-dashboard.component.ts:54-57`), so a build where blocking is absent (MV2, Safari) or never started (a bootstrap error before `syncTrackerProtection`) still scores tracker protection as on. `features.md` says the dashboard "links out to the other tools"; it links only to `/ai-media-detector`.
- **Severity / effort:** P2 / S — read `declarativeNetRequest.getEnabledRulesets()` for the factor.
- **Proposed disposition / gate:** Finish now / F.
- **Security approval:** Not reviewed. **Retest:** after the fix, with an account.

### BM-02 · Account audit (password health, 2FA-capable sites)

- **Promise:** Flags reused and weak passwords and logins on sites that support 2FA.
- **Entry points:** inside the privacy dashboard.
- **Platforms:** all builds.
- **Code:** `apps/browser/src/privacy/account-audit.ts`, `privacy/popup/services/account-audit.service.ts`, `privacy/two-factor-sites.ts` (37-domain seed).
- **Flag:** via `black-mask-privacy-dashboard`.
- **Backend/remote:** none; the audit is local (it does not call api.pwnedpasswords.com).
- **Privacy impact:** local only.
- **Unit tests:** `account-audit.spec.ts` 13 pass.
- **Browser evidence:** blocked (login).
- **Defects:** none known; the 2FA list is a static seed.
- **Severity / effort:** — / —.
- **Proposed disposition / gate:** Keep, verify / F.
- **Security approval:** Not reviewed. **Retest:** with an account holding weak and reused test logins.

### BM-03 · Tracker blocking (declarativeNetRequest)

- **Promise:** Blocks requests to 20 known tracker domains (and their subdomains) on every page.
- **Entry points:** none (background). Status appears on the trackers page and dashboard.
- **Platforms:** Chrome MV3 and Firefox MV3. MV2 builds (`build:firefox`, `dist:firefox`) and Safari have no ruleset.
- **Code:** `apps/browser/src/privacy/trackers/trackers.dnr.json`, `apps/browser/src/background/main.background.ts:1766-1783` (`syncTrackerProtection`), `declarative_net_request` in `manifest.v3.json`.
- **Flag:** `black-mask-tracker-detection`, default on; read once at bootstrap, so a flag change applies at the next background start.
- **Backend/remote:** none.
- **Privacy impact:** local; the static list never updates without a release.
- **Unit tests:** `tracker-matcher.spec.ts` 8 pass (matcher logic only; DNR is not unit-testable).
- **Browser evidence:** TRK-01 pass (ruleset enabled on a fresh logged-out install); TRK-02 pass (5/5 tracker requests `ERR_BLOCKED_BY_CLIENT`, controls untouched) — Chromium 153 headless, prod build, 2026-11-15. Firefox MV3 not run.
- **Defects:** enabling happens after roughly twenty awaited bootstrap steps; an earlier throw is only logged, leaving blocking off while BM-01/BM-04 report it on. Comment at `main.background.ts:1767-1768` says Firefox builds lack the permission; Firefox MV3 grants it.
- **Severity / effort:** P2 / S–M (move the ruleset sync earlier or make it independent of bootstrap failures).
- **Proposed disposition / gate:** Keep; disclose the 20-domain coverage; retest on Firefox MV3 / B.
- **Security approval:** Not reviewed. **Retest:** Firefox MV3.

### BM-04 · Tracker counting and trackers page

- **Promise:** Shows how many tracker requests the current page made.
- **Entry points:** Settings → Trackers (`/trackers`, `authGuard`).
- **Platforms:** builds with `webRequest`.
- **Code:** `apps/browser/src/privacy/background/tracker-count.background.ts`, `privacy/trackers/tracker-count-store.ts`, `privacy/popup/trackers.component.ts`.
- **Flag:** `black-mask-tracker-detection`, default on.
- **Backend/remote:** none. Counts live in `chrome.storage.session` (`blackMaskTrackerCounts`).
- **Privacy impact:** per-tab counts in session storage only; no URLs stored.
- **Unit tests:** `tracker-count-store.spec.ts` 5 pass.
- **Browser evidence:** TRK-03 pass (count of 5 for 5 blocked requests). The page UI is blocked (login).
- **Defects:** listeners register late in bootstrap rather than at worker start; whether counting survives MV3 worker restarts is unverified. The page's "protection on" state reads the flag (see BM-01). Calls `chrome.*` directly instead of `BrowserApi` (`apps/browser/CLAUDE.md`).
- **Severity / effort:** P3 / S.
- **Proposed disposition / gate:** Keep, verify the page / B.
- **Security approval:** Not reviewed. **Retest:** page UI with an account; counts after a worker restart.

### BM-05 · Persona vault and alias warning

- **Promise:** Create, edit and use Real, Business, Creator and Anonymous identities; warn when an alias traces back to you.
- **Entry points:** Settings → Personas (`/personas`, `/create-persona`, `/edit-persona`, all `authGuard`).
- **Platforms:** all builds.
- **Code:** `apps/browser/src/privacy/popup/services/persona.service.ts`, `privacy/popup/{personas,create-persona,edit-persona}.component.ts`. Reuses the Identity cipher; no new crypto.
- **Flag:** `black-mask-persona-vault`, default on.
- **Backend/remote:** vault sync; the alias forwarder the user configures (SimpleLogin, Addy, Fastmail, Firefox Relay, DuckDuckGo, ForwardEmail).
- **Privacy impact:** persona data is vault data (encrypted, synced).
- **Unit tests:** `persona.service.spec.ts` 17 pass, including custom fields surviving an edit.
- **Browser evidence:** blocked (login). `features.md` omits the `/edit-persona` route.
- **Defects:** none known.
- **Severity / effort:** — / —.
- **Proposed disposition / gate:** Keep, verify / D.
- **Security approval:** Not reviewed. **Retest:** full checklist section "Personas" with an account and sync.

### BM-06 · Per-persona containers

- **Promise:** Each persona layer browses in its own cookie container.
- **Entry points:** Settings → Containers (`/persona-containers`, `authGuard`). The entry is shown on every browser.
- **Platforms:** Firefox MV3 only. Chromium shows a "requires Firefox" notice.
- **Code:** `apps/browser/src/privacy/persona-container.ts`, `privacy/popup/services/persona-container.service.ts`; Firefox `cookies`/`contextualIdentities` permissions.
- **Flag:** `black-mask-persona-containers`, default on.
- **Backend/remote:** none.
- **Privacy impact:** cookie isolation is the promise; untested.
- **Unit tests:** `persona-container.spec.ts` 4 pass.
- **Browser evidence:** CTR-01 pass (`contextualIdentities` undefined on Chromium, so the notice path applies); the notice itself is blocked (login). Firefox not run.
- **Defects:** none known. The Settings entry leads Chromium users to an "unsupported" page rather than being hidden.
- **Severity / effort:** P3 / S (optionally hide the entry on Chromium).
- **Proposed disposition / gate:** Keep (Firefox-only, disclosed) / E.
- **Security approval:** Not reviewed. **Retest:** Firefox MV3 cookie isolation.

### BM-07 · Fingerprint exposure test

- **Promise:** Estimates how identifiable the browser is (measurement, not protection).
- **Entry points:** Settings → Fingerprint (`/fingerprint`, `authGuard`).
- **Platforms:** all builds.
- **Code:** `apps/browser/src/privacy/fingerprint.ts`, `privacy/popup/services/fingerprint.service.ts`, `privacy/fingerprint-exposure-store.ts`.
- **Flag:** `black-mask-fingerprint-test`, default on.
- **Backend/remote:** none.
- **Privacy impact:** probes run in the popup and results stay in session storage.
- **Unit tests:** `fingerprint.spec.ts` 6 and `fingerprint-exposure-store.spec.ts` 2 pass.
- **Browser evidence:** blocked (login).
- **Defects:** none known. Probes run in the popup, not the page, so results may differ from what sites observe.
- **Severity / effort:** — / —.
- **Proposed disposition / gate:** Keep, verify labels say "estimate" / F.
- **Security approval:** Not reviewed. **Retest:** checklist section "Fingerprint exposure".

### BM-08 · Phishing protection

- **Promise:** Warns before you open a known phishing site; a page shows status and a toggle.
- **Entry points:** Settings → Phishing (`/phishing-protection`, `authGuard`); the inherited warning page `/security/phishing-warning` is injected into the offending tab.
- **Platforms:** Chrome and Firefox; never Safari.
- **Code:** surface `apps/browser/src/privacy/popup/phishing-protection.component.ts`; engine `apps/browser/src/dirt/phishing-detection/`, `libs/common/src/dirt/services/phishing-detection/phishing-detection-settings.service.ts`.
- **Flags:** `black-mask-phishing-protection` (page) and upstream `phishing-detection` (engine), both default on (`feature-flag.enum.ts:174-177`).
- **Backend/remote:** blocklist from `assets.bitwarden.com` (DEP-03); organization events to your own server.
- **Privacy impact:** visited URLs are checked locally against the downloaded list.
- **Unit tests:** `phishing-protection.spec.ts` 3 and `phishing-detection-settings.service.spec.ts` 10 pass.
- **Browser evidence:** blocked (login). Logged out, the feed is not fetched (ENV-03).
- **Defects:** the engine runs only for an active account with **personal premium or a qualifying organization** (Families, or Enterprise with the phishing blocker) — `phishing-detection-settings.service.ts:92-110, 136-150`. A free user may get "Unavailable", which conflicts with "core safety should not be artificially crippled" (product strategy §6). `features.md` and `browser-validation.md` still attribute "Unavailable" to the upstream flag being off, which is no longer the default.
- **Severity / effort:** P1 / S (code) once the product decision is made.
- **Proposed disposition / gate:** Decision needed: drop the premium gate for Black Mask or disclose it / C.
- **Security approval:** Not reviewed. **Retest:** free and premium test accounts; warning, bypass and offline flows.

### BM-09 · Data exposure (breach lookup)

- **Promise:** On request, shows known breaches for your email.
- **Entry points:** Settings → Data exposure (`/data-exposure`, `authGuard`), "Check now".
- **Platforms:** all builds.
- **Code:** `apps/browser/src/privacy/popup/data-exposure.component.ts`, `privacy/data-exposure.ts`, `libs/common/src/dirt/services/hibp-api.service.ts` (`/hibp/breach`).
- **Flag:** `black-mask-data-exposure`, default on.
- **Backend/remote:** your server's `/api/hibp/breach`, which needs `HIBP_API_KEY` (DEP-05).
- **Privacy impact:** sends the account email to your own server only on explicit action.
- **Unit tests:** `data-exposure.spec.ts` 5 pass.
- **Browser evidence:** blocked (login).
- **Defects:** without the key the page degrades to an error card — honest, but the feature is dead.
- **Severity / effort:** P2 / S.
- **Proposed disposition / gate:** Verify against the real backend; hide if it will not carry a key / F.
- **Security approval:** Not reviewed. **Retest:** with and without `HIBP_API_KEY`.

### BM-10 · AI-generated media detector

- **Promise:** On-device estimate of whether an image or video frame is AI-generated.
- **Entry points:** Settings → AI media (`/ai-media-detector`, `authGuard`); link from the dashboard.
- **Platforms:** all builds; needs `wasm-unsafe-eval` in the CSP.
- **Code:** `apps/browser/src/privacy/popup/services/ai-media-detector.service.ts` (model `onnx-community/Deep-Fake-Detector-v2-Model-ONNX`, ONNX runtime bundled under `ort/`).
- **Flag:** `black-mask-ai-media-detector`, default on.
- **Backend/remote:** one-time weight download from huggingface.co (DEP-04).
- **Privacy impact:** media stays on device; the model download reveals use of the feature to Hugging Face.
- **Unit tests:** `ai-media-detector.spec.ts` 9 and `ai-media-detector.service.spec.ts` 11 pass.
- **Browser evidence:** blocked (login).
- **Defects:** none known; accuracy is probabilistic by nature.
- **Severity / effort:** P3 / —.
- **Proposed disposition / gate:** Keep as a bonus if it passes validation; otherwise hide — not an MVP blocker / F.
- **Security approval:** Not reviewed. **Retest:** first-run download, cached second run, known real and generated samples.

### BM-11 · Desktop integration permission

- **Promise:** No native-messaging warning at install; "Connect desktop app" requests it on demand.
- **Entry points:** Account security → Connect desktop app (`/account-security`, `authGuard`).
- **Platforms:** Chrome and Firefox (Safari keeps it required).
- **Code:** `apps/browser/src/background/nativeMessaging.background.ts` (`permitted()`), account security component.
- **Flag:** none.
- **Backend/remote:** none; host `app.blackmask.desktop` (no desktop app ships).
- **Privacy impact:** reduces install-time permissions.
- **Unit tests:** `native-messaging.background.spec.ts` 31 and `account-security.component.spec.ts` 24 pass.
- **Browser evidence:** MAN-01 pass (optional in the built manifest); MAN-03 pass (not granted at runtime). The button and permission prompt are blocked (login); the install prompt is not observable with unpacked loading.
- **Defects:** none known.
- **Severity / effort:** — / —.
- **Proposed disposition / gate:** Keep / G.
- **Security approval:** Not reviewed. **Retest:** button prompt, revoke and re-show, no poll spam.

## Inherited foundation

These come from the Bitwarden fork largely unchanged. They are release blockers until verified against
the intended backend (pillar A), because a failure here breaks trust in everything else.

### CORE-01 · Account: register, log in, two-step login

- **Promise:** Create an account and log in to the configured server; optional 2FA.
- **Entry points:** intro carousel → Create account / Log in (`/signup`, `/login`, `/2fa`); the login form also offers passkey and SSO.
- **Code:** `libs/auth`, `apps/browser/src/auth`.
- **Backend:** Vaultwarden at the configured server.
- **Browser evidence:** ENV-01 pass (login form renders and defaults to blackmask.app). No account flow run: no backend (see the evidence report).
- **Defects:** passkey and SSO entries are shown whether or not the backend supports them (unverified). The signup page links to Bitwarden's terms, privacy policy and email preferences (DEP-07).
- **Disposition / gate:** Block release until verified / A. **Security approval:** Not reviewed.

### CORE-02 · Lock, unlock, vault timeout

- **Promise:** The vault locks on timeout or idle and unlocks with the master password (biometrics only with desktop).
- **Code:** `libs/key-management`, `apps/browser/src/auth/popup/settings/account-security.component.ts`.
- **Evidence:** blocked (login). **Disposition / gate:** Block release until verified / A. **Security approval:** Not reviewed.

### CORE-03 · Vault items and sync

- **Promise:** Create, edit, delete and sync logins, cards, identities and notes.
- **Code:** `libs/vault`, `libs/common/src/vault`, `libs/common/src/platform/sync`.
- **Backend:** sync runs on bootstrap and on a 5-minute alarm, including while locked.
- **Evidence:** blocked (login). **Disposition / gate:** Block release until verified / A. **Security approval:** Not reviewed.

### CORE-04 · Autofill

- **Promise:** Fill credentials via inline menu, context menu and keyboard; offer to save new logins.
- **Code:** `apps/browser/src/autofill`; content scripts on every http(s) and file page.
- **Evidence:** not run. **Disposition / gate:** Verify / A. **Security approval:** Not reviewed.

### CORE-05 · Generator and email-alias forwarders

- **Promise:** Generate passwords, passphrases, usernames and forwarding aliases.
- **Code:** `libs/tools/generator`, `libs/common/src/tools/extension/vendor/` (forwarder APIs).
- **Backend/remote:** only the forwarder the user configures.
- **Evidence:** blocked (login). **Disposition / gate:** Verify / D (aliases feed personas). **Security approval:** Not reviewed.

### CORE-06 · Send

- **Promise:** Share text or files through the server with an expiring link.
- **Code:** `libs/tools/send`; tab hidden when the disable-Send policy applies.
- **Evidence:** blocked (login). Not in the MVP scope table.
- **Disposition / gate:** Decide whether to keep it visible / H. **Security approval:** Not reviewed.

### CORE-07 · Import and export

- **Promise:** Import from other managers (including LastPass direct import) and export the vault.
- **Code:** `libs/importer`, `apps/browser/src/tools/popup/settings`.
- **Backend/remote:** LastPass direct import contacts lastpass.com and Microsoft or Google identity endpoints on request.
- **Evidence:** blocked (login). **Disposition / gate:** Verify export (pillar G requires it) / G. **Security approval:** Not reviewed.

### CORE-08 · Self-hosted web vault

- **Promise:** Manage the vault in a browser at the server's web origin.
- **Code:** `apps/web`, built by `npm run dist:oss:selfhost` in `build-web.yml` (passing in CI). No Black Mask features.
- **Evidence:** not run. **Disposition / gate:** Verify against the backend / A. **Security approval:** Not reviewed.

### CORE-09 · Premium and billing surfaces

- **Promise (inherited):** Bitwarden Premium upsell, `/premium` page and premium-gated features.
- **Code:** `apps/browser/src/billing`, `libs/common/src/billing`.
- **Defects:** premium gates BM-08 phishing protection. PR #14 records the 2026-11-12 decision that enhancements are one-time purchases with no subscription; the inherited subscription surfaces do not match it yet.
- **Severity / effort:** P2 / M. **Disposition / gate:** Decision needed / G. **Security approval:** Not reviewed.

## Critical dependencies and launch infrastructure

### DEP-01 · Default server `vault.blackmask.app`

- **What:** every fresh install talks to `https://vault.blackmask.app` (`libs/common/src/platform/services/default-environment.service.ts:85`).
- **Evidence:** ENV-01 pass — login shows "Accessing: blackmask.app" and the background requests `/api/config` from that origin on startup. The domain was unregistered as of 2026-09-25 ([README](./README.md#launch-prerequisites)); not rechecked here.
- **Defect:** while unregistered, anyone could register it and receive every default install's logins.
- **Unit tests:** `default-environment.service.spec.ts` 18 pass.
- **Severity / effort:** P0 / human. **Disposition:** Block release until the domain is owned and the server is live. **Gate:** A.

### DEP-02 · Welcome tab on install

- **What:** production builds open `https://bitwarden.com/browser-start/` on first install (`apps/browser/src/platform/services/browser-initial-install.service.ts:14`).
- **Evidence:** ENV-02 **fail** — reproduced on a fresh install of the production build.
- **Severity / effort:** P1 / S once a destination is chosen (a bundled extension page avoids needing a domain).
- **Disposition:** Finish now. **Gate:** A, G.

### DEP-03 · Phishing feed hosted by Bitwarden

- **What:** the blocklist downloads from `assets.bitwarden.com`, with a checksum fallback on `raw.githubusercontent.com` (`apps/browser/src/dirt/phishing-detection/phishing-resources.ts:1-5`).
- **Evidence:** not fetched on a logged-out install (ENV-03); fires when protection turns on for an eligible account, then every 24 hours.
- **Severity / effort:** P2 / M (host the list on a Black Mask origin) or S (disclose).
- **Disposition:** Disclose for v1 or self-host. **Gate:** C, G.

### DEP-04 · AI model hosted by Hugging Face

- **What:** first use of BM-10 downloads weights from huggingface.co.
- **Severity / effort:** P3 / M. **Disposition:** Self-host the weights before store submission (review risk and cleaner privacy claim). **Gate:** G.

### DEP-05 · Breach endpoint (`HIBP_API_KEY`)

- **What:** BM-09 needs the backend to proxy Have I Been Pwned with a paid API key.
- **Severity / effort:** P2 / human (key and billing). **Disposition:** Configure the backend or hide BM-09. **Gate:** F.

### DEP-06 · Feature-flag delivery

- **What:** flags come from `/api/config`; all `black-mask-*` flags default on because Vaultwarden does not serve them.
- **Evidence:** TRK-01 shows the default applied with no reachable server.
- **Defects:** locally stored flag overrides take precedence over the server (static read); flags are read once for tracker setup.
- **Severity / effort:** P3 / —. **Disposition:** Keep. **Gate:** —.

### DEP-07 · Bitwarden destinations left in the UI

- **What:** user-facing links that still point at Bitwarden:
  - About → Rate opens Bitwarden's store listings (`apps/browser/src/tools/popup/settings/about-page/about-page-v2.component.ts:19-31`).
  - "Download Bitwarden apps" and "More from Bitwarden" settings pages.
  - Help centre links (bitwarden.com/help).
  - Signup page links to bitwarden.com/terms, /privacy and /email-preferences (`libs/auth/src/angular/registration/registration-start/registration-start.component.html:35, 61, 70`). The email-preferences link shows because the Black Mask region is modelled as a cloud region.
- **Evidence:** static only; not clicked in a browser.
- **Severity / effort:** P1 / M — misattribution and legal-text mismatch are store-review and trademark risks.
- **Disposition:** Finish now: repoint to Black Mask destinations or hide until they exist. **Gate:** G, H.

### DEP-08 · Brand palette

- **What:** `--color-primary-*` carries the Black Mask greens; the newer `--color-brand-*` tokens that buttons, the wordmark and links use are still Bitwarden's blues (`libs/components/src/tw-theme.css:95-106`).
- **Evidence:** THEME-01 partial — screenshots of landing and login in light and dark.
- **Severity / effort:** P3 / S–M plus contrast checks (WCAG AA) and a visual review in both themes.
- **Disposition:** Finish with design review. **Gate:** H.

### DEP-09 · Privacy policy and store listing

- **What:** both stores require a privacy policy URL; none exists. Icons are generated placeholders ([branding](./branding.md)).
- **Severity / effort:** P1 / human. **Disposition:** Write and host the policy; replace placeholder assets. **Gate:** G.

### DEP-10 · CI health

- **What:** Lint failed on every push to `main` since at least 2026-11-04 (Prettier on docs; three cargo-deny advisories in desktop Rust). Fixed on branch `claude/upbeat-dijkstra-ha54fx` (`ab3f0bb6`, `6117c0c8`), not yet merged. The crypto-bigint advisory is ignored with a written reason that needs sign-off. Separately, macOS jobs are cancelled before a runner starts, which fails the Testing gate even when every test passes.
- **Severity / effort:** P2 / S. **Disposition:** Merge the fixes; check the Actions minutes or spending limit, or make macOS desktop jobs optional. **Gate:** —.

## Documentation drift found

Code and docs disagree in these places (verified in code; the docs are not changed here):

1. `features.md` and `browser-validation.md` say the phishing page reports "Unavailable" until the
   upstream `phishing-detection` flag is delivered. That flag already defaults on
   (`feature-flag.enum.ts:174-177`); the real gates are an active account and premium or a qualifying
   organization (BM-08).
2. `features.md` says the tracker factor gets full marks "when tracker blocking is enabled"; the code
   uses the flag value, not the ruleset state (BM-01).
3. `features.md` says the dashboard links out to the other tools; it links only to the AI media detector.
4. `features.md` lists `/personas` and `/create-persona` but not `/edit-persona`.
5. `main.background.ts:1767-1768` says Firefox builds lack the DNR permission; Firefox MV3 grants it.

## Next steps for the register

1. **Get a backend.** Run Vaultwarden (the version the hosted service will use) and a test account,
   then re-run `scripts/validate-black-mask-chromium.js` and walk the logged-in checklist sections.
   About two-thirds of the records (every page behind login, the account flows, and the
   phishing-feed and model-download dependencies) are waiting on this.
2. **Firefox MV3.** Containers (BM-06) and Firefox blocking (BM-03) need a Firefox run.
3. **Fix the bounded defects:** DEP-02, BM-01, DEP-07, then the BM-08 decision.
4. **Human gates:** DEP-01, DEP-05, DEP-09, and sign-off on the crypto-bigint ignore (DEP-10).
