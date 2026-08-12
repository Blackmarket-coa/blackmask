# Black Mask — Feature Reference

The complete reference for every Black Mask feature implemented in this repository: what it does,
how to reach it, which flag gates it, where the code lives, its privacy posture, and its current
limitations. The [engineering execution plan](./engineering-execution-plan.md) explains _why_ the
features are built this way; this document describes _what exists_.

All features live in the **browser extension** (`apps/browser`). The v1 milestones M0–M4 from the
execution plan (§8) are feature-complete, plus one addition beyond the original plan (the AI
media detector).

## Summary

| Feature                     | Route                          | Feature flag                     | Landed in                                                     |
| --------------------------- | ------------------------------ | -------------------------------- | ------------------------------------------------------------- |
| Privacy dashboard & score   | `/privacy-dashboard`           | `black-mask-privacy-dashboard`   | [#2](https://github.com/Blackmarket-coa/blackmask/pull/2), #3 |
| Persona vault               | `/personas`, `/create-persona` | `black-mask-persona-vault`       | [#2](https://github.com/Blackmarket-coa/blackmask/pull/2)     |
| Tracker detection           | `/trackers`                    | `black-mask-tracker-detection`   | [#2](https://github.com/Blackmarket-coa/blackmask/pull/2), #3 |
| Fingerprint exposure test   | `/fingerprint`                 | `black-mask-fingerprint-test`    | [#3](https://github.com/Blackmarket-coa/blackmask/pull/3)     |
| Data exposure dashboard     | `/data-exposure`               | `black-mask-data-exposure`       | [#4](https://github.com/Blackmarket-coa/blackmask/pull/4)     |
| Per-persona containers      | `/persona-containers`          | `black-mask-persona-containers`  | [#5](https://github.com/Blackmarket-coa/blackmask/pull/5)     |
| Phishing protection surface | `/phishing-protection`         | `black-mask-phishing-protection` | [#6](https://github.com/Blackmarket-coa/blackmask/pull/6)     |
| AI-generated media detector | `/ai-media-detector`           | `black-mask-ai-media-detector`   | [#7](https://github.com/Blackmarket-coa/blackmask/pull/7)     |

Every route is registered in `apps/browser/src/popup/app-routing.module.ts`, guarded by
`authGuard` + `canAccessFeature(<flag>)`, and reachable from a matching entry on the extension's
**Settings** page (`apps/browser/src/tools/popup/settings/settings-v2.component.ts`), which is
itself hidden unless the corresponding flag is on.

## Feature flags — and how to turn them on

All eight flags are declared in `libs/common/src/enums/feature-flag.enum.ts` under the
`/* Black Mask */` group, and all **default to `true`** in `DefaultFeatureFlagValue`:

`black-mask-privacy-dashboard`, `black-mask-persona-vault`, `black-mask-tracker-detection`,
`black-mask-fingerprint-test`, `black-mask-data-exposure`, `black-mask-persona-containers`,
`black-mask-phishing-protection`, `black-mask-ai-media-detector`.

Resolution: `ConfigService` reads `featureStates` from the backend's `/config` endpoint; when the
server doesn't state a flag, the client falls back to `DefaultFeatureFlagValue` (see
`getFeatureFlagValue` in the same file).

**The "feature-flag delivery" question from the execution plan (§6, §9) is resolved: defaults are
on.** Black Mask ships against a self-hosted Vaultwarden, which does not serve `featureStates`, so
an off-by-default flag would make every feature invisible in production. A backend that does serve
`/config` can still override any of them.

The phishing protection surface additionally depends on the upstream `phishing-detection` flag,
which gates the detection engine itself. That flag is enabled for the same reason — otherwise the
page correctly but uselessly reports "Unavailable".

These are runtime feature flags, not the compile-time `flags`/`devFlags` mechanism in
`apps/browser/config/*.json` — the Black Mask flags have no entries there.

## Code layout

All net-new code is app-local under `apps/browser/src/privacy/`, per the execution plan (§5):

- **`privacy/*.ts`** — pure, framework-free logic modules, each with a co-located `*.spec.ts`.
  This is where the testable core of every feature lives.
- **`privacy/popup/*.component.{ts,html}`** — standalone, OnPush Angular popup pages.
- **`privacy/popup/services/*.service.ts`** — popup-injectable services bridging the pure modules
  to vault data, browser APIs, and backend calls.
- **`privacy/background/`** — service-worker-side code (tracker counting).
- **`privacy/trackers/`** — the tracker blocklist, matcher, count store, and DNR ruleset.

Everything below cites exact paths relative to `apps/browser/src/` unless noted.

---

## Privacy dashboard & privacy score

**What it does.** The `/privacy-dashboard` page aggregates local signals into a single privacy
score with a per-factor breakdown, and links out to the other tools.

**Scoring** (`privacy/privacy-score.ts`, pure `computePrivacyScore`): five always-present factors
worth 250 points, plus a sixth worth 50 that appears only once measured, shown as a percentage —

| Factor              | Points                       | Full marks when                                |
| ------------------- | ---------------------------- | ---------------------------------------------- |
| Tracker protection  | 50                           | tracker blocking is enabled                    |
| Personas            | 10 per persona, capped at 50 | at least one persona exists                    |
| Reused passwords    | 50                           | zero reused login passwords                    |
| Weak passwords      | 50                           | zero weak passwords (zxcvbn score ≤ 2 is weak) |
| 2FA gaps            | 50                           | zero logins on 2FA-capable sites lacking TOTP  |
| Browser fingerprint | 50 (omitted until measured)  | ≤ 20 bits of estimated entropy                 |

**The fingerprint factor is conditional on purpose.** When the user has never run the fingerprint
test, the factor is left out of both `score` and `max` rather than scored zero — otherwise an
unmeasured browser would look identical to a fully-exposed one and the percentage would drop the
moment the feature shipped. Once measured, it ramps linearly: full points at or below 20 bits, none
at or above 35, matching the thresholds the fingerprint page itself reports so the two never
disagree. The measurement is read from a session-storage cache
(`privacy/fingerprint-exposure-store.ts`) that the fingerprint page writes, because re-running the
probes on every dashboard open would be expensive.

**Account-security factors** (`privacy/account-audit.ts` + `popup/services/account-audit.service.ts`)
are computed on-device over already-decrypted cipher views: `countReusedPasswords`,
`countWeakPasswords` (reuses Bitwarden's `PasswordStrengthService`/zxcvbn), and
`countTwoFactorGaps` matched against a bundled, clean-room seed list of 37 2FA-capable domains
(`privacy/two-factor-sites.ts`).

**Privacy posture.** Entirely on-device; no vault data leaves the client and nothing is logged.

**Limitations.** The 2FA-capable list is a 37-domain seed — production intent is to sync a full
list from the backend.

**Tests.** `privacy-score.spec.ts` (13), `account-audit.spec.ts` (13),
`fingerprint-exposure-store.spec.ts` (2).

---

## Tracker detection

**What it does.** Blocks requests to known tracker domains and counts tracker hits per tab; the
`/trackers` page shows protection status, the live count for the current tab, and the full
blocklist.

**How it works.**

- **Blocklist** — `privacy/trackers/tracker-blocklist.ts`: 20 tracker/analytics domains
  (google-analytics.com, doubleclick.net, connect.facebook.net, hotjar.com, mixpanel.com, …).
  The matcher (`tracker-matcher.ts`) also matches subdomains.
- **Blocking** — a static `declarativeNetRequest` ruleset (`privacy/trackers/trackers.dnr.json`,
  one block rule listing the 20 domains), registered in `manifest.v3.json` as ruleset id
  `black-mask-trackers` with `enabled: false`. On startup,
  `MainBackground.syncTrackerProtection()` (`background/main.background.ts`) enables or disables
  the ruleset to match the `black-mask-tracker-detection` flag. Webpack copies the ruleset into
  the build (`apps/browser/webpack.base.js`).
- **Per-tab counting** — `initTrackerCounting()` (`privacy/background/tracker-count.background.ts`)
  listens to `webRequest.onCompleted`/`onErrorOccurred`, resets on `webNavigation.onCommitted`,
  and mirrors the in-memory `TrackerCountStore` into `chrome.storage.session` under the key
  `blackMaskTrackerCounts`, where the popup's `TrackerCountService` reads it.

**Privacy posture.** Blocking and counting are fully local; the blocklist ships with the
extension, so no per-session list fetches.

**Limitations.** MV3/Chromium-focused: the MV2 manifest has no DNR block, so Firefox MV2 builds get
counting but not DNR blocking. The 20-domain list is a curated seed — the execution plan's
endgame is dynamic rules fed by hosted filter lists (§9). Runtime blocking behavior needs
validation in a real browser; it can't be exercised by jest.

**Tests.** `tracker-matcher.spec.ts` (8), `tracker-count-store.spec.ts` (5).

---

## Persona vault

**What it does.** Create and manage separate identities ("personas") for different contexts, built
directly on the vault: `/personas` lists them, `/create-persona` creates one.

**How it works** (`popup/services/persona.service.ts`). A persona **is** a standard `Identity`
cipher — the key reuse decision from the execution plan (§4), which means sync, encryption, and
autofill all come for free. The persona's **layer** — one of `Real`, `Business`, `Creator`,
`Anonymous` — is stored as a custom text field named `Black Mask Layer` on the cipher.
`createPersona` builds the `IdentityView` (name, optional email/notes); `generateAlias` requests
an email alias through the existing credential-generator forwarder integrations (whichever
forwarder the user configured, e.g. self-hosted SimpleLogin), tagged with source
`black-mask-persona`. `personas$()` streams non-deleted Identity ciphers carrying a valid layer
field.

**Editing** (`popup/edit-persona.component.ts`). Rows open `/edit-persona`, which understands the
persona concepts a raw cipher view does not — the layer as a picker rather than a text field, and
alias generation inline. `updatePersona` replaces only the `Black Mask Layer` field and preserves
every other custom field, and refuses outright (`PersonaNotEditableError`) when the underlying
cipher is not editable, because the vault's update path silently degrades those to a partial
request that would drop the changes while reporting success.

**Alias separation warning.** `aliasForwarded()` reads the configured email algorithm and both
persona screens warn when it is not a forwarder. This matters because the two built-in email
algorithms stay on the user's own domain: `plusAddress` yields `you+tag@yours`, which strips back
to the real mailbox, and `catchall` yields `random@yours`, which links every persona to one domain.
Either one gives a persona an email that points back at its owner — the opposite of what a layer
implies. Black Mask does not force a vendor (that would break users on Addy, Fastmail, Firefox
Relay or DuckDuckGo); it states the consequence and leaves the choice alone. The check fails
closed: an unreadable preference warns rather than claims separation it could not verify.

**Privacy posture.** Persona data is vault data — encrypted client-side and synced through the
existing pipeline. Alias generation goes only to the user's configured forwarder.

**Limitations.** Bio/avatar generation (backend inference) is not wired — those are sibling-repo
contracts.

**Tests.** `persona.service.spec.ts` (17).

---

## Per-persona browsing containers

**What it does.** Gives each persona layer its own isolated browsing container (separate cookies),
so personas can't be linked by shared browser state. `/persona-containers` lists the four layers
with persona counts and opens an isolated tab per layer.

**How it works.** `privacy/persona-container.ts` maps each layer to a Firefox contextual-identity
descriptor — name `Black Mask — <Layer>` plus a distinct color/icon per layer (Real =
blue/fingerprint, Business = orange/briefcase, Creator = purple/pet, Anonymous = toolbar/fence).
Three additions to `BrowserApi` (`platform/browser/browser-api.ts`) wrap the WebExtensions APIs:
`supportsContainers()`, `getOrCreateContainer(name, color, icon)`, and
`createNewContainerTab(cookieStoreId, url?)`. The `contextualIdentities` permission is declared in
the Firefox section (`__firefox__permissions`) of `manifest.v3.json` only.

**Privacy posture.** Only the container name/color/icon reach the browser API — no vault data.

**Limitations.** **Firefox-only** — Chromium has no `contextualIdentities`; the page degrades to a
"requires Firefox" notice. A Chromium cookie-partitioning strategy is an open item in the
execution plan (§9). Container runtime behavior needs a real Firefox load to validate.

**Tests.** `persona-container.spec.ts` (4).

---

## Fingerprint exposure test

**What it does.** Estimates how identifiable the browser is to fingerprinting, as total entropy
bits with a per-signal breakdown and an exposure level. Lives at `/fingerprint`.

**How it works.** `FingerprintService` (`popup/services/fingerprint.service.ts`) collects 14
signals on demand — user agent, canvas hash, fonts, WebGL vendor/renderer, screen resolution,
timezone, audio hash, hardware concurrency, platform, languages, device memory, pixel ratio, color
depth, touch support. The pure `estimateFingerprintEntropy` (`privacy/fingerprint.ts`) assigns
each revealed signal a max-bits weight (user agent 10, canvas 8, fonts 7, WebGL 6, …) and maps the
total to an exposure level: ≥ 35 bits High, ≥ 20 Medium, else Low.

**Privacy posture.** Everything stays on-device; signals are measured, scored, and displayed —
never transmitted.

**Feeds the privacy score.** Running the test caches its entropy total, which the dashboard picks
up as a sixth score factor (see above). Note what this factor does and does not claim: Black Mask
measures fingerprint entropy, it does not reduce it. The factor still responds to real user action
— Firefox's `resistFingerprinting`, Tor Browser, disabling canvas readback — which is why it is
scored on a ramp rather than awarded for merely having run the test.

**Limitations.** Probes currently run in the popup context; moving them to a content script would
give page-context accuracy. The cache is session-scoped, so the factor disappears again after a
browser restart until the test is re-run. The canvas/WebGL/audio/font probes need manual browser
validation.

**Tests.** `fingerprint.spec.ts` (6).

---

## Data exposure dashboard

**What it does.** Shows which known data breaches include the user's account email: breach count,
total accounts affected, which data classes were exposed, and a newest-first breach list. Lives at
`/data-exposure`.

**How it works.** A "Check now" button calls `DataExposureService.checkBreaches(email)`
(`popup/services/data-exposure.service.ts`), which wraps the existing
`AuditService.breachedAccounts` → `GET /hibp/breach?username=…` against **the user's own
authenticated backend**. The pure `summarizeBreaches` (`privacy/data-exposure.ts`) aggregates the
response.

**Privacy posture.** The lookup runs **only on explicit user action**. The email goes only to the
user's own backend — never a third party. No breach data or email is logged. Password-exposure
checking (k-anonymity) is deliberately out of scope here (it belongs to the account audit).

**Limitations.** Self-hosted Vaultwarden may not implement `/hibp/breach`; the page degrades to an
error card. The richer backend "exposure index" from the plan is a sibling-service contract.

**Tests.** `data-exposure.spec.ts` (5).

---

## Phishing protection surface

**What it does.** A control/visibility page (`/phishing-protection`) for the phishing-detection
engine: shows whether protection is Active / Off / Unavailable and lets the user toggle it.

**How it works.** The detection engine itself is the upstream DIRT engine that already ships in
this codebase (`dirt/phishing-detection/` — a background `webNavigation` listener checking a
downloaded blocklist and showing a warning page). Black Mask adds the pure `phishingStatus`
helper (`privacy/phishing-protection.ts`) and a page consuming the engine's popup-injectable
settings abstraction (`PhishingDetectionSettingsServiceAbstraction`: `available$`, `enabled$`,
`setEnabled`).

**Privacy posture.** Detection runs locally against a downloaded blocklist; this page adds no new
detection and sends nothing about visited sites anywhere.

**Limitations.** The engine's `available$` is gated by the separate upstream `phishing-detection`
flag (and returns unavailable on Safari), so the page honestly reports "Unavailable" until that
flag is delivered too. A live "is the current tab phishing?" indicator would need a new background
message handler — an explicit follow-up.

**Tests.** `phishing-protection.spec.ts` (3).

---

## AI-generated media detector

**What it does.** Estimates whether an image or short video is AI-generated/deepfake, entirely
on-device. `/ai-media-detector` offers a file picker/drag-drop, shows model-download and per-frame
progress, and renders a verdict with a per-frame breakdown.

**How it works.** `AiMediaDetectorService` (`popup/services/ai-media-detector.service.ts`) lazily
loads a ViT deepfake classifier — model `onnx-community/Deep-Fake-Detector-v2-Model-ONNX`
(Apache-2.0) — via `@huggingface/transformers` (v3.8.1) running on ONNX Runtime Web. The wasm
runtime is **bundled with the extension** (webpack copies it into `ort/`, exposed through
`web_accessible_resources`; CSP allows `wasm-unsafe-eval`; single-threaded). Model **weights** are
fetched once from Hugging Face and cached by the browser. Videos are sampled at up to 16 evenly
spaced frames, downscaled to ≤ 512 px. The pure `aggregateVerdict` (`privacy/ai-media-detector.ts`)
takes the **max** deepfake probability across frames: ≥ 0.7 → Likely AI, ≥ 0.4 → Uncertain,
below → Likely Authentic.

**Privacy posture.** The analyzed media never leaves the browser — only the model weights are
downloaded (once). The page carries on-device and accuracy disclaimers.

**Limitations.** First run requires network access to Hugging Face for the weights. Detector
accuracy is inherently probabilistic — the verdict is labeled as an estimate, not proof.

**Tests.** `ai-media-detector.spec.ts` (9), `ai-media-detector.service.spec.ts` (11).

---

## Cross-cutting reference

**Identifiers worth knowing** (for debugging and follow-up work):

| What                       | Value                    |
| -------------------------- | ------------------------ |
| DNR ruleset id             | `black-mask-trackers`    |
| Session-storage key        | `blackMaskTrackerCounts` |
| Persona layer field name   | `Black Mask Layer`       |
| Container name format      | `Black Mask — <Layer>`   |
| Alias generator source tag | `black-mask-persona`     |
| ONNX runtime path          | `ort/` (web-accessible)  |

**i18n.** 102 `blackMask*` keys in `apps/browser/src/_locales/en/messages.json`, grouped by
feature (`blackMaskFp*`, `blackMaskAiMedia*`, `blackMaskPhishing*`, `blackMaskExposure*`,
`blackMaskContainer*`, `blackMaskScore*`, `blackMaskTracker*`, `blackMaskLayer*`, persona keys).
Per repo convention, only the `en` locale is edited by hand.

**Testing.** Each feature's logic core is a pure module with co-located jest specs — 60 privacy
tests plus 15 service tests at the time of writing. Browser-runtime behavior (DNR blocking,
webRequest counting, contextualIdentities, fingerprint probes, wasm inference) requires loading
the unpacked extension; jest cannot exercise it.

**Vendored references.** `third_party/` holds full-source snapshots of the open-source projects in
the Black Mask build map (uBlock Origin, PrivacyBadger, CanvasBlocker, Multi-Account Containers,
SimpleLogin, mat2, vaultwarden, …) for reference and clean-room study only — excluded from the
build, never imported. See [`third_party/README.md`](../../third_party/README.md) for the
inventory, pinned commits, and license cautions.

**Branding.** The extension's user-facing branding (manifests, locales, icons, shared SVG marks)
is Black Mask, with generated placeholder icon assets — see [`branding.md`](./branding.md).
