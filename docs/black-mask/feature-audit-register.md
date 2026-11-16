# Black Mask — Feature Audit Register

The register required by §2 of the [AI-first audit plan](./ai-first-audit-and-release-plan.md): one
record per user-visible feature, entry point or critical dependency, with code presence, unit tests,
browser verification, backend verification and security approval kept as **separate** fields.

**Last updated 2026-11-16.** Evidence:

- [Automated Chromium run with a local Vaultwarden](./evidence/2026-11-16-chromium-logged-in.md)
  (2026-11-16): logged-out and logged-in checks, production build.
- [Logged-out baseline](./evidence/2026-11-15-chromium-automated.md) (2026-11-15).
- Unit tests run on 2026-11-16: browser 18 suites / 180 tests and `libs/common` 2 suites / 27 tests,
  all passing.
- A static inventory of routes, flags and external hosts.
- The [2026-11-12 source/CI review](./implementation-status-2026-11-12.md), the earlier scoped
  summary that this register follows.

The backend was a local Vaultwarden 1.37.5, not the hosted service, so "Backend" results are against
that stand-in. Dispositions are **proposals** for review unless marked as decided.

## How to read and update it

- **Status** uses the plan's vocabulary: Verified · Implemented, unverified · Broken · Partial ·
  Blocked · Deferred/hidden · Removed. A record is **Verified** only when it has passed in every target
  environment (Chrome MV3 and Firefox MV3, against the intended backend) with reproducible evidence.
  Nothing here is Verified yet: Firefox has not been run and the hosted backend does not exist.
- **Browser** and **Backend** cite check IDs from the evidence reports (e.g. `TRK-02`). "Not run"
  means no attempt; "Blocked" means an attempt could not complete.
- **Security approval** is "Not reviewed" for every record: no independent review has happened.
- **Severity** follows the plan (§8): P0 stop-ship · P1 fix or remove before release · P2 fix if
  bounded, otherwise hide · P3 polish. "—" means no known open defect (not "no defect").
- **Release gate** refers to the MVP pillars in [`mvp.md`](./mvp.md) §3: A foundation · B trackers ·
  C phishing · D personas · E separation · F exposure · G control and trust · H usability.
- When you retest, update the record's evidence line with environment, date and result, and add the
  new evidence report to `docs/black-mask/evidence/`.

## Summary

| ID      | Feature or dependency                | Status                  | Unit (11-16) | Browser (Chromium)                     | Backend (local VW) | Sev | Disposition                                  |
| ------- | ------------------------------------ | ----------------------- | ------------ | -------------------------------------- | ------------------ | --- | -------------------------------------------- |
| BM-01   | Privacy dashboard and score          | Implemented, unverified | 13 pass      | Pass (DASH-01, FP-01)                  | Pass               | P2  | Finish now (score truthfulness)              |
| BM-02   | Account audit                        | Implemented, unverified | 13 pass      | Renders (DASH-01); counts not asserted | Pass               | —   | Keep, verify counts                          |
| BM-03   | Tracker blocking (DNR)               | Implemented, unverified | 8 pass       | Pass (TRK-01, TRK-02)                  | n/a                | P2  | Keep; Firefox retest                         |
| BM-04   | Tracker counting and trackers page   | Implemented, unverified | 5 pass       | Pass (TRK-03, TRK-04)                  | n/a                | P3  | Keep                                         |
| BM-05   | Persona vault and alias warning      | Implemented, unverified | 18 pass      | Pass (PER-01, PER-02)                  | Pass (SYNC-01)     | —   | Keep; run remaining items                    |
| BM-06   | Per-persona containers               | Implemented, unverified | 4 pass       | Notice shown (CTR-01, CTR-02)          | n/a                | P3  | Keep (Firefox-only)                          |
| BM-07   | Fingerprint exposure test            | Implemented, unverified | 8 pass       | Pass (FP-01)                           | n/a                | —   | Keep                                         |
| BM-08   | Phishing protection                  | Implemented, unverified | 12 pass      | Active (PH-01)                         | Pass               | P2  | **Decided**: free for everyone (done)        |
| BM-09   | Data exposure (breach lookup)        | Implemented, unverified | 9 pass       | Pass (EXP-01)                          | No key configured  | P2  | Configure the key or hide                    |
| BM-10   | AI-generated media detector          | Implemented, unverified | 20 pass      | Page renders (AI-01)                   | n/a                | P3  | Keep as bonus or hide                        |
| BM-11   | Desktop integration permission       | Implemented, unverified | 31 + 24 pass | Pass (MAN-01, MAN-03, ACC-01)          | n/a                | —   | Keep                                         |
| BM-12   | Welcome page (first install)         | Implemented, unverified | 3 + 10 pass  | Pass (WEL-01, ENV-02)                  | n/a                | —   | **Decided**: bundled page (done)             |
| CORE-01 | Account: register, log in, 2FA       | Implemented, unverified | Not run      | Pass (SRV-01, REG-01, LOG-01)          | Pass               | —   | Verify on the hosted backend                 |
| CORE-02 | Lock, unlock, vault timeout          | **Blocked**             | Not run      | Blocked (LOCK-01)                      | Lock logged        | P1  | Check by hand in Chrome before release       |
| CORE-03 | Vault items and sync                 | Implemented, unverified | Not run      | Pass (VLT-01, SYNC-01)                 | Pass               | —   | Verify on the hosted backend                 |
| CORE-04 | Autofill                             | Implemented, unverified | Not run      | Not run                                | Not run            | —   | Verify                                       |
| CORE-05 | Generator and email-alias forwarders | Implemented, unverified | Not run      | Not run                                | n/a                | —   | Verify                                       |
| CORE-06 | Send                                 | Implemented, unverified | Not run      | Not run                                | Not run            | —   | Decide: keep or hide                         |
| CORE-07 | Import and export                    | Implemented, unverified | Not run      | Not run                                | Not run            | —   | Verify export                                |
| CORE-08 | Self-hosted web vault                | Implemented, unverified | Not run      | Not run                                | Not run            | —   | Verify                                       |
| CORE-09 | Premium and billing surfaces         | Implemented, unverified | Not run      | Not run                                | Not run            | P2  | Align with the one-time-purchase decision    |
| DEP-01  | Default server `vault.blackmask.app` | Blocked                 | 18 pass      | Default applied (ENV-01)               | Not live           | P0  | Block release                                |
| DEP-02  | Welcome tab on install               | Fixed (see BM-12)       | —            | Pass (ENV-02)                          | n/a                | —   | Done                                         |
| DEP-03  | Phishing feed hosted by Bitwarden    | Implemented, unverified | —            | Fetched after login (ENV-04)           | n/a                | P2  | Disclosed on welcome page; self-host later   |
| DEP-04  | AI model hosted by Hugging Face      | Implemented, unverified | —            | Not run                                | n/a                | P3  | Self-host weights                            |
| DEP-05  | Breach endpoint (`HIBP_API_KEY`)     | Blocked                 | —            | Honest "not set up" (EXP-01)           | No key             | P2  | Configure the key or hide BM-09              |
| DEP-06  | Feature-flag delivery                | Implemented, unverified | —            | Defaults applied (TRK-01)              | Not run            | P3  | Keep                                         |
| DEP-07  | Bitwarden destinations left in UI    | Broken                  | —            | Not run                                | n/a                | P1  | Finish now                                   |
| DEP-08  | Brand palette                        | Partial                 | —            | Partial (THEME-01)                     | n/a                | P3  | Finish with design review                    |
| DEP-09  | Privacy policy and store listing     | Blocked                 | —            | n/a                                    | n/a                | P1  | Human: write and host                        |
| DEP-10  | CI health                            | Partial                 | —            | n/a                                    | n/a                | P2  | Merged 11-16; decide on a desktop build gate |
| DEP-11  | Third-party requests after login     | Implemented, unverified | —            | Observed (ENV-04)                      | n/a                | P2  | Disclose in the privacy policy               |

## Black Mask features

### BM-01 · Privacy dashboard and score

- **Promise:** One screen that summarizes exposure as a 0–100 score with per-factor breakdown.
- **Entry points:** Settings → Privacy dashboard (`/privacy-dashboard`, `authGuard`). Links only to the AI media detector.
- **Code:** `apps/browser/src/privacy/popup/privacy-dashboard.component.ts`, `apps/browser/src/privacy/privacy-score.ts`.
- **Flag:** `black-mask-privacy-dashboard`, default on. **Backend/remote:** none; reads local vault data.
- **Unit tests:** `privacy-score.spec.ts` 13 pass.
- **Browser evidence:** DASH-01 pass (score shown, no fingerprint factor before the test); FP-01 pass (factor appears after the test) — Chromium 153, local Vaultwarden, 2026-11-16. Firefox not run.
- **Defects:** the tracker factor reads the **flag**, not the ruleset's real state (`privacy-dashboard.component.ts:54-57`), so a build where blocking is absent (MV2, Safari) or never started still scores protection as on.
- **Severity / effort:** P2 / S — read `declarativeNetRequest.getEnabledRulesets()` for the factor.
- **Disposition / gate:** Finish now (proposed) / F. **Security approval:** Not reviewed.

### BM-02 · Account audit (password health, 2FA-capable sites)

- **Promise:** Flags reused and weak passwords and logins on sites that support 2FA.
- **Entry points:** inside the privacy dashboard.
- **Code:** `apps/browser/src/privacy/account-audit.ts`, `privacy/popup/services/account-audit.service.ts`, `privacy/two-factor-sites.ts` (37-domain seed). Local only; it does not call api.pwnedpasswords.com.
- **Unit tests:** `account-audit.spec.ts` 13 pass.
- **Browser evidence:** the dashboard renders with the audit (DASH-01); the counts were not asserted against seeded weak or reused logins.
- **Defects:** shared the persona list's `null`-emission exposure (BM-05); fixed in PR #15.
- **Disposition / gate:** Keep, verify counts / F. **Security approval:** Not reviewed.

### BM-03 · Tracker blocking (declarativeNetRequest)

- **Promise:** Blocks requests to 20 known tracker domains (and their subdomains) on every page.
- **Platforms:** Chrome MV3 and Firefox MV3. MV2 builds and Safari have no ruleset.
- **Code:** `apps/browser/src/privacy/trackers/trackers.dnr.json`, `apps/browser/src/background/main.background.ts:1766-1783`, `declarative_net_request` in `manifest.v3.json`.
- **Flag:** `black-mask-tracker-detection`, default on; read once at bootstrap.
- **Unit tests:** `tracker-matcher.spec.ts` 8 pass (matcher logic only).
- **Browser evidence:** TRK-01 pass (ruleset enabled on a fresh logged-out install); TRK-02 pass (5/5 tracker requests `ERR_BLOCKED_BY_CLIENT`, controls untouched) — 2026-11-15 and 2026-11-16. Firefox not run.
- **Defects:** enabling happens late in bootstrap; an earlier throw would leave blocking off while BM-01/BM-04 report it on. The comment at `main.background.ts:1767-1768` says Firefox builds lack the permission; Firefox MV3 grants it.
- **Severity / effort:** P2 / S–M. **Disposition / gate:** Keep; disclose coverage; Firefox retest / B. **Security approval:** Not reviewed.

### BM-04 · Tracker counting and trackers page

- **Promise:** Shows how many tracker requests the current page made.
- **Entry points:** Settings → Trackers (`/trackers`, `authGuard`).
- **Code:** `apps/browser/src/privacy/background/tracker-count.background.ts`, `privacy/trackers/tracker-count-store.ts`, `privacy/popup/trackers.component.ts`.
- **Unit tests:** `tracker-count-store.spec.ts` 5 pass.
- **Browser evidence:** TRK-03 pass (count of 5 for 5 blocked requests); TRK-04 pass (page renders).
- **Defects:** listeners register late in bootstrap; counting across MV3 worker restarts is unverified. The page's "protection on" reads the flag (see BM-01). Calls `chrome.*` directly instead of `BrowserApi`.
- **Severity / effort:** P3 / S. **Disposition / gate:** Keep / B. **Security approval:** Not reviewed.

### BM-05 · Persona vault and alias warning

- **Promise:** Create, edit and use Real, Business, Creator and Anonymous identities; warn when an alias traces back to you.
- **Entry points:** Settings → Personas (`/personas`, `/create-persona`, `/edit-persona`, all `authGuard`).
- **Code:** `apps/browser/src/privacy/popup/services/persona.service.ts` and the persona components. Reuses the Identity cipher; no new crypto.
- **Unit tests:** `persona.service.spec.ts` 18 pass, including a regression test for the fix below.
- **Browser evidence:** PER-01 pass (created and listed under its layer straight after saving); PER-02 pass (editor opens; layer change keeps exactly one `Black Mask Layer` field; email and notes clear); SYNC-01 shows persona items reach the server.
- **Defects found and fixed (PR #15):** `cipherViews$` emits `null` while the vault re-decrypts after a save; `personas$()` mapped over it, errored, and the list stayed blank until the popup reopened. Now filtered with `filterOutNullish()`.
- **Not run:** custom-field survival through the editor; the alias "traced back to you" warning.
- **Disposition / gate:** Keep; run the remaining items / D. **Security approval:** Not reviewed.

### BM-06 · Per-persona containers

- **Promise:** Each persona layer browses in its own cookie container. Firefox MV3 only.
- **Code:** `apps/browser/src/privacy/persona-container.ts`, `privacy/popup/services/persona-container.service.ts`.
- **Unit tests:** `persona-container.spec.ts` 4 pass.
- **Browser evidence:** CTR-01 and CTR-02 pass (Chromium has no `contextualIdentities`; the page shows "Containers require Firefox…"). Firefox cookie isolation not run.
- **Defects:** none known. The Settings entry leads Chromium users to the notice rather than being hidden.
- **Severity / effort:** P3 / S. **Disposition / gate:** Keep (Firefox-only, disclosed) / E. **Security approval:** Not reviewed.

### BM-07 · Fingerprint exposure test

- **Promise:** Estimates how identifiable the browser is (measurement, not protection).
- **Code:** `apps/browser/src/privacy/fingerprint.ts`, `privacy/popup/services/fingerprint.service.ts`, `privacy/fingerprint-exposure-store.ts`.
- **Unit tests:** `fingerprint.spec.ts` 6 and `fingerprint-exposure-store.spec.ts` 2 pass.
- **Browser evidence:** FP-01 pass — ≈56 bits across 15 signals, with canvas, WebGL, audio and font probes all returning values, labelled as an estimate. Not compared against a reference such as coveryourtracks.eff.org; headless Chromium renders WebGL with SwiftShader.
- **Defects:** none known. Probes run in the popup, not the page.
- **Disposition / gate:** Keep / F. **Security approval:** Not reviewed.

### BM-08 · Phishing protection

- **Promise:** Warns before you open a known phishing site; a page shows status and a toggle.
- **Entry points:** Settings → Phishing (`/phishing-protection`, `authGuard`); a toggle in account security; the inherited warning page `/security/phishing-warning`.
- **Code:** surface `apps/browser/src/privacy/popup/phishing-protection.component.ts`; engine `apps/browser/src/dirt/phishing-detection/`, `libs/common/src/dirt/services/phishing-detection/phishing-detection-settings.service.ts`.
- **Flags:** `black-mask-phishing-protection` (page) and upstream `phishing-detection` (engine), both default on.
- **Decision (2026-11-16):** phishing protection is core safety and free for every account; only enhanced features are premium. Done in PR #15: the engine no longer requires personal premium or a qualifying organization — an active account, the flag, and a non-Safari browser are enough.
- **Unit tests:** `phishing-detection-settings.service.spec.ts` 9 pass (including "no premium or organization required") and `phishing-protection.spec.ts` 3 pass.
- **Browser evidence:** PH-01 pass (page reads Active for a logged-in account); the feed was fetched from `assets.bitwarden.com` after login (ENV-04). Vaultwarden reports every account as premium, so this run cannot show the gate removal; the unit tests do.
- **Not run:** the warning and bypass flow on a known phishing URL; offline behaviour.
- **Severity / effort:** P2 / S. **Disposition / gate:** Keep; verify the warning flow / C. **Security approval:** Not reviewed.

### BM-09 · Data exposure (breach lookup)

- **Promise:** On request, shows known breaches for your email.
- **Entry points:** Settings → Data exposure (`/data-exposure`, `authGuard`), "Check now".
- **Code:** `apps/browser/src/privacy/popup/data-exposure.component.ts`, `privacy/data-exposure.ts`, `privacy/popup/services/data-exposure.service.ts`, `libs/common/src/dirt/services/hibp-api.service.ts`.
- **Backend/remote:** your server's `/api/hibp/breach`, which needs `HIBP_API_KEY` (DEP-05).
- **Unit tests:** `data-exposure.spec.ts` 7 and `data-exposure.service.spec.ts` 2 pass.
- **Browser evidence:** EXP-01 pass — with no key on the server, the page says breach lookup isn't set up.
- **Defects found and fixed (PR #15):** Vaultwarden answers with a placeholder "Manual HIBP Check" entry when it has no key, and the page reported it as "Found in 1 known breaches". The placeholder is now recognized and never counted.
- **Not run:** real breach data (needs a key).
- **Severity / effort:** P2 / human (key). **Disposition / gate:** Configure the key on the hosted backend, or hide the page / F. **Security approval:** Not reviewed.

### BM-10 · AI-generated media detector

- **Promise:** On-device estimate of whether an image or video frame is AI-generated.
- **Code:** `apps/browser/src/privacy/popup/services/ai-media-detector.service.ts` (model `onnx-community/Deep-Fake-Detector-v2-Model-ONNX`, ONNX runtime bundled under `ort/`); needs `wasm-unsafe-eval`.
- **Unit tests:** `ai-media-detector.spec.ts` 9 and `ai-media-detector.service.spec.ts` 11 pass.
- **Browser evidence:** AI-01 pass (page renders). The model download and classification were not exercised: the run blocks network.
- **Severity / effort:** P3 / —. **Disposition / gate:** Keep as a bonus if it passes validation, otherwise hide / F. **Security approval:** Not reviewed.

### BM-11 · Desktop integration permission

- **Promise:** No native-messaging warning at install; "Connect desktop app" requests it on demand.
- **Code:** `apps/browser/src/background/nativeMessaging.background.ts` (`permitted()`), account security component.
- **Unit tests:** `native-messaging.background.spec.ts` 31 and `account-security.component.spec.ts` 24 pass.
- **Browser evidence:** MAN-01, MAN-03 pass; ACC-01 pass (button shown). Clicking it and the browser prompt were not exercised. The background logs a handled `NativeMessagingPermissionError` when account security asks for biometrics status, as designed.
- **Disposition / gate:** Keep / G. **Security approval:** Not reviewed.

### BM-12 · Welcome page (first install)

- **Promise:** First install opens a page inside the extension that says what Black Mask blocks, what it only measures and what it cannot do, then hands off to signup or login.
- **Decision (2026-11-16):** a page bundled with the extension replaces the `bitwarden.com/browser-start/` tab. Done in PR #15.
- **Entry points:** opened on first install (`popup/index.html#/welcome`); unguarded, no flag.
- **Code:** `apps/browser/src/privacy/popup/welcome.component.ts`, `apps/browser/src/platform/services/browser-initial-install.service.ts`; strings `blackMaskWelcome*` in the English locale.
- **Unit tests:** `welcome.component.spec.ts` 3 and `browser-initial-install.service.spec.ts` 10 pass.
- **Browser evidence:** WEL-01 pass (the page opens and renders); ENV-02 pass (no tab outside the extension). Screenshots in light and dark taken during the run.
- **Disposition / gate:** Keep; copy review with product / A, G, H. **Security approval:** Not reviewed.

## Inherited foundation

These come from the Bitwarden fork largely unchanged. They stay release blockers until verified
against the intended backend (pillar A).

### CORE-01 · Account: register, log in, two-step login

- **Browser and backend evidence:** SRV-01, REG-01, LOG-01 pass against the local Vaultwarden. The self-hosted form refuses `http://` URLs, so a self-hosted server must use HTTPS.
- **Not run:** two-step login, passkey and SSO (shown whether or not the backend supports them).
- **Defects:** the signup page links to Bitwarden's terms, privacy policy and email preferences (DEP-07).
- **Disposition / gate:** Verify on the hosted backend / A. **Security approval:** Not reviewed.

### CORE-02 · Lock, unlock, vault timeout

- **Evidence:** LOCK-01 **blocked**. The lock happens (background log `[LockService] Locked user …`), but the extension never came back from the `chrome.runtime.reload()` that locking performs (`main.background.ts:1439-1447`): no new service worker within 60 seconds, pages `ERR_BLOCKED_BY_CLIENT`, with both `--load-extension` and CDP-loaded unpacked extensions. A direct reload recovers in about two seconds. Details in the evidence report.
- **Why P1:** if this reproduces in real Chrome, locking would disable the extension until the browser restarts.
- **Disposition / gate:** Check lock, unlock and logout by hand in Chrome (unpacked and store build) before release / A. **Security approval:** Not reviewed.

### CORE-03 · Vault items and sync

- **Evidence:** VLT-01 pass (item created and listed); SYNC-01 pass (a second fresh profile received the item from the server); the server's `/api/sync` lists the items.
- **Observation:** saving the login item produced a request to `api.pwnedpasswords.com/range/<5-char SHA-1 prefix of the item password>` (DEP-11).
- **Disposition / gate:** Verify on the hosted backend / A. **Security approval:** Not reviewed.

### CORE-04 · Autofill — not run. Content scripts run on every http(s) and file page. Verify / A.

### CORE-05 · Generator and email-alias forwarders — not run. Only the forwarder the user configures is contacted. Verify / D.

### CORE-06 · Send — not run; not in the MVP scope table. Decide whether to keep it visible / H.

### CORE-07 · Import and export — not run. LastPass direct import contacts lastpass.com and identity providers on request. Verify export (pillar G requires it) / G.

### CORE-08 · Self-hosted web vault — not run. `apps/web` builds in CI (`build-web.yml`); no Black Mask features. The local test server served Vaultwarden's own web vault, not this repo's. Verify / A.

### CORE-09 · Premium and billing surfaces

- **What:** the inherited Bitwarden Premium upsell, `/premium` page and premium-gated features.
- **Decision context:** enhancements are one-time purchases with no subscription (2026-11-12), and only enhanced features are premium (2026-11-16). PR #15 removes the premium gate from phishing protection; the other inherited premium and subscription surfaces have not been reviewed against these decisions.
- **Severity / effort:** P2 / M. **Disposition / gate:** Review every premium-gated feature and the upsell copy / G.

## Critical dependencies and launch infrastructure

### DEP-01 · Default server `vault.blackmask.app`

- Every fresh install talks to `https://vault.blackmask.app` (`libs/common/src/platform/services/default-environment.service.ts:85`); ENV-01 confirms it is the default. The domain was unregistered as of 2026-09-25; not rechecked. While unregistered, anyone could register it and receive every default install's logins.
- **Severity:** P0. **Disposition:** Block release until the domain is owned and the server is live (human). **Gate:** A.

### DEP-02 · Welcome tab on install — fixed

- Was: production builds opened `https://bitwarden.com/browser-start/` (ENV-02 failed on 2026-11-15). Now: the bundled welcome page (BM-12); ENV-02 passes.

### DEP-03 · Phishing feed hosted by Bitwarden

- The blocklist downloads from `assets.bitwarden.com`, with a checksum fallback on `raw.githubusercontent.com` (`apps/browser/src/dirt/phishing-detection/phishing-resources.ts:1-5`). ENV-04 shows the fetch after login, not before. The welcome page now discloses where the list comes from.
- **Severity / effort:** P2 / M to self-host. **Disposition:** Keep disclosed for v1; host the list on a Black Mask origin later. **Gate:** C, G.

### DEP-04 · AI model hosted by Hugging Face

- First use of BM-10 downloads weights from huggingface.co. **Severity:** P3. **Disposition:** Self-host the weights before store submission. **Gate:** G.

### DEP-05 · Breach endpoint (`HIBP_API_KEY`)

- BM-09 needs the backend to proxy Have I Been Pwned with a paid key. Without it the page is now honest (EXP-01). **Severity:** P2 / human. **Disposition:** Configure the key or hide BM-09. **Gate:** F.

### DEP-06 · Feature-flag delivery

- Flags come from `/api/config`; all `black-mask-*` flags default on because Vaultwarden does not serve them (TRK-01 shows the default applied). Locally stored overrides take precedence. **Severity:** P3. **Disposition:** Keep.

### DEP-07 · Bitwarden destinations left in the UI

- About → Rate opens Bitwarden's store listings (`apps/browser/src/tools/popup/settings/about-page/about-page-v2.component.ts:19-31`).
- "Download Bitwarden apps" and "More from Bitwarden" are still in Settings.
- Help links go to bitwarden.com/help.
- The signup page links to bitwarden.com/terms, /privacy and /email-preferences (`libs/auth/src/angular/registration/registration-start/registration-start.component.html:35, 61, 70`).
- Static evidence only.
- **Severity / effort:** P1 / M (misattribution; store-review and trademark risk). **Disposition:** Finish now: repoint or hide. **Gate:** G, H.

### DEP-08 · Brand palette

- `--color-primary-*` carries the Black Mask greens; the `--color-brand-*` tokens used by buttons, the wordmark and links are still Bitwarden's blues (`libs/components/src/tw-theme.css:95-106`). THEME-01 partial. **Severity:** P3 / S–M plus contrast checks. **Disposition:** Finish with design review. **Gate:** H.

### DEP-09 · Privacy policy and store listing

- Both stores require a privacy policy URL; none exists. Icons are generated placeholders. **Severity:** P1 / human. **Disposition:** Write and host the policy (include DEP-03 and DEP-11); replace placeholder assets. **Gate:** G.

### DEP-10 · CI health

`main` was red for four separate reasons. PRs #14 and #15 fixed them and were both merged on 2026-11-16; #14 carried the first three fixes.

- **Lint:** six planning docs were not Prettier formatted, and `cargo deny` flagged three advisories in the desktop lockfile. Both fixed. The crypto-bigint advisory is ignored with a written reason that needs sign-off.
- **macOS jobs, retired image:** GitHub retired the `macos-14` runner image on 2026-11-02. Jobs asking for it were cancelled on arrival ("The configuration 'macos-14-arm64-us-default' is not supported"), which failed the "Run tests" gate on every pull request and on `main` with no test failing. This was first misread here as an Actions minutes or spending limit; it was not.
- **macOS jobs, arm64 capacity:** on `macos-15` the jobs were accepted but never started. GitHub cancelled them after 15 to 20 minutes in the queue ("The job was not acquired by Runner of type hosted even after multiple attempts"), including on a re-run, with a notice that macOS arm64 runners are capacity constrained. The three macOS jobs now use the separate `macos-15-intel` pool. Nothing under `apps/desktop/desktop_native` is specific to a macOS CPU architecture, so the same tests run. Move back to `macos-15` when arm64 capacity recovers.
- **Nx affected job:** on a pull request that touches shared code it ran about 100 build, lint and test tasks four at a time and starved the runner ("The hosted runner lost communication with the server" after 65 and 77 minutes). It now runs one task at a time with two Jest workers; the same run on a 4-core, 15 GB machine took 34 minutes for build and lint at a 12 GB peak. The job is experimental and non-gating, and still tolerates six failing tasks that are tooling configuration, not product defects: five library builds fail with TS5055 (output would overwrite input), and the desktop package's per-project lint cannot resolve the Tailwind config.
- **Desktop build:** the desktop main process did not compile on `main` from PR #11 until PR #15 (TS7018 in `apps/desktop/src/main/native-messaging.main.ts`). Nothing gated on it: there is no desktop build workflow, Jest does not type-check, and the Nx job, the only one that builds desktop, ignores failures.
- **Severity:** P2 / S. **Disposition:** Fixes merged on 2026-11-16. Still to decide: whether a desktop build should gate while desktop is not a shipping surface.

### DEP-11 · Third-party requests after login

- After login the run saw two third-party hosts (ENV-04):
  - `assets.bitwarden.com`: the phishing feed (DEP-03).
  - `api.pwnedpasswords.com`: the first five characters of an item password's SHA-1, Have I Been Pwned's k-anonymity range API. The only caller is the item form's Check password action (`libs/vault/src/cipher-form/components/login-details-section/login-details-section.component.ts:271-278`); the trigger in this run is unconfirmed.
- **Severity / effort:** P2 / S. **Disposition:** Confirm the trigger; disclose both in the privacy policy. **Gate:** G.

## Documentation drift

Fixed in PR #15:

- The phishing "Unavailable until the upstream flag is delivered" text in `features.md` and `browser-validation.md`.
- The missing `/edit-persona` route in `features.md`.
- Data exposure "degrades to an error card".

Still open (code and docs disagree):

1. `features.md` says the tracker factor gets full marks "when tracker blocking is enabled"; the code uses the flag value (BM-01).
2. `features.md` says the dashboard links out to the other tools; it links only to the AI media detector.
3. `main.background.ts:1767-1768` says Firefox builds lack the DNR permission; Firefox MV3 grants it.

## Next steps for the register

1. **Lock and unlock by hand** in Chrome, unpacked and store build (CORE-02, P1).
2. **Firefox MV3:** containers (BM-06), blocking (BM-03), and a full pass of the logged-in items.
3. **Remaining logged-in items:** persona custom fields and alias warning, the phishing warning flow, account-audit counts, autofill, export.
4. **Bounded fixes:** BM-01 (score truthfulness) and DEP-07 (Bitwarden destinations).
5. **Human gates:** DEP-01, DEP-05, DEP-09, and sign-off on the crypto-bigint ignore (DEP-10).
