# Blackmask privacy controls and Blackout reuse

**Updated:** November 27, 2026  
**Status:** Approved plan addition; no implementation, activation, dependency import or deployment. Existing browser feature evidence remains in the [audit register](feature-audit-register.md); planned mobile behavior is not browser or production verification.

## 1. Keep the existing navigation simple

Keep Chats / Spaces / Vault as the primary navigation. Put **Protection & privacy** under the existing profile/mask menu, consistent with [app-plan.md](app-plan.md#9-protection-privacy-and-ecosystem-tools). Do not add a fourth primary tab or another mandatory dashboard.

Use the same six expandable sections as Blackout's existing Privacy tab: **Screen & notifications**, **People & activity**, **Sharing & metadata**, **Location & identity**, **Devices & connected tools**, and **My data & cleanup**. Contextual conversation, vault and share-sheet controls open those canonical editors. Browser-only tools remain labeled with their actual platform.

Blackout's companion [privacy controls plan](https://github.com/Blackmarket-coa/blackout/blob/develop/docs/product/BLACKOUT_PRIVACY_CONTROLS_PLAN.md) inventories existing Blackout controls and defines the shared visual-privacy requirements. Alignment is an interaction/ownership contract, not a second messenger, a merged vault or assumed shared login.

## 2. Existing Blackmask features and what they establish

Reviewed current main-branch [feature reference](features.md), [audit register](feature-audit-register.md), app plan and OSS inventory. Source/limited-browser evidence does not mean full cross-platform verification.

| Existing foundation or feature | Present evidence / limits | Privacy section |
| --- | --- | --- |
| Bitwarden-derived vault, credentials/notes/identities and encrypted attachments | Existing foundation; scoped local Chromium lock/unlock, attachment, export and Send evidence. Auto-timeout, supported biometric/PIN behavior, hosted backend and other platforms require their own checks. | Devices & connected tools / My data & cleanup |
| Persona vault and configured email aliases | Implemented Identity cipher reuse and layer controls; alias-forwarder behavior and browser/backend support remain provider-specific. Plus-addressing and catch-all domains can connect identities. | Location & identity |
| Per-persona containers | Implemented Firefox contextual-identity workflow; not available on Chromium and not independently anonymous Matrix accounts. Firefox runtime verification remains outstanding in the inspected register. | Location & identity; browser companion only |
| Tracker detection/blocking | Local extension counting and Chromium DNR seed blocking exist; inspected scoped Chromium evidence. Small curated list; browser manifest differences apply. | Devices & connected tools; browser scope only |
| Fingerprint exposure test | Local on-demand measurement exists; weighted score is an estimate, not a population-validated uniqueness measure or a protection that changes the fingerprint. | Devices & connected tools |
| Privacy dashboard/score | Existing local account-health and exposure summary. A high score does not establish absence of surveillance or prove account/device security. | Link within Protection & privacy; do not build another score |
| Phishing protection | Existing local blocklist engine and control surface, with platform/flag/account limits. Blocklist updates use the upstream service; inspected browser evidence does not establish every warning path. | Devices & connected tools |
| Breach exposure lookup | Explicit user action through the configured backend; real data depends on backend/provider setup. Review onward provider data flow rather than promising no third-party handling. | My data & cleanup |
| On-device AI media detector | Implemented optional inference surface; model weights download externally. Inspected browser run did not validate model download/classification. Estimate, not authenticity or identity proof. | Sharing & metadata → Inspect media |
| Controlled Send links | Existing scoped local evidence for text/file Send. Access, expiry and revocation govern the service, not copies already obtained by recipients. | Sharing & metadata |
| Encrypted messenger/private Spaces | Approved app direction reuses Blackout Matrix; standalone browser features do not establish complete mobile messaging, room authorization or call E2EE. | People & activity / conversation details |
| Location control center and nearby-device tools | Documented optional integrations/research, not shipping detection or a new tracking backend. | Location & identity; show only supported capabilities |
| Browser/network OSS references | Reference inventory, not imported protections. Native VPN/firewall, Tor and system-wide blocking require separate implementation and platform verification. | Optional companion details; never claim protection from a website alone |

Retain exact runtime status, limitations and failure/unavailable states. Do not silently promote any audited feature to Verified through this planning update.

## 3. Which Blackout protections Blackmask can use

| Protection | Blackmask application | Ownership and limitation |
| --- | --- | --- |
| Privacy View / hold-to-reveal | Conceal chats, private Space content, search snippets, vault notes/passwords, recovery fields, document previews and share sheets; reveal only the chosen content briefly | Implement per surface; accessible alternatives; readable content remains recordable |
| Concealed identifying context | Hide names, avatars, room titles, mask labels, sensitive places, thumbnails and notification text until deliberately revealed | Does not create an anonymous account or remove server metadata |
| Immediate Cover screen | Cover both messenger and vault without deletion; preserve unsent work safely | Screen covering, vault locking, stopping live publishing and cleanup are distinct actions |
| Native capture controls | Android FLAG_SECURE; supported iOS recording/mirroring state detection and redaction; app-switcher cover | Host-level work in the selected shell; no reliable external-camera defense; no general iOS screenshot-prevention promise |
| Notification privacy | Generic push/lock-screen notices by default, deliberate previews, quiet hours and per-conversation choices | Coordinate chat service and OS payloads; OS/push timing metadata remains |
| Image metadata removal / link cleanup | Evaluate reuse for outgoing supported chat images and links; destination and unsupported-format review | Blackout source does not automatically make this implemented in Blackmask; retain existing file integrity and encryption |
| Receipt/typing controls | Distinguish displaying incoming indicators from emitting your own; add presence/discovery/request policy where supported | Blackout/Matrix owns the protocol; confirm actual outbound behavior |
| Private sharing/audience review | Explicit recipient, presented identity, room encryption, attachments and external tools before delivery | Preview does not substitute for backend authorization; copies survive revocation |
| Devices and recovery | Contact/device verification, changed-key review, session revocation and accurate recovery information | Separate Matrix recovery from vault recovery and release keys |
| Location and identity separation | Optional location consent, precision/recipient/expiry review; warn before cross-context links | Blackout owns Coalition; do not collect GPS or require contact upload to populate this screen |
| Data transparency and cleanup | Per-store inventory, export/deletion coverage, selected local cleanup and irreversible-key warnings | Do not transplant Blackout's limited Panic Wipe and claim all vault/Matrix/OS data is erased |
| Shield resource/permission inspection | Optional inspection of the embedded page's own resources/permissions | Detection-only page scope; not an outside-camera sensor or phone-wide malware scanner |
| Experimental anti-OCR | Evaluate protected text-image backgrounds on selected non-secret previews against current systems | Research-only, off by default; not core protection and never a claim that readable secrets become unusable |

Share reviewed concepts and compatible components where appropriate; license/runtime review is required before copying code. Do not copy Blackout's entitlements, current tier assumptions, tokens or stores as a side effect.

## 4. Vault-specific protection requirements

- **Separate locks:** chat may remain available while the vault is locked. Revealing a chat or enabling Privacy View never unlocks the vault; re-authentication and key-access controls enforce that separation.
- **Reveal sensitive fields narrowly:** reveal only the selected field after vault authorization, with a short explicit timeout and immediate re-cover on focus/lifecycle changes. Recovery secrets should remain hidden until the user deliberately opens them.
- **Clipboard controls:** user-directed copy with a supported clear timeout and accurate failure indication. Clearing must not overwrite a newer unrelated clipboard value where change detection is supported. OS clipboard history, synchronization, keyboards and past recipient copies remain outside a guaranteed erase claim.
- **Vault-to-chat review:** unlock, select one item, review recipient/identity/content and choose the supported encrypted attachment or controlled Send mechanism. Never hand vault keys or the whole decrypted vault to chat, plugins, analytics, the shell or AI.
- **Remote data boundaries:** no decrypted vault data sent to external AI services. Optional media analysis is local where implemented; model downloads and any explicit remote analysis of non-vault material have clear recipients and scope.
- **Export/cache privacy:** authenticate exports as required by the vault model; prefer supported encrypted exports; warn before plaintext export. Inventory thumbnails, attachments, temporary files, downloads and backup copies separately.
- **Revocation and recovery:** distinguish removing a session, losing local keys, server-side deletion, and revoking a Send link. None implies erasure of previously downloaded content.
- **No destructive panic shortcut by default:** Cover screen is immediate and reversible. Local cleanup and key deletion need exact scope, confirmation and recovery consequences; do not wire screen covering to release/dead-man triggers.

## 5. Native shell, browser and accessibility boundaries

The accepted [mobile shell option](mobile-shell-options.md) separates Blackout chat and Blackmask vault into embedded surfaces. Apply capture/lifecycle protection at the native host where necessary and validate **both WebViews**, dialogs, loading/error pages, navigation transitions, keyboards and app snapshots. CSS in one page cannot be assumed to protect a cross-origin sibling. Host privacy actions must not expose vault plaintext through a JavaScript bridge.

Android protection covers standard OS-supported capture paths, subject to platform/device limitations. On iOS, observe supported scene capture state and substitute sensitive views during active recording/mirroring; screenshot notifications arrive after capture. Browser/PWA/extension views cannot reliably block or detect every screenshot or outside camera. Compromised endpoints and authorized recipients remain outside a screen-scrambling guarantee.

Cover/reveal must work with keyboard, screen readers, large text and reduced motion. Screen-reader exposure follows the user's deliberate reveal state; do not leave concealed text exposed in accessibility labels, live regions or hidden DOM. Do not require camera access, gaze tracking, contact upload, flashing overlays or continuous environmental monitoring.

## 6. Optional anti-OCR research

[ProTegO](https://github.com/Ruby-He/ProTegO) provides an MIT-licensed research implementation targeting OCR extraction from text images. Evaluate its license/dependencies, compute costs and actual camera/video robustness before adoption. It is different from art-style defenses such as Glaze and from Blackout's faint avatar pattern.

Keep this candidate optional and off by default. Test screenshots and camera photos/video against multiple current OCR/vision systems, transformations and preprocessing; measure human reading, battery, latency and accessibility. Continuous recording may collect successive reveals. A clear recording remains human-readable even if some extraction systems fail.

The [visual-defense study](https://openrepository.aut.ac.nz/items/88371f0d-0b46-492f-86e9-c297836e1135) reports that evaluated modern OCR often resisted custom-font, color and line interference. Treat proposed benefit as measured friction, not encryption, immunity to scraping or proof that surveillance footage is unusable.

No remote private-text upload is permitted just to generate an adversarial pattern. No misleading accessibility text or adversarial prompt instructions. Keep experimental labels tied to measured scope and disable unsupported paths truthfully.

## 7. Delivery sequence and acceptance

| Order | Deliverable | Acceptance |
| --- | --- | --- |
| 1 | Consolidated Protection & privacy entry | Chats/Spaces/Vault stay primary; old browser routes and flags remain discoverable; clear platform/scope/status labels; no duplicate settings or identity stores |
| 2 | Shared Cover screen and field/message reveal | Verify timeout, release/cancel, focus, navigation, loading, errors and background transitions with no plaintext flash; cover both WebViews |
| 3 | Native capture and notifications | Physical Android/iOS release-build screenshots, recording/mirroring, app snapshots and lock-screen payloads; unsupported capability fails visibly |
| 4 | Vault boundaries and sharing | Locked-vault/chat coexistence; selected-item sharing only; keys inaccessible to host/chat/plugins/AI; safe clipboard behavior and verified recovery |
| 5 | Protocol/privacy settings | Actual receipt/typing suppression, request/block enforcement, supported metadata cleanup, remote-fetch consent, device revocation and identity warnings |
| 6 | Data and optional research | Accurate export/cleanup coverage and external-provider disclosures; reproducible anti-OCR results before any protection claim |

Core encryption, covering, basic capture controls, notification privacy, essential recovery and accessibility stay free of purchase/reward gates. Optional enhancements retain one-time purchase rules; hosted storage is the only recurring charge under the existing monetization plan.

## 8. References

- [Blackout privacy controls plan](https://github.com/Blackmarket-coa/blackout/blob/develop/docs/product/BLACKOUT_PRIVACY_CONTROLS_PLAN.md)
- [Current Blackmask feature reference](features.md), [audit register](feature-audit-register.md), [app plan](app-plan.md), [privacy/security research](privacy-security-oss-research.md), [location privacy](location-privacy-mvp.md)
- [Android FLAG_SECURE guidance](https://developer.android.com/security/fraud-prevention/activities)
- [Apple capture-state protection](https://developer.apple.com/documentation/swiftui/protecting-sensitive-content-when-screen-sharing)
- [Apple screenshot notification](https://developer.apple.com/documentation/uikit/uiapplication/userdidtakescreenshotnotification)
- [ProTegO](https://github.com/Ruby-He/ProTegO) and [visual-defense research](https://openrepository.aut.ac.nz/items/88371f0d-0b46-492f-86e9-c297836e1135)
