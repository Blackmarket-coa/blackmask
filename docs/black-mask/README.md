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
| [`engineering-execution-plan.md`](./engineering-execution-plan.md) | How the Black Mask product maps onto this Bitwarden codebase — feature-to-subsystem mapping, key reuse decisions, the v1 build sequence, and risks. |

## Current status

The v1 browser extension surface (`apps/browser/src/privacy/`) has working implementations of:

- **Tracker detection** — background blocklist matching + per-tab tracker counts (`trackers/`,
  `background/tracker-count.background.ts`).
- **Fingerprint exposure test** — content-script entropy probes (`fingerprint.component.ts`).
- **Account security audit** — reused vault-health/breach signals (`account-audit.service.ts`).
- **Data exposure dashboard** (`data-exposure.component.ts`).
- **Phishing & scam inspector** (`phishing-protection.component.ts`).
- **Persona generator + per-persona browsing containers** — built on the `Identity` cipher (see §4 of
  the execution plan) (`create-persona.component.ts`, `personas.component.ts`,
  `persona-containers.component.ts`).
- **Privacy score dashboard** aggregating the above (`privacy-dashboard.component.ts`).
- **On-device AI-generated media detector** — a beyond-v1-plan addition; classifies images/video
  frames locally via a cached ONNX model, no upload of user media (`ai-media-detector.component.ts`).

Everything else in the feature → subsystem map below (§3) — the Android app, VPN/network layer,
backend inference/IOC/SAR services, and coalition features — remains sibling-repo or later-phase work
and is not part of what ships from this repository today.

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

Start with the execution plan's **Architecture & repo boundary** and **Feature → subsystem map**
sections — they orient you to what's reused versus net-new. The two load-bearing reuse decisions are
that the **persona vault reuses the existing `Identity` cipher type** and that **email aliasing is
already built** (the SimpleLogin forwarder); both are explained in depth there.
