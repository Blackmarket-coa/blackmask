# Blackmask — Whole-Product Minimum Viable Product (MVP)

**Status:** Proposed release definition, not a claim of launch readiness  
**Scope:** The entirety of Blackmask's first usable product  
**Current shipping surfaces:** Browser extension + self-hosted web vault  
**Principle:** Solve concrete privacy problems with working, understandable controls before expanding into advanced counter-surveillance.

## 1. One-sentence product definition

**Blackmask is a privacy-first browser extension and encrypted identity vault that helps people reduce tracking, avoid common online threats, keep identities separated, and understand what personal information is exposed.**

The product must provide immediate standalone value without Blackout, Coalition, FBM, a VPN, or a mobile app.

## 2. Who it is for and why they return

**Primary user:** An everyday internet user who wants fewer trackers, safer browsing, more control over online identities, and straightforward explanations of their exposure without having to become a security expert.

**Secondary user:** A creator, seller, organizer, or community participant who uses multiple identities and needs to reduce accidental crossover between personal, professional, and pseudonymous contexts.

**Jobs to be done:**
- “Stop common trackers and tell me what was blocked.”
- “Warn me before I follow a known phishing destination.”
- “Let me create and use a different identity for a different purpose.”
- “Show me where my passwords, accounts, and browser settings create exposure.”
- “Let me keep my vault under my control and understand where it is hosted.”

**Return loop:** Protection runs with normal browsing; users revisit when they encounter a warning, create or switch personas, review account health, or investigate a specific exposure. Do not manufacture engagement with fear, streaks, or intrusive alerts.

## 3. Locked MVP scope

| Pillar | Required user-facing capability | Definition of done |
| --- | --- | --- |
| A. Safe foundation | Install browser extension, connect to a functioning self-hosted vault, sign in, unlock, save, sync, and autofill credentials | Fresh-install and return-user flows work in supported browsers; credentials sync securely; errors and offline states are understandable |
| B. Tracker protection | Block a documented set of known tracking requests; display protection status and counts | Blocking verified against actual network requests, not inferred from counters; list coverage and limitations visible |
| C. Phishing protection | Warn on known malicious destinations and allow user to understand or change protection status | Detection works in supported browser builds; warning and bypass flows tested; feed origin disclosed |
| D. Persona vault | Create, edit, and use Real, Business, Creator, and Pseudonymous/Anonymous-labelled identity records, with alias guidance | Persona data survives sync; editing preserves unrelated fields; alias warnings distinguish forwarding aliases from easily linked addresses |
| E. Browsing separation | Offer actual per-persona cookie/container separation where supported | Firefox container isolation validated; unsupported browsers clearly say the feature is unavailable—never claim Chromium isolation without implementation |
| F. Exposure awareness | Privacy overview, account password-health checks, fingerprint exposure estimate, and explicit breach lookup where backend supports it | Results are accurate to measured inputs; fingerprint measurement is not described as fingerprint prevention; unsupported breach API produces an honest unavailable state |
| G. User control and trust | Review protection status, adjust supported controls, export/manage vault data, understand permissions and retention | No hidden collection of browsing history or persona content for engagement analytics; clear settings and privacy disclosures |
| H. Usable product | Consistent onboarding, clear navigation, accessible error/empty/loading states, basic support and issue-reporting path | A first-time tester can install, understand protection, create a persona, and complete an account-health review without developer help |

**Launch principle:** A smaller set of verified capabilities is better than a large collection of pages that appear functional but fail in real browsers.

## 4. What exists versus what must be validated

The repository's feature reference describes these as implemented in browser-extension code: privacy dashboard and score; persona vault; tracker detection; fingerprint exposure test; data-exposure dashboard; Firefox persona containers; phishing protection surface; and an on-device AI-generated-media detector.

**This is a code/documentation inventory, not a launch certification.** The browser-validation document explicitly says real-browser validation remains outstanding. Key qualifications:

- Tracker blocking currently uses a small curated 20-domain seed list, not comprehensive tracker protection.
- Per-persona containers are Firefox-only; Chromium does not have equivalent implemented isolation.
- Fingerprinting is measured in the extension popup, not comprehensively prevented; the estimate may differ from what a visited website observes.
- Breach lookup depends on a backend endpoint that a self-hosted Vaultwarden instance may not support.
- Phishing detection uses an upstream engine and fetches blocklist data from Bitwarden-hosted resources; that dependency must be disclosed or replaced.
- The on-device AI-media detector is an optional experimental/bonus feature, **not a launch blocker**; it must be independently validated before making reliability claims.
- Existing privacy-score weighting is a heuristic. It must be presented as a directional indicator, not an objective measure of safety.

### Launch blockers from existing docs

1. **Default server:** The repository says `vault.blackmask.app` was not live at the time of its launch-prerequisite audit. Verify present ownership, DNS, HTTPS, server operation, and a safe fallback before release. Do not ship a default login destination without controlling it.
2. **Fresh-install redirect:** The browser-validation checklist identifies a production welcome-tab navigation to `bitwarden.com/browser-start/`; replace it with an owned, appropriate destination and test fresh production installs.
3. **Real-browser testing:** Validate Chrome and Firefox MV3 behavior, network blocking, phishing warnings, personas, Firefox container separation, fingerprint probes, autofill, and sync.
4. **Backend compatibility:** Test vault registration/login/sync and any exposure-lookup endpoint against the actual chosen backend; do not present unsupported backend capabilities as available.
5. **Security/privacy review:** Review extension permissions, third-party network calls, telemetry, secrets, storage, error logs, update process, and the claims made in UI/store copy.
6. **Distribution readiness:** Complete store disclosures, packaging, signing, accessibility and basic support documentation.

These blockers should be rechecked against the current deployed environment rather than assumed unresolved indefinitely.

## 5. Out of scope for the first release

- Blackout messaging client, calls, Matrix room management, or social feeds.
- Coalition maps, live location, operational tracking, and the proposed Location Privacy Control Center.
- Android/iOS app, local VPN, desktop network agent, Tor/onion routing, or guaranteed network anonymity.
- Automated data-broker removal, backend AI persona generation, full-scale IOC pipeline, and advanced surveillance-detection claims.
- Full Chromium persona-container parity unless a genuinely isolated implementation is built and validated.
- New encryption primitives or an entirely new identity cipher type.
- Guaranteed deepfake detection, fingerprint invisibility, or absolute anonymity.

These are **roadmap candidates**, not features to advertise as included in the MVP.

## 6. First-run experience

1. Install Blackmask from a trusted distribution channel.
2. See a plain-language summary: what it blocks, what it only measures, and what it cannot protect.
3. Connect to a verified Blackmask-hosted or user-selected self-hosted vault; create or unlock an account.
4. Confirm tracker/phishing protection state and any browser permissions needed.
5. View a simple dashboard: protection active/inactive, known blocked requests, account-health actions, and next steps.
6. Create an optional persona; explain the limits of pseudonymity and browser isolation.
7. Browse normally; revisit Blackmask when a warning, identity task, or account review calls for it.

Do not require Blackout registration, a Coalition membership, location access, or any AI service during onboarding.

## 7. Technical boundaries

- **Client:** Existing browser-extension architecture under `apps/browser`, with shared vault/auth/sync libraries.
- **Vault:** Existing encrypted identity/credential models and self-hosted backend compatibility; reuse the current Identity cipher rather than inventing new cryptography.
- **Web vault:** Vault access and management; do not imply browser-only protection features run inside the web vault unless implemented there.
- **Privacy logic:** Prefer local blocking, analysis, and reporting. Any remote request must be documented and necessary for a user-visible capability.
- **Browser differences:** Publish a browser support matrix; unsupported features should be absent or explicitly unavailable, not silently simulated.
- **Integration:** Blackout remains a separate product. Future linking must be opt-in, revocable, and identity-context aware.

## 8. Release acceptance tests

- A clean production install uses only controlled, documented endpoints and reaches a working login flow.
- Registration/login, vault encryption, save/edit, sync, lock/unlock, export, and autofill succeed against the selected backend.
- Tracker requests are demonstrably blocked in supported browsers and counts do not falsely report blocking.
- Phishing protection produces correct warnings, clear controls, and understandable offline/feed-failure behavior.
- Persona create/edit/sync works without corrupting other vault fields; alias warnings appear for linkable email patterns.
- Firefox containers demonstrably isolate cookies; Chrome never promises unsupported isolation.
- Fingerprint output accurately labels itself as an estimate and avoids claiming to block fingerprinting.
- Breach lookup only occurs on explicit action; unsupported backend endpoints are clearly marked unavailable.
- Accessibility: keyboard navigation, visible focus, meaningful labels, usable contrast, and understandable error messages.
- Network audit identifies all third-party requests; no vault secrets, raw browsing history, or persona contents are sent to analytics.
- Security review covers browser permissions, dependency and supply-chain risk, auth/session handling, logs, recovery, and update signing.
- Documentation and store descriptions match verified behavior; no claim of absolute anonymity or comprehensive surveillance protection.

**Go/no-go:** Do not publicly claim MVP readiness until the critical tests above pass on actual release builds and the default backend path is verified.

## 9. PR-sized delivery sequence

| Workstream | Deliverable | Exit criterion |
| --- | --- | --- |
| 0. Product truth audit | Current feature/status matrix and supported-browser matrix | Every claim mapped to a tested behavior, a known limitation, or a disabled feature |
| 1. Launch infrastructure | Controlled domain, HTTPS, working vault backend, safe production defaults, welcome-page fix | Fresh install and account sync work without third-party branding redirects |
| 2. Core protection validation | Tracker and phishing integration tests, feed-failure handling, honest coverage copy | Confirmed request blocking and phishing behavior in supported browsers |
| 3. Identity validation | Persona create/edit/sync/autofill, forwarding-alias guidance, Firefox container tests | Identity flows work and browser differences are disclosed |
| 4. Exposure and dashboard | Account-health checks, fingerprint measurement labels, optional breach endpoint fallback | No false safety guarantees or broken default actions |
| 5. Hardening and distribution | Security/privacy audit, accessibility, docs, browser-store packages, issue reporting | Launch checklist signed off with reproducible release builds |
| 6. Post-launch integration | Separate Blackout identity/privacy contracts, Location Privacy Control Center | Starts only after standalone MVP is stable; separately security-gated |

Workstreams may run in parallel, but launch blockers cannot be waived merely because UI pages exist.

## 10. Success measures

**Activation:** New user can install, unlock a vault, verify protection status, and perform one useful privacy action.  
**Protective value:** Measured tracker blocks, phishing warnings where applicable, corrected weak/reused credentials, and successfully separated persona workflows.  
**Reliability:** Crash-free browser sessions, sync correctness, warning accuracy, and low support burden.  
**Trust:** Users understand what is and is not protected; security issues are acknowledged and resolved.  
**Retention:** People keep Blackmask installed and return for real identity/security tasks—not compulsive score checking.

Prefer on-device metrics, voluntary feedback, and aggregate operational health signals. Do not track browsing history or message/persona contents to measure engagement.

## 11. Roadmap after MVP

**Next:** More comprehensive tracker lists, better phishing feed independence, improved fingerprint mitigation guidance, Chromium isolation if technically achievable, richer account-exposure data, polished self-hosting and recovery.

**Ecosystem:** Explicit Blackout integration for communication and identity boundaries; Coalition Location Privacy Control Center only after authorization, encryption, expiry, and delivery gates pass.

**Advanced:** Mobile clients, network protection, deeper threat intelligence, data-broker workflows, and higher-assurance counter-surveillance capabilities, each with its own threat model and validation.

## 12. Related documentation

- [Product strategy](./product-strategy.md)
- [Implemented feature reference](./features.md)
- [Browser validation checklist](./browser-validation.md)
- [Engineering execution plan](./engineering-execution-plan.md)
- [Store submission](./store-submission.md)
- [Location Privacy Control Center MVP — future feature](./location-privacy-mvp.md)

**Evidence note:** This document synthesizes existing repository documentation and does not certify a current deployment, security audit, or real-browser test run.
