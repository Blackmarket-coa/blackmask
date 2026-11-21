# Black Mask — Project Docs

> **Approved app direction (2026-11-20):** Start with [app-plan.md](app-plan.md) for the mobile messenger, private Spaces, separately locked Vault, feature catalogue, AI/cyber-defense requirements, and release sequence. It expands the earlier product scope while preserving the standalone browser/web release checks below. Planned app behavior is distinct from implemented or verified behavior.

> **Status:** the [feature audit register](feature-audit-register.md) records what is verified, feature by feature. Its latest evidence is the [2026-11-21 Chromium run](evidence/2026-11-21-chromium-vault-flows.md): a production Chrome build passed 37 of 39 checks against a local Vaultwarden, now including Send, attachments, export, and lock and unlock. Nothing is fully verified yet: Firefox, a store-installed build and the hosted backend are outstanding. The [2026-11-12 source/CI review](implementation-status-2026-11-12.md) is the earlier scoped summary. Enhancement features are **one-time purchases; no subscription**.

Black Mask is a privacy / counter-surveillance product built on top of this repository (a fork of
the Bitwarden clients monorepo). Its mission: **give individuals the tools to understand, reduce, and
control the data collected about them** — detect surveillance, reduce data collection, increase
anonymity, and expose tracking, all within legal boundaries.

This folder holds the engineering documentation that grounds the (separately maintained) product spec
in _this codebase_.

## Documents

**Payment clarification (2026-11-20):** One-time purchases are the rule for enhancements and finite services. Hosted storage is the only recurring charge. The [monetization plan](monetization-plan.md) governs this exception; dated no-subscription statements elsewhere refer to enhancement features.

| Doc                                                                                    | What it is                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`app-plan.md`](./app-plan.md)                                                         | **Canonical mobile app plan** — approved Chats / Spaces / Vault direction, source-backed feature catalogue, identity and security boundaries, onboarding, add-ons, and release acceptance criteria.                                   |
| [`monetization-plan.md`](./monetization-plan.md)                                       | **Complete proposed revenue catalogue** — one-time enhancements, bundles, organization tools, marketplace sales, finite services, ecosystem commerce, sponsorships, donations and goods; hosted storage is the only recurring charge. |
| [`problem-solution-map.md`](./problem-solution-map.md)                                 | **User problems and outcomes** — all 25 discussed problems, practical success criteria, privacy boundaries, and ecosystem roles.                                                                                                      |
| [`user-earning-plan.md`](./user-earning-plan.md)                                       | **User income** — 16 earning paths, commissioning/publication/funded-task surfaces, connected commerce and delivery, settlement/privacy requirements, and the later storage-provider candidate.                                       |
| [`hidden-device-detection-oss-research.md`](./hidden-device-detection-oss-research.md) | **Phone detection research** — 31 project entries, phone/hardware support, license screening, realistic limits, and an evaluation shortlist. No code adopted.                                                                         |
| [`privacy-security-oss-research.md`](./privacy-security-oss-research.md)               | **Broader OSS research** — 50 entries covering speech-preserving communication, anti-scraping, browser/device privacy, safer files, AI-misuse research, and security/release tooling. No code adopted.                                |
| [`location-privacy-mvp.md`](./location-privacy-mvp.md)                                 | **Proposed Location Privacy Control Center MVP** — user stories, boundaries, acceptance tests, PR-sized steps, and Blackout integration gates.                                                                                        |
| [`ai-first-audit-and-release-plan.md`](./ai-first-audit-and-release-plan.md)           | **AI-first full-product audit** — verify every feature, repair what can be finished, safely hide the rest, and escalate only necessary human gates.                                                                                   |
| [`feature-audit-register.md`](./feature-audit-register.md)                             | **Feature audit register** — one record per feature and launch dependency, with code, unit, browser, backend and security status kept separate, defects, severity and proposed disposition.                                           |
| [`evidence/`](./evidence/)                                                             | Dated evidence reports behind the register, starting with the [2026-11-15 automated Chromium run](./evidence/2026-11-15-chromium-automated.md).                                                                                       |
| [`mvp.md`](./mvp.md)                                                                   | **Standalone browser/web MVP** — foundation release scope, must-work capabilities, existing-code limitations, launch blockers, and go/no-go criteria.                                                                                 |
| [`product-strategy.md`](./product-strategy.md)                                         | **Product strategy** — approved mobile direction, painkiller positioning, identity/privacy principles, daily-use habits, and reuse of Blackout messaging/community infrastructure.                                                    |
| [`onboarding-habits-and-rewards.md`](./onboarding-habits-and-rewards.md)               | **Planned onboarding and rewards** — visual prompts, short setup goals, motivators, fewer steps, milestone points, chosen native products, and a deferred implementation checklist.                                                   |
| [`features.md`](./features.md)                                                         | **The full feature reference** — every implemented feature: routes, flags, code map, privacy posture, limitations, and tests.                                                                                                         |
| [`engineering-execution-plan.md`](./engineering-execution-plan.md)                     | How the Black Mask product maps onto this Bitwarden codebase — feature-to-subsystem mapping, key reuse decisions, the v1 build sequence, and risks.                                                                                   |
| [`branding.md`](./branding.md)                                                         | What the Black Mask rebrand covers, what's placeholder, and how to regenerate or replace the assets.                                                                                                                                  |
| [`store-submission.md`](./store-submission.md)                                         | What the Chrome and Firefox stores need beyond a zip: per-permission justifications, and the review-risk items to answer before submitting.                                                                                           |
| [`browser-validation.md`](./browser-validation.md)                                     | The manual checklist for behaviour jest cannot exercise — DNR blocking, containers, fingerprint probes, the ONNX detector.                                                                                                            |

## Current status

The v1 milestones (M0–M4) have **implemented code, with real-browser behavior not yet fully verified** in the browser
extension: privacy dashboard & score, persona vault, tracker detection, fingerprint exposure test,
data exposure dashboard, per-persona containers, phishing protection, and — beyond the original
plan — an on-device AI-generated media detector. All are gated behind `black-mask-*` feature flags
that now **default to on**, because a self-hosted Vaultwarden does not serve `/config` feature
states and an off-by-default flag would make every feature invisible in production. See
[`features.md`](./features.md) for what each feature does, where its code lives, and its
limitations.

Validation so far covers one environment. On 2026-11-21 a production Chrome build passed 37 of 39
automated checks in Chromium against a local Vaultwarden
([evidence](./evidence/2026-11-21-chromium-vault-flows.md)). That run leaves gaps, listed in the
report: the phishing warning flow, the AI model download, real breach data, autofill and import
among them. Firefox (containers included), a store-installed build and the hosted backend have not
been verified, so the [register](./feature-audit-register.md) marks no feature Verified. Work through [`browser-validation.md`](./browser-validation.md) before demoing or
submitting to a store.

Everything else in the feature → subsystem map (§3 of the execution plan) — the Android app,
VPN/network layer, backend inference/IOC/SAR services, and coalition features — remains
sibling-repo or later-phase work and is not part of what ships from this repository today.

## Launch prerequisites

**Default-server readiness requires a fresh check.** The finding below is dated 2026-09-25 and was not re-tested in the 2026-11-12 source/CI review. The browser extension defaults to
`BLACK_MASK_BASE_URL = "https://vault.blackmask.app"` (the `PRODUCTION_REGIONS` entry in
`libs/common/src/platform/services/default-environment.service.ts`), so a fresh install of a
production build talks to that origin with no manual server entry. As of 2026-09-25 the name does not resolve: public DNS
returns NXDOMAIN for both `vault.blackmask.app` and `blackmask.app`, and the `.app` registry's RDAP
service reports `blackmask.app` as not found — the domain is unregistered. Until that changes, a
user who keeps the default cannot register or log in, and has to pick a self-hosted server by hand.

Before launch:

- **Register `blackmask.app`.** This is also a security item, not just an availability one: while
  the domain is unregistered, anyone can register it and receive the login attempts of every fresh
  install that keeps the default.
- Publish DNS for `vault.blackmask.app` and serve Vaultwarden there over HTTPS with a valid
  certificate. `.app` is on the browsers' HSTS preload list, so plain HTTP is refused. The region
  config sets only `base` and `webVault`, which assumes Vaultwarden serves the API, identity,
  icons, notifications and events endpoints from that single origin under path prefixes.
- Re-run the **Environment** section of [`browser-validation.md`](./browser-validation.md) against
  the live server, on a fresh install of a production build (`npm run build:prod:chrome`, or
  `MANIFEST_VERSION=3 npm run build:prod:firefox` for Firefox MV3). Development builds cannot run
  this check: on first install they apply the `managedEnvironment` dev flag from
  `apps/browser/config/development.json` and switch to `https://localhost:8080`, so they never
  show the `vault.blackmask.app` default.

## Standalone browser/web v1 scope

The standalone foundation v1 is the **browser extension** plus the **self-hosted web vault**. No local VPN. Everything runs
on the user's devices plus a self-hosted backend — no coalition/Blackout dependency. The coalition
features are later integration work, not a launch prerequisite. Any paid enhancement is a one-time purchase, with no subscription.

This replaces the original "browser extension + Android app, together" scope still recorded in the
[execution plan](./engineering-execution-plan.md): the consolidation review
([`CONSOLIDATION.md`](../../CONSOLIDATION.md)) made the extension and the web vault the shipping
surfaces. This repository contains no Android code.

## The one thing to know first: repo boundary

This repository is `bitwarden/clients` — it contains the **browser extension** and the **web
vault** (the v1 surfaces that live here), plus the desktop and CLI apps and the shared libraries
they depend on. It does **not** contain:

- the **Android app** (sibling repo, `bitwarden/android`),
- the **sync backend** (sibling repo, `vaultwarden`), or
- the new **backend services** (persona-bio inference, IOC-feed pipeline, SAR automation, exposure
  index, self-hosted SimpleLogin).

The execution plan describes those sibling pieces only at the **client-contract level** — what this
repo's code calls and expects — not their internal implementation. Android local VPN, the desktop
network agent, and iOS/macOS Network Extensions are out of scope for v1.

## How to read this

To learn **what exists and how to use or extend it**, read [`features.md`](./features.md). To
understand **why it's built this way**, read the execution plan — start with its **Architecture &
repo boundary** and **Feature → subsystem map** sections, which orient you to what's reused versus
net-new. For product intent and the Blackout relationship, read [`product-strategy.md`](./product-strategy.md).
The two load-bearing reuse decisions are that the **persona vault reuses the existing `Identity` cipher type**
and that **email aliasing is already built** (the SimpleLogin forwarder); both are explained in depth there.
