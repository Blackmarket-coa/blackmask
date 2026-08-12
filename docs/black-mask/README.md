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
| [`deploy/`](./deploy/)                                             | Phase 0 backend: compose file, env template, and a smoke test. The blocking item — nothing ships without it.                                        |
| [`privacy-policy.md`](./privacy-policy.md)                         | **Draft** policy written from the source. Required by both stores. Needs qualified review before publishing.                                        |

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

## v1 scope (locked)

v1 is **browser extension + Android app, together. No local VPN.** Everything runs on the user's
devices plus a self-hosted backend — no coalition/Blackout dependency. The coalition features are a
later upgrade tier, not a launch prerequisite.

## The one thing to know first: repo boundary

This repository is `bitwarden/clients` — it contains the **browser extension** (the v1 surface that
lives here), plus the desktop, web, and CLI apps and the shared libraries they depend on. It does
**not** contain:

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
