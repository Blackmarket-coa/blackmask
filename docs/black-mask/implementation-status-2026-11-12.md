# Blackmask implementation status — 2026-11-12

## Scope

Source review of `main` at `3d84b9528b99dbd20f88880b8bac9e0bb4d0c5a4`
and recorded CI observations from the 2026-11-11 audit. The head was unchanged
on refresh. No fresh-install real-browser, live-backend, DNS, store-release
or independent security verification was performed.

See the [ecosystem implementation and cost-reduction inventory](https://github.com/Blackmarket-coa/free-black-market/blob/6a2ead3033d9d2f44b0e3927aa314a3852acf73e/docs/IMPLEMENTATION_STATUS_AND_COST_REDUCTION.md)
for the full problem/solution map and dependencies. This scoped review does
not complete the [full-product audit plan](ai-first-audit-and-release-plan.md).

## Product intent and implementation boundary

The product goal includes comfortable private interaction and identity control
among trusted friends. The current repository implements browser privacy,
personas/credentials and a web vault. Blackout holds the current communications
and community implementation. Do not infer a separate Discord-replacement
service from the existence of a vault or privacy page. Future social integration
needs explicit identity/privacy boundaries and working end-to-end evidence.

**Enhancement features are one-time purchases. No subscription.** The founder
confirmed this on 2026-11-12. Older upgrade-tier or recurring enhancement
entitlement assumptions are superseded product direction; the FBM code still
needs a coordinated migration. One-time ownership grants the purchased version.
E2EE remains available without a paid enhancement. Actual hosted/third-party
usage costs must be transparent and must not disguise an enhancement subscription.

## Source-backed inventory

| Problem | Existing implementation | What remains |
| --- | --- | --- |
| Credentials, identities and autofill | Bitwarden-derived vault/auth/sync/autofill foundation and persona code. | Fresh production install, intended backend, create/edit/sync/export/recovery tests. Inherited code alone does not verify the configured service. |
| Trackers | Static 20-domain seed and browser DNR rules. | Real Chrome/Firefox MV3 blocking/counting validation, broader coverage and updates. No runtime blocklist updating is established. |
| Fingerprint exposure | Browser probes and measurement/reporting. | Real-browser accuracy, error handling and honest labels; this is not verified fingerprint mitigation. |
| Persona separation | Firefox container descriptors/runtime integration. | Demonstrate cookie isolation in Firefox; do not promise equivalent Chromium isolation. |
| Phishing | Inherited local checking against downloaded feed. | Warnings, disable/offline behavior and disclosure of upstream feed dependencies. |
| Breach/exposure lookup | Backend-dependent client flow. | Selected backend support and explicit unavailable behavior; do not assume every Vaultwarden configuration supports it. |
| Privacy dashboard / AI-media detector | Implementations and logic tests. | Browser behavior, model loading/performance and accurate limitations. No objective safety guarantee. |
| Production onboarding | First-install service still sets the welcome URL to Bitwarden's browser-start page. | Repoint it and test a fresh production install; development flags can conceal the behavior. |
| Backend/domain availability | Configured default origin and an older documented launch-prerequisite finding. | Recheck ownership, DNS, HTTPS and intended backend now; this review does not assert current domain status. |

Sources: [tracker seed](../../apps/browser/src/privacy/trackers/tracker-blocklist.ts),
[container mapping](../../apps/browser/src/privacy/persona-container.ts),
[first-install service](../../apps/browser/src/platform/services/browser-initial-install.service.ts),
[feature reference](features.md), [browser checklist](browser-validation.md).

## Recorded checks and remaining release gates

- [Automated tests](https://github.com/Blackmarket-coa/blackmask/actions/runs/41747383072)
  passed, including browser/web tests and typechecking.
- [Browser build](https://github.com/Blackmarket-coa/blackmask/actions/runs/41747383148)
  and [web build](https://github.com/Blackmarket-coa/blackmask/actions/runs/41747383091)
  passed.
- [Lint workflow](https://github.com/Blackmarket-coa/blackmask/actions/runs/41747383090)
  failed at lint and cargo deny.
- The [manual browser checklist](browser-validation.md) remains outstanding in
  the reviewed source. Unit tests do not prove DNR blocking, cookie isolation,
  installed production defaults or real backend sync.

For each feature, record implemented/tested/browser-verified/backend-verified
separately, with environment, flags, evidence URL, result and owner. Resolve
critical auth, sync, unsafe-default and privacy-claim failures before release;
hide optional unfinished paths with their background effects safely disabled.
