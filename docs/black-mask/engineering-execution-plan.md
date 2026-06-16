# Black Mask — Engineering Execution Plan

> How the Black Mask product spec maps onto _this_ Bitwarden clients codebase: what to reuse, what to
> build, where it lives, and in what order. This is an architecture/planning document — it prescribes
> approach and sequencing; it is not itself an implementation.

---

## 1. Product context

Black Mask is the privacy and counter-surveillance layer of a larger ecosystem (alongside Blackout, a
community platform, and FBM, an economic platform). It is a **standalone product**: a user can install
it, never touch the coalition, and get real protection. Coalition/Blackout features are a later
_upgrade tier_, never a launch prerequisite.

The architecture is **login-once, protected-everywhere** — the Bitwarden auth + vault + sync spine,
reused as-is. One account drives protection across every surface tied to it.

**v1 surface (locked): browser extension + Android app, together. No local VPN.**

- **Extension** (this repo) — tracker/fingerprint defense, personas, form-fill, in-page visibility.
- **Android app** (sibling repo) — persona vault + autofill keyboard, device/IOC scanner, privacy
  score, exposure dashboard, metadata tools, and system-wide DNS blocking via guided Private DNS
  (no `VpnService`).
- **Backend** (sibling services) — auth/vault sync, aliases, hosted inference, IOC-feed pipeline.

Later phases (Connect — coalition intelligence; Route — VPN/desktop agent/exit nodes) are sketched in
§3 but not planned in depth here.

---

## 2. Architecture & repo boundary

This is the single most important framing for anyone executing this plan.

### What lives in THIS repo (`clients`)

The v1 browser **extension** (`apps/browser`) is the surface that ships from here. It builds on shared
libraries that are reused unchanged or extended narrowly:

| Concern             | Location                                     | v1 posture                                                     |
| ------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| Auth / vault / sync | `libs/common`                                | **Reuse as-is** — the login-once spine.                        |
| Persona vault       | `libs/common/src/vault`, `libs/vault`        | **Reuse the `Identity` cipher** (see §4).                      |
| Email aliasing      | `libs/tools/generator`                       | **Reuse** the existing forwarder integrations (see §3).        |
| Privacy features    | `apps/browser/src/privacy/` (new)            | **Net-new**, app-local first (tracker/fingerprint/containers). |
| Feature gating      | `libs/common/src/enums/feature-flag.enum.ts` | Extend with `black-mask-*` flags.                              |

Desktop, web, and CLI inherit shared-lib changes but are **not** v1 priorities.

### Sibling repos (client-contract level only)

These are referenced by their interfaces; their internals are out of scope for this repo's plan.

- **`bitwarden/android`** — Android app (persona vault, autofill keyboard, Private-DNS blocking,
  on-demand IOC scan).
- **`vaultwarden`** — API-compatible sync backend for vault/persona data.
- **New backend services** — persona-bio inference, IOC-feed pipeline, SAR automation, exposure
  index, self-hosted SimpleLogin.

### Out of scope for v1

Android local VPN (`VpnService`), the desktop network agent, and iOS/macOS Network Extensions. These
are the heaviest, highest-liability pieces and belong to later phases.

### License boundary (sets the commercial model)

Every forked client is GPL/AGPL copyleft, so **the forked client code stays GPLv3**. The proprietary
moat therefore cannot live in the client — it lives in the backend services, inference, IOC pipeline,
hosted sync, and brand. In practice: consume filter-list / IOC feeds as **data**, and **clean-room**
any heuristic/matcher whose upstream license forbids commercial bundling (notably MVT). Never copy
non-GPL-compatible code into this repo.

---

## 3. Feature → subsystem map

Each spec feature, mapped to a concrete subsystem and tagged by where the work lands. **Reuse** = the
capability mostly exists; **New (ext)** = net-new in this repo's extension; **Sibling** = Android
and/or backend repos; **Later** = post-v1 phase.

### Phase 1 — See (visibility & personal security)

| Feature                        | Maps to                                                                                                            | Tag                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------- |
| Tracker Detection              | `apps/browser/src/privacy/` background using `declarativeNetRequest` + filter-list data; per-tab counts → popup    | New (ext)           |
| Fingerprint Exposure Test      | Content-script API probes + entropy scoring; feeds Privacy Score                                                   | New (ext)           |
| Phishing & Scam Inspector      | On-device link/domain checks (content script + background); shares signals to the Phase 4 feed                     | New (ext)           |
| Account Security Audit         | **Reuse** vault-health reports (`apps/web/src/app/dirt/reports/`) + HIBP breach models (`libs/common/src/dirt/`)   | Reuse               |
| Data Exposure Dashboard        | **Reuse** breach data (`libs/common/src/dirt/models/response/breach-account.response.ts`) + backend exposure index | Reuse + Sibling     |
| Privacy Score                  | Aggregate UI over local signals (fingerprint, tracker counts, account audit) + backend index                       | New (ext) + Sibling |
| Device Security Scanner        | Android app artifact/permission scan                                                                               | Sibling             |
| Permission & Sensor Auditor    | Android access-timeline (camera/mic/location/clipboard)                                                            | Sibling             |
| Compromise Detection (spyware) | Android on-demand IOC scan + opt-in DNS-level C2 flag; fed by backend IOC pipeline (full live tripwire is Phase 5) | Sibling             |

### Phase 2 — Separate (identity & obfuscation)

| Feature                 | Maps to                                                                                                                             | Tag             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Identity Firewall       | **Reuse** `Identity` ciphers; the Real/Business/Creator/Anonymous layers map to folders + a tag (§4)                                | Reuse           |
| Persona Generator       | **Reuse** `Identity` ciphers as the container; bio/avatar from the backend inference endpoint                                       | Reuse + Sibling |
| Alias Management        | **Reuse** the SimpleLogin forwarder (`libs/tools/generator/core/src/integration/simple-login.ts`) pointed at a self-hosted instance | Reuse           |
| Compartmentalization    | Container-per-persona via `chrome.cookies` (Chromium) / `contextualIdentities` (Firefox)                                            | New (ext)       |
| Metadata Reduction      | Backend perturbation pipeline (mat2/ExifTool) + a client strip-on-share UX                                                          | Sibling         |
| Image De-identification | Backend Fawkes-style perturbation + client UX                                                                                       | Sibling         |

### Phase 3 — Resist (active defense, lawful only)

| Feature                                    | Maps to                                              | Tag       |
| ------------------------------------------ | ---------------------------------------------------- | --------- |
| Data Collection Visibility                 | Extension surfacing of who-collects-what             | New (ext) |
| Data Broker Monitoring & Removal           | Backend SAR automation + client status UX            | Sibling   |
| Tracker Poisoning (opt-in, off by default) | Extension noise modules (AdNauseam/TrackMeNot-style) | New (ext) |
| AI Scraping Defense                        | Backend content-poisoning pipeline                   | Sibling   |

### Phase 4 — Connect, & Phase 5 — Route (sketched)

Coalition intelligence (trust web, threat feed, reputation, federated identity) and the network layer
(local VPN, desktop filtering, remote/coalition VPN, onion routing) are **multiplayer or
network-level** features. The client consumes them over HTTP and gates them behind a coalition
account; none block v1. The full live C2 tripwire (IP + TLS SNI) ships with the Android VPN in
Phase 5.

---

## 4. Persona vault deep-dive

**Decision: reuse the existing `Identity` cipher type (value 4). Do _not_ add a new cipher type for
v1.**

### Why reuse Identity

The `Identity` cipher already models a person:

```
title, firstName, middleName, lastName, company, email, phone, username,
address1, address2, address3, city, state, postalCode, country,
ssn, passportNumber, licenseNumber
```

(`libs/common/src/vault/models/domain/identity.ts`, with matching `data` / `view` / `api` models.)

It also **already autofills** — `generateIdentityFillScript` in
`apps/browser/src/autofill/services/autofill.service.ts` maps these fields to web-form fields using
the keyword lists in `apps/browser/src/autofill/services/autofill-constants.ts`. The spec's framing —
"the persona engine is a reskin of the vault … so the hard crypto / sync / autofill work comes for
free" — _is_ this reuse.

Reuse gives us:

- **Zero new encryption logic**, honoring the root `CLAUDE.md` rule ("new encryption logic should not
  be added to this repo").
- **Zero SDK/server/Vaultwarden changes** — Identity already round-trips through sync and the SDK.
- **Autofill for free** — personas fill forms the day they exist.

### How personas layer on top

A "persona" is an `Identity` cipher plus presentation/metadata:

- **Identity Firewall layers** (Real / Business / Creator / Anonymous) → folders (or collections),
  plus an optional tag/custom-field so a persona's layer is queryable.
- **Generated bio / avatar** (from the backend inference endpoint) → stored in the cipher's notes,
  custom fields, and/or an attachment for v1. No schema change required.
- **Aliases** → a persona's email/username fields are populated from the alias generator (§3), tying
  the persona to a forwarding address rather than the user's real contact info.

### The deferred alternative

If personas later need first-class fields that `Identity` cannot represent, add a dedicated `Persona`
cipher type (next free value is `9`). This is a **heavy, cross-repo** effort — SDK Rust changes,
server/Vaultwarden changes, and ~30 client files across the five model layers and all the container
switches. Follow `docs/cipher-types.md` and use the `cipher-type-planner` skill
(`.claude/skills/cipher-type-planner/SKILL.md`) when that time comes. It is explicitly **not** v1.

---

## 5. Browser extension integration points

All net-new privacy code is **app-local first**, under a new `apps/browser/src/privacy/` tree
(background services, content scripts, popup screens). Promote to a `libs/` only when a second client
needs it, using the `@bitwarden/nx-plugin:basic-lib` generator
(`libs/nx-plugin/src/generators/basic-lib.ts`).

### Manifest & permissions

The extension is Manifest V3 (`apps/browser/src/manifest.v3.json`; an MV2 variant also exists). It
already declares `webRequest` (used only for HTTP-auth today). Black Mask adds:

- **`declarativeNetRequest`** (+ `_resources` rulesets) for tracker/request blocking. Prefer this
  over blocking `webRequest`, which MV3 does not support for blocking.
- **`cookies`** for Chromium container isolation. (`contextualIdentities` is Firefox-only and is
  declared/used only in the Firefox build.)

### Background (service worker)

The background entry is `apps/browser/src/platform/background.ts` →
`apps/browser/src/background/main.background.ts`. The existing
`apps/browser/src/autofill/background/web-request.background.ts` (HTTP-auth listener) is the **pattern
reference** for a new `privacy.background.ts` that owns `declarativeNetRequest` rules, tracker
counting, and cookie/container management.

### Content scripts

Content scripts run **outside Angular** — vanilla/Lit, direct `chrome.*` calls, manual cleanup (see
`.claude/rules/autofill-content-scripts.md`). The autofill content pipeline
(`apps/browser/src/autofill/content/`) is the model. Fingerprint-API patching and in-page visibility
UI are content scripts.

### Popup UI

Add a privacy dashboard screen by registering a route in
`apps/browser/src/popup/app-routing.module.ts` and wiring the component into
`apps/browser/src/popup/app.module.ts`, following the existing tab structure. Tailwind classes **must**
use the `tw-` prefix; Angular DI uses `inject()` + `safeProvider()`.

### Messaging

Content script ↔ background ↔ popup uses `chrome.runtime` messaging, with
`apps/browser/src/platform/browser/zoned-message-listener.service.ts` bringing messages into the
Angular zone for popup consumers.

---

## 6. Backend & sync contracts

Black Mask runs against a **self-hosted, API-compatible backend** (Vaultwarden for sync, plus new
services). The client side is mostly configuration + reuse.

### Pointing the client at the backend

`EnvironmentService` (`libs/common/src/platform/abstractions/environment.service.ts`) already supports
self-hosting: `setEnvironment(Region.SelfHosted, urls)` sets `api` / `identity` / `webVault` /
`events` URLs. No new code is needed to target a Black Mask / Vaultwarden server — only wiring it into
onboarding.

### Sync

Persona data **is** Identity-cipher data, so it syncs through the existing path:
`ApiService.getSync()` → `CoreSyncService.fullSync()`
(`libs/common/src/platform/sync/core-sync.service.ts`). No new sync plumbing for v1.

### New backend services (client-facing contracts)

| Service                 | Client expects                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Persona-bio inference   | HTTP endpoint returning a synthetic bio/avatar for a persona; results stored on the Identity cipher |
| IOC-feed pipeline       | A compact, **signed** indicator bundle the app syncs (consumed by Android/desktop)                  |
| Exposure index          | Breach/exposure lookups feeding the Data Exposure Dashboard + Privacy Score                         |
| SAR automation          | Data-broker opt-out request submission + status                                                     |
| Self-hosted SimpleLogin | Alias creation API (already spoken by the existing forwarder integration)                           |

### Feature-flag delivery (a real dependency)

Flags are normally served by the backend `/config` endpoint and read via `ConfigService`. A
self-hosted Vaultwarden may not serve them, so plan for **either** teaching the backend to return
`black-mask-*` flag states **or** relying on client-side `DefaultFeatureFlagValue` + dev overrides.
Pick this before M0 ends (see §9 risks).

---

## 7. Cross-cutting conventions & licensing checklist

New work in this repo must follow these — most are enforced by config and the root `CLAUDE.md`.

- **Feature flags** — every Black Mask feature gates behind a `black-mask-*` flag in
  `libs/common/src/enums/feature-flag.enum.ts` (+ `DefaultFeatureFlagValue`), checked with
  `ConfigService.getFeatureFlag$()`.
- **State** — persist via `StateProvider` + `UserKeyDefinition` (or `KeyDefinition` for global), with
  `clearOn: ["logout"]` for anything user-scoped (`libs/state`).
- **No new encryption** in this repo; never send unencrypted vault data to APIs; never log decrypted
  data, keys, or PII.
- **Placement** — as deep and as narrow as possible; app-local before shared `libs/`.
- **Angular** — `inject()` over constructor injection; `safeProvider()` for providers; Tailwind `tw-`
  prefix; content scripts are non-Angular.
- **i18n** — user-facing strings via `I18nService` / `i18n` pipe; add keys to **each app's**
  `en/messages.json` only (Crowdin handles the rest).
- **Licensing** — client stays GPLv3; consume feeds as data; clean-room non-commercial matchers; keep
  the proprietary moat in the backend.

---

## 8. v1 build sequencing (this repo)

Each milestone ships behind its own `black-mask-*` flag, so partial progress is shippable and
reversible.

| Milestone                                | Scope                                                                                                                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M0 — Foundations**                     | Add `black-mask-*` flags; scaffold `apps/browser/src/privacy/`; add a privacy-dashboard route shell; verify self-host/Vaultwarden env config + decide feature-flag delivery (§6). |
| **M1 — Persona vault**                   | Identity-reuse persona UX (layers via folders + tag; bio/avatar via backend inference); alias integration (SimpleLogin self-host). Autofill already works.                        |
| **M2 — Tracker detection**               | `declarativeNetRequest` + filter-list data; per-tab tracker counts; in-page visibility UI.                                                                                        |
| **M3 — Fingerprint & score**             | Fingerprint exposure test (content-script probes + entropy); Privacy Score aggregation over local + backend signals.                                                              |
| **M4 — Compartmentalization & exposure** | Container-per-persona (cookies/contextualIdentities); phishing inspector; data-exposure dashboard reusing `dirt` reports + HIBP.                                                  |

---

## 9. Risks & open problems

- **Persona-as-Identity field gaps** — bio/avatar have no native Identity field. v1 stores them in
  notes/custom-fields/attachment; revisit a dedicated `Persona` cipher type only if that proves
  insufficient (§4).
- **MV3 `declarativeNetRequest` limits** — static rulesets are capped. Use dynamic rules + hosted
  list updates so blocklists refresh without an extension release.
- **Self-hosted feature-flag delivery** — Vaultwarden may not serve `/config` flags; resolve in M0
  (§6).
- **Chromium vs Firefox containers** — `contextualIdentities` is Firefox-only; Chromium needs a
  cookie-partitioning strategy. Per-browser implementation behind one abstraction.
- **Cross-repo interface versioning** — Android, Vaultwarden, and backend services share contracts
  (persona shape, IOC bundle, exposure index, flags). Version these interfaces explicitly.
- **GPL hygiene** — keep clean-room boundaries for non-commercial matchers (MVT) and any non-GPL
  upstream; the client must remain redistributable under GPLv3.
- **iOS parity (Phase 5)** — Network Extension works technically; App Store review is the gate. Not a
  v1 concern.
