# Black Mask — Project Docs

Black Mask is a privacy / counter-surveillance product built on top of this repository (a fork of
the Bitwarden clients monorepo). Its mission: **give individuals the tools to understand, reduce, and
control the data collected about them** — detect surveillance, reduce data collection, increase
anonymity, and expose tracking, all within legal boundaries.

This folder holds the engineering documentation that grounds the (separately maintained) product spec
in _this codebase_.

## Documents

| Doc                                                                | What it is                                                                                                                                          |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`features.md`](./features.md)                                     | **The full feature reference** — every implemented feature: routes, flags, code map, privacy posture, limitations, and tests.                       |
| [`engineering-execution-plan.md`](./engineering-execution-plan.md) | How the Black Mask product maps onto this Bitwarden codebase — feature-to-subsystem mapping, key reuse decisions, the v1 build sequence, and risks. |
| [`branding.md`](./branding.md)                                     | What the Black Mask rebrand covers, what's placeholder, and how to regenerate or replace the assets.                                                |
| [`store-submission.md`](./store-submission.md)                     | What the Chrome and Firefox stores need beyond a zip: per-permission justifications, and the review-risk items to answer before submitting.         |
| [`browser-validation.md`](./browser-validation.md)                 | The manual checklist for behaviour jest cannot exercise — DNR blocking, containers, fingerprint probes, the ONNX detector.                          |

## Current status

The v1 milestones (M0–M4) from the execution plan are **feature-complete** in the browser
extension: privacy dashboard & score, persona vault, tracker detection, fingerprint exposure test,
data exposure dashboard, per-persona containers, phishing protection, and — beyond the original
plan — an on-device AI-generated media detector. All are gated behind `black-mask-*` feature flags
that now **default to on**, because a self-hosted Vaultwarden does not serve `/config` feature
states and an off-by-default flag would make every feature invisible in production. See
[`features.md`](./features.md) for what each feature does, where its code lives, and its
limitations.

None of them have been validated in a real browser yet — see
[`browser-validation.md`](./browser-validation.md) before demoing or submitting to a store.

Everything else in the feature → subsystem map (§3 of the execution plan) — the Android app,
VPN/network layer, backend inference/IOC/SAR services, and coalition features — remains
sibling-repo or later-phase work and is not part of what ships from this repository today.

## Launch prerequisites

**The default server does not exist yet.** The browser extension defaults to
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

## v1 scope

v1 is the **browser extension** plus the **self-hosted web vault**. No local VPN. Everything runs
on the user's devices plus a self-hosted backend — no coalition/Blackout dependency. The coalition
features are a later upgrade tier, not a launch prerequisite.

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
net-new. The two load-bearing reuse decisions are that the **persona vault reuses the existing
`Identity` cipher type** and that **email aliasing is already built** (the SimpleLogin forwarder);
both are explained in depth there.
