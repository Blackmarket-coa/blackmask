# Consolidation Status — Black Mask

Part of the 2026-08-28 seven-repo BMC consolidation review. The canonical review — audit verdicts,
decisions, and the ordered roadmap — is `docs/REPO_CONSOLIDATION_REVIEW.md` in
`Blackmarket-coa/free-black-market`.

## This repo's verdict

- **Role re-scoped: persona/credential manager and trust-signal source — not an identity
  provider.** The ecosystem IdP decision went to Matrix OIDC/MAS (the surface already exists in
  Blackout's Synapse fork). This repo has no authorization-server capability and does not grow one;
  its persona vault, privacy score, and security-posture signals feed vendor trust scoring instead.
- **Shipping surfaces are the browser extension and the self-hosted web vault.** Desktop and CLI
  are rebranded but have no build workflows; they stay deprioritized until a concrete need exists.
- The 8 privacy features all have real code behind default-on feature flags but none are
  browser-validated yet — `docs/black-mask/browser-validation.md` is the outstanding checklist.

## Actions taken on this branch

- Removed the ~1.2 GB `third_party/` vendored source trees (reference-only, never part of the
  build). The inventory with pinned upstream commits survives at `third_party/README.md`.
  GitHub-side size reclaim needs a separate, deliberate history rewrite — not done here.

## Queued (see the canonical review, §6)

- W2: none of the IdP work lands here; Black Mask consumes the shared login like every other app.
- W4: expose security-posture signals (2FA on, no leaked credentials, verified persona) as
  `karma_event` inputs to FBM's reputation log.
