<p align="center">
  <a href="https://github.com/Blackmarket-coa/blackmask/actions/workflows/build-browser.yml?query=branch:main" target="_blank"><img src="https://github.com/Blackmarket-coa/blackmask/actions/workflows/build-browser.yml/badge.svg?branch=main" alt="GitHub Workflow browser build on main" /></a>
  <a href="https://github.com/Blackmarket-coa/blackmask/actions/workflows/build-cli.yml?query=branch:main" target="_blank"><img src="https://github.com/Blackmarket-coa/blackmask/actions/workflows/build-cli.yml/badge.svg?branch=main" alt="GitHub Workflow CLI build on main" /></a>
  <a href="https://github.com/Blackmarket-coa/blackmask/actions/workflows/build-desktop.yml?query=branch:main" target="_blank"><img src="https://github.com/Blackmarket-coa/blackmask/actions/workflows/build-desktop.yml/badge.svg?branch=main" alt="GitHub Workflow desktop build on main" /></a>
  <a href="https://github.com/Blackmarket-coa/blackmask/actions/workflows/build-web.yml?query=branch:main" target="_blank"><img src="https://github.com/Blackmarket-coa/blackmask/actions/workflows/build-web.yml/badge.svg?branch=main" alt="GitHub Workflow web build on main" /></a>
</p>

---

# Black Mask

Black Mask is a privacy and counter-surveillance product that gives individuals the tools to
understand, reduce, and control the data collected about them — detecting tracking and
surveillance, reducing data collection, increasing anonymity, and exposing exposure, all within
legal boundaries.

This repository is a fork of the [Bitwarden](https://bitwarden.com) clients monorepo. It reuses
Bitwarden's battle-tested auth/vault/sync spine ("login once, protected everywhere") and builds
Black Mask's privacy layer on top of it, rather than reimplementing encrypted sync and credential
storage from scratch. **No new encryption logic is added here** — see
[`.claude/CLAUDE.md`](.claude/CLAUDE.md) for that rule and other project conventions.

## What's here

This repo houses the client applications — everything except the mobile apps:

- **`apps/browser`** — the v1 Black Mask surface. Tracker/fingerprint defense, a persona vault with
  per-persona browsing containers, phishing protection, a data-exposure dashboard, an on-device
  AI-generated media detector, and a privacy-score dashboard, alongside the inherited Bitwarden
  vault/autofill/sync functionality. Each feature is documented in the
  [feature reference](docs/black-mask/features.md).
- **`apps/desktop`**, **`apps/web`**, **`apps/cli`** — inherited from the Bitwarden fork; not v1
  priorities for Black Mask, but they pick up shared-library changes.
- **`libs/*`** — shared code across the apps (vault, auth, sync, generators, UI, etc.).
- **`docs/black-mask/`** — the Black Mask engineering documentation: how the product spec maps onto
  this codebase, what's reused vs. net-new, and the v1 build sequence. Start with
  [`docs/black-mask/README.md`](docs/black-mask/README.md).
- **`third_party/`** — vendored, non-buildable snapshots of open-source projects referenced by the
  Black Mask build map (see [`third_party/README.md`](third_party/README.md)). Not part of the
  monorepo build.

## Project scope (v1)

v1 ships as a **browser extension + Android app, together — no local VPN**. Everything runs on the
user's own devices plus a self-hosted backend; there's no dependency on a larger coalition network.
The Android app and backend services are sibling repositories referenced only at the client-contract
level from this repo. Full detail, including the feature-to-subsystem mapping and risks, is in
[`docs/black-mask/engineering-execution-plan.md`](docs/black-mask/engineering-execution-plan.md).

## Attribution & license

Black Mask builds on the GPLv3-licensed [Bitwarden clients](https://github.com/bitwarden/clients)
codebase. The forked client code remains under GPLv3 — see [`LICENSE_GPL.txt`](LICENSE_GPL.txt) and
[`LICENSE_BITWARDEN.txt`](LICENSE_BITWARDEN.txt). Bitwarden is a trademark of Bitwarden, Inc.; this
project is an independent fork and is not affiliated with or endorsed by Bitwarden, Inc.

## Contribute

Code contributions are welcome. Please commit pull requests against the `main` branch. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for how the underlying client codebase is organized and built,
and [`docs/black-mask/`](docs/black-mask/) for how Black Mask features map onto that codebase.

Security audits and feedback are welcome — see [`SECURITY.md`](SECURITY.md) for how to report an
issue.
