# Blackmask — AI-First Full-Product Audit, Repair, and Release-Gating Plan

**Status:** Execution plan; not evidence that an audit or test run has occurred  
**Scope:** Entire Blackmask MVP: browser extension, web vault, shared libraries, configured backend, build/distribution, and user-facing claims  
**Parent:** [Whole-product MVP](./mvp.md)  
**Rule:** *Verify it, finish it, or hide it.* Keep unfinished work in source control and make it easy to re-enable after passing tests.

## 1. Objective and definition of done

Use AI agents to do as much repository investigation, testing, implementation, debugging, documentation, and evidence collection as possible before requesting human intervention. Audit **every** exposed route and supporting capability, not only the eight Blackmask-specific privacy pages. Deliver a stable, coherent MVP where each visible action works and every privacy/security claim is supported by evidence.

**Done means:** each user-visible feature has an owner, a verified status, test evidence, a clear release decision, and no broken or misleading entry points. The release build must be tested in real browsers and against the intended backend.

**Important:** AI-generated test reports are not substitutes for actually executing tests. Never mark a feature verified on the basis of code inspection alone.

## 2. Feature register — mandatory output

Create and maintain `docs/black-mask/feature-audit-register.md` (or machine-readable CSV/JSON plus readable summary) with one record per user-visible feature, entry point, or critical dependency.

Fields: ID; user promise; routes/menus/settings/onboarding entry points; browser/platform; implementation files; feature flag and default; backend/remote dependency; threat/privacy impact; automated tests; browser/runtime test evidence (commands, environment, date, result); defects; severity; effort estimate; disposition; release gate; PR/commit; reviewer; retest status.

**Status vocabulary:**
- **Verified:** exercised successfully in supported real release-like environment, with reproducible evidence.
- **Implemented, unverified:** code exists; runtime behavior not established.
- **Broken:** reproducible user-visible failure.
- **Partial:** some promised behavior missing or unsupported.
- **Blocked:** external infrastructure, credentials, platform, or dependency prevents verification.
- **Deferred/hidden:** deliberately removed from shipping UI, preserved in code.
- **Removed:** only when explicitly approved and safe; not the default for incomplete work.

Separate *code presence*, *unit-test pass*, *browser verification*, *backend verification*, and *security approval* into distinct fields. A green unit test never automatically becomes a Verified feature.

## 3. Full audit coverage

### Product and navigation
- Every popup route, settings item, web-vault route, onboarding step, login/signup/reset, empty/loading/error state, link, toggle, help page, and first-run welcome destination.
- Flag-off behavior: no dead links, stale settings entries, notifications, commands, or background jobs for hidden features.
- Browser/platform parity: Chrome MV3, Firefox MV3, and any other claimed targets. Explicitly identify Firefox-only containers and unsupported Chromium isolation.

### Security and privacy
- Auth, lock/unlock, sync, vault item create/edit/delete/export, autofill, password-health checks, persona handling, alias warnings, tracker blocking, phishing warnings, fingerprint estimates, breach lookup, and AI-media detection.
- Extension permissions, content scripts, external requests, remote models, downloaded feeds, local storage, logging, analytics, error reports, supply-chain/dependency risks, update/release integrity.
- Confirm that no plaintext secrets, raw browsing history, or persona contents are sent to product telemetry.
- Distinguish local protection, measurement, encrypted storage, and external-service behavior.

### Infrastructure and release
- Production domain ownership, DNS, HTTPS, Vaultwarden/backend compatibility, auth and sync, fresh-install production defaults, welcome-page redirect, build reproducibility, package/store disclosures, browser permission explanations, and support path.
- Failures of core authentication, encryption, sync integrity, or unowned default login destination are **release blockers**, not optional hidden features.

## 4. AI execution loop for each feature

1. **Discover:** Trace route → UI → service → browser API/backend → feature flag → tests; document the actual user promise.
2. **Reproduce:** Run build, lint/typecheck, relevant unit/integration tests, then browser automation or instrumented manual-style browser interaction when available. Capture logs, screenshots, network traces, environment, and reproducible steps; sanitize secrets.
3. **Diagnose:** Identify root cause and assess security impact; avoid superficial fixes that only hide error messages.
4. **Choose disposition:**
   - **Finish now** when bounded, low/medium risk, testable, and consistent with MVP scope.
   - **Hide and defer** when incomplete, dependent on unavailable infrastructure, high-risk, or beyond MVP.
   - **Block release** when core trust, auth, encryption, credential integrity, unsafe default endpoints, or misleading security claims remain unresolved.
5. **Implement:** Work in a feature branch with a focused PR, tests, docs, and a migration/rollback note if relevant. Do not directly ship unreviewed AI changes to production.
6. **Retest:** Re-run the failing case and adjacent regression flows, then update evidence and status. If test execution is unavailable, leave status **unverified**.
7. **Escalate:** Ask a human only for actions that require real ownership, consent, credentials, payments, browser-store accounts, legal decisions, or independent high-risk security approval.

Repeat until all visible MVP capabilities are Verified or explicitly blocked from release.

## 5. Hide/defer implementation policy

**Do not delete unfinished work by default.** Hide it behind a release-safe feature flag or remove its entry points from production navigation while preserving code, tests, documentation, and a reactivation ticket.

For every deferred feature:
- Set the **production default to off** (not only a backend flag that may be absent from self-hosted Vaultwarden `/config`).
- Hide all entry points, including settings, onboarding, shortcuts, deep links, notifications, and cross-links; deny direct route access with a clear fallback.
- Disable unnecessary background jobs, API calls, browser permissions, and model downloads associated with the feature wherever feasible.
- Ensure hiding does not break vault data, existing users, imports/exports, or shared library contracts.
- Add an explicit re-enable checklist: required implementation, tests, browser/backend validation, privacy review, and copy review.
- Keep a visible **deferred backlog** with reason, owner, risk, and dependency.

**Critical distinction:** Hiding a UI cannot fix unsafe background code, leaked data, weak auth, or insecure endpoints. Remove unsafe behavior from the release path or block shipping.

## 6. First-pass feature decisions to investigate (not pre-judged)

| Feature | Current documentation says | AI audit action |
| --- | --- | --- |
| Vault/auth/sync/autofill | Existing Bitwarden-derived foundation | Verify fresh production install, backend, credentials, sync, export and recovery first; block release on critical failure |
| Tracker blocking | 20-domain DNR seed list; runtime not validated | Exercise network blocking in Chrome/Firefox MV3; fix counting mismatches; disclose limited coverage |
| Phishing protection | Upstream engine and remote feed | Test warning/disable/offline flows and external feed requests; fix or disclose dependencies |
| Personas | Existing Identity cipher and alias warnings | Test create/edit/sync/autofill; ensure custom fields survive and linked aliases warn |
| Persona containers | Firefox-only | Verify cookie isolation in Firefox; hide or accurately mark unsupported on Chromium |
| Privacy dashboard/score | Local heuristic | Test all factors and labels; do not claim objective safety or protection where only measurement exists |
| Fingerprint exposure | Popup measurement, not mitigation | Test probes; correct measurement claims; hide if misleading or unreliable |
| Data exposure | Depends on `/hibp/breach` backend support | Test actual backend; if unsupported, hide action or present explicit unavailable state rather than a broken default flow |
| AI media detector | On-device ONNX model, bonus feature | Validate model loading, browser CSP, size, performance, and false-positive messaging; defer if unstable |
| Blackout/Coalition integrations | Later roadmap | Keep out of standalone MVP navigation unless independently integrated and verified |
| Location Privacy Control Center | Separate proposed MVP | Keep hidden/deferred; not a blocker for whole-product launch |

## 7. AI-first workstreams and deliverables

### Wave 0 — Establish reproducible environment
AI: read repo guidance, identify package manager, pin versions, install dependencies in isolated workspace, capture baseline build/lint/test results, enumerate supported browser targets, and create an evidence directory. Never put secrets in logs or commits.

**Output:** baseline report with exact commands, failures, environment, and constraints.

### Wave 1 — Complete inventory and static review
AI: crawl routes, menus, feature flags/defaults, manifests, background workers, service calls, external domains, TODO/FIXME/stubs, tests, and backend contracts. Compare documentation promises to implementation.

**Output:** feature audit register, dependency map, and prioritized issue queue.

### Wave 2 — Automated runtime verification
AI: execute unit/integration tests, build release-like extensions, launch Chrome/Firefox via browser automation when supported, exercise representative user journeys, inspect network behavior, and verify actual backend responses. Capture reproducible artifacts.

**Output:** per-feature pass/fail/blocked evidence and browser compatibility matrix.

### Wave 3 — Repair or gate
AI: tackle bounded fixes in dependency order, adding regression tests. For unfinishable items, implement production-off gating across routes and background behavior. Update docs and reactivation tickets.

**Output:** focused PRs, deferred backlog, and no broken visible paths.

### Wave 4 — End-to-end and adversarial verification
AI: test fresh install, account lifecycle, credential sync, tracker/phishing protection, persona separation, privacy explanations, offline/error states, and permission boundaries; run dependency/security scans and inspect outgoing traffic.

**Output:** consolidated release-candidate report and open risks.

### Wave 5 — Human-only gates and launch
Humans: confirm domain/account ownership, provision production credentials and billing, approve legal/privacy/store disclosures, conduct independent security review of sensitive changes, verify real-device/store installation where automation cannot, and authorize deployment.

**Output:** short action list for humans with exact evidence, decisions, and blockers. AI can prepare materials and retry checks after access is provided.

## 8. Prioritization and stop rules

**P0:** credential compromise, plaintext secret leakage, auth/sync corruption, unowned login endpoint, serious privacy misrepresentation, or insecure default. Stop release; fix and independently review.

**P1:** broken core MVP user journey, ineffective advertised tracker/phishing protection, unsafe permissions, failed browser support claims. Fix before release or remove unsupported capability and all its effects.

**P2:** optional feature broken or partial. Fix if bounded; otherwise hide and preserve for later.

**P3:** polish, experimental detection, and nonessential ecosystem integrations. Defer unless exceptionally easy and low risk.

AI should avoid open-ended refactors, new crypto, security theater, and shipping a superficially green test suite. A feature is not safe merely because an AI agent says so.

## 9. PR and automation operating rules

- Use issue-sized branches and PRs; separate audit evidence, fixes, and gating changes when possible.
- Every PR states user promise, prior failure, changes, tests run, tests not run, security/privacy impact, rollback, and screenshots/network evidence where appropriate.
- CI should enforce build/typecheck/lint/unit tests, feature-flag-off navigation checks, and smoke tests. Add browser E2E where infrastructure supports it.
- Never expose secrets or user data to AI logs. Use test accounts and synthetic fixtures.
- AI can propose/implement fixes and run tests; production deployment, sensitive security approvals, and external account changes require authorized human action.
- A failing or skipped required check cannot be silently treated as passing.

## 10. Final handoff format

Provide a single release-readiness report with:
1. **Verified and visible:** features with linked evidence.
2. **Repaired:** issues and PRs with regression tests.
3. **Hidden/deferred:** features, reasons, flags, and reactivation criteria.
4. **Blocked:** release blockers and required human/external action.
5. **Security/privacy findings:** severity, impact, remediation, reviewer.
6. **Compatibility:** tested browsers, versions, and backend.
7. **Go/no-go recommendation:** explicitly state unknowns and unrun tests.

**Completion gate:** Every visible feature is verified, every optional broken feature is safely gated, and every P0/P1 issue is resolved or the release is blocked. The result is a dependable small MVP, not an inflated feature count.

## 11. Source references

- [Whole-product MVP](./mvp.md)
- [Feature reference](./features.md)
- [Browser validation](./browser-validation.md)
- [Engineering execution plan](./engineering-execution-plan.md)
- [Store submission](./store-submission.md)
- [Product strategy](./product-strategy.md)
