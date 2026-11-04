# Blackmask — Location Privacy Control Center MVP

**Status:** Proposed; not implemented  
**Product boundary:** Blackmask privacy controls and explanations; Blackout owns Coalition maps, messaging, operations, and location transport  
**Dependency:** Standalone Blackmask browser-extension/web-vault v1 remains the launch priority. This is a later, separately gated MVP, not a new v1 launch requirement.

## 1. Problem and promise

People joining location-aware communities and operations cannot easily answer: **Who can see my location? How precise is it? How long is it shared? How do I stop?** The same activity may expose identity through map requests, timestamps, audiences, or repeated approximate positions.

**MVP promise:** Give users a truthful view of the location exposure Blackmask can observe, actionable controls for integrations it actually manages, and a clear explanation of what remains outside its control.

**Primary user story:** As a member of a trusted Blackout Coalition, I want to review a proposed location-sharing session, understand its audience and expiration, and stop future sharing without believing that already-delivered coordinates have been erased.

## 2. MVP scope and acceptance criteria

| ID | Capability | Minimum acceptance criteria |
| --- | --- | --- |
| M1 | Location privacy overview | A single screen lists Blackmask-managed sharing sessions and their states: pending, active, expired, stopped, failed. It distinguishes connected integrations from external browser/OS permissions it cannot manage. |
| M2 | Consent summary | Before starting a supported session, display requesting product, selected identity/account, audience, precision, purpose, and end time; no preselected consent. |
| M3 | Audience and identity warning | Identify whether audience is restricted or potentially open-join. Warn when sharing could connect personas or reveal routine locations; block unsupported or unknown audiences rather than treating them as private. |
| M4 | Precision and metadata explanation | Explain exact, approximate/block, and neighborhood precision as *requested semantics*, not anonymity guarantees. Only offer a precision choice if the provider can enforce it; show effective precision where verified. |
| M5 | Time-boxed sharing | Require a finite duration; display remaining time; integration must stop new transmissions at expiry. On disconnect, the sender must fail closed rather than keep broadcasting. |
| M6 | Stop sharing | A prominent stop action halts future sends for a Blackmask-controlled session and reports confirmed, pending, or failed revocation. Explicitly say previously shared data may persist with recipients, devices, or servers. |
| M7 | Map-provider privacy notice | Explain that third-party map tiles/geocoding/routing may expose IP and viewed area; show provider only when known. Never assert that all map requests are private. |
| M8 | Failure transparency | If encryption, audience authorization, expiry enforcement, or session state cannot be verified, disable start/resume and show an actionable error; never silently downgrade to plaintext or public sharing. |

### MVP user flow

1. User opens **Location Privacy** from Blackmask.
2. Screen explains what is managed, what is merely informational, and whether Blackout is connected.
3. A Blackout-initiated sharing request, *when a verified integration exists*, presents audience, identity, precision, and expiry.
4. User explicitly accepts or declines. Default is **decline**.
5. During an active session, Blackmask shows recipient scope, precision, remaining time, and **Stop sharing**.
6. On stop/expiry/failure, Blackmask reflects the verified state and explains limits of deletion.

### No Blackout integration yet: useful standalone slice

Ship a local-only **Location Privacy Review** screen first if Blackout contracts are not ready:
- Explain location-related browser permissions **only where browser APIs actually expose them**; link to native browser/site settings when Blackmask cannot revoke them.
- Show an educational map-provider exposure explanation and persona/location correlation risks.
- Use an explicit **demo/simulated session** for UX testing; never represent mock state as live protection.
- Do not request geolocation, poll GPS, or create location history to populate the dashboard.

This standalone slice is a valid milestone, **not** evidence that live sharing is protected.

## 3. Hard boundaries / not in MVP

- No GPS watcher, background position collection, location-history database, or location analytics.
- No Coalition map, pins, polygons, operations board, volunteer slots, assets, route planning, check-in dispatcher, spot reports, or LoRa transport.
- No Matrix live-location protocol implementation inside Blackmask; Blackout owns transport and recipients.
- No automatic linking of browser personas and Blackout accounts.
- No universal claims about controlling OS permissions, third-party apps, recipient devices, or homeserver retention.
- No panic-wipe promise that purges already-delivered location data.
- No nudges, streaks, social rewards, or default opt-in for location sharing.

## 4. Proposed integration contract (must be agreed and verified before live use)

Blackmask needs a minimal, authenticated Blackout interface:

- **Read session:** opaque session ID, requesting product, account/identity label, audience description and authorization status, effective precision, start/end timestamps, verified state, and protection/retention disclosures.
- **Start/approve:** explicit user approval bound to the exact audience, identity, precision, and expiry; changes require fresh approval.
- **Stop:** idempotent request to cease future transmissions; return acknowledged state or an explicit unknown/failure state.
- **Status update:** authenticated state changes for active, stopped, expired, failed, and disconnected. Do not interpret a missing update as proof of termination.
- **Security:** authorization enforced server-side for all recipients and Coalition objects; encrypted-room and event behavior tested; no fallback to open-join/public channels.
- **Data minimization:** Blackmask should not need raw coordinates to manage a session. Do not copy live location payloads or message content into the Blackmask vault, logs, telemetry, or analytics.

The protocol, API endpoints, authentication, Matrix event types, and exact retention behavior are **not yet verified**. This section defines required behavior, not existing endpoints.

## 5. Threats and release gates

Before enabling live sharing:
1. Re-audit Blackout Coalition's per-object/per-layer authorization and Matrix power-level enforcement. A UI-only visibility filter is insufficient.
2. Confirm client and homeserver support for the selected location-sharing event format, encryption, expiry semantics, and recipient handling.
3. Investigate and resolve relevant `DecryptionError` and delivery reliability defects; no safety-critical claims until failure handling is tested.
4. Verify stop and expiry behavior when offline, after reconnect, across devices, and when membership changes.
5. Verify whether map requests reach third-party providers; document and mitigate exposure in Blackout's map infrastructure.
6. Review plaintext/ciphertext storage, Matrix event persistence, logs, backups, recipient copies, and metadata. **E2EE does not imply no server history or metadata.**
7. Confirm deployment and feature availability independently; code or planning docs do not establish that Coalitions are live.

**Release rule:** If these gates fail, release only the standalone privacy-review/education slice and keep live-sharing controls disabled.

## 6. PR-sized build plan

| PR | Scope | Definition of done |
| --- | --- | --- |
| PR 1 | UX/spec and threat-model update | States, consent copy, recipient semantics, data-flow diagram, and failure cases reviewed; no runtime permissions added. |
| PR 2 | Local privacy-review screen | Screen available behind a feature flag in browser extension; no GPS access or networked location collection; browser limitations accurately explained. |
| PR 3 | Session UI with mock adapter | Consent, expiry, stop, error, and disconnected states testable against simulated data; prominent demo labeling. |
| PR 4 | Blackout contract and authorization verification | Documented, tested contract and evidence for audience authorization, encryption, retention, and stop/expiry behavior. Blocked until Blackout is ready. |
| PR 5 | Gated real integration | Connect authenticated session status and stop/approval actions; end-to-end tests across failure, offline, identity, and audience changes. |
| PR 6 | Security/accessibility validation | Independent security review, keyboard/screen-reader tests, plain-language comprehension tests, telemetry audit, and launch checklist. |

**Suggested implementation location:** Browser-extension privacy UI under `apps/browser/src/privacy/` and its popup route, consistent with the existing execution plan. Keep integration adapters isolated; do not add new cryptography to Blackmask.

## 7. Acceptance tests

- Default state never transmits or requests a position.
- Unknown audience, absent expiry, unsupported precision, or failed authorization blocks sharing.
- Persona mismatch triggers a warning and requires an explicit decision; no automatic cross-product identity merge.
- A stopped or expired session cannot silently restart after browser refresh or network reconnect.
- When stop acknowledgment fails, UI says **not confirmed**, rather than claiming location sharing ended.
- Users can identify recipients, effective precision, end time, and stop action without technical knowledge.
- No coordinates, message contents, persona contents, or recipient lists are emitted to product analytics.
- Browser permissions that Blackmask cannot revoke are never presented as revoked.
- Automated and manual tests verify accessible controls and all empty/error states.

## 8. Success criteria

**Product:** A test participant can correctly answer the four core questions and complete a stop action in a connected test environment.  
**Privacy:** No background GPS polling, raw-coordinate storage, or hidden telemetry in Blackmask.  
**Reliability:** Every state transition is confirmed or explicitly marked uncertain; no silent plaintext/public fallback.  
**Scope:** The feature can remain disabled without impairing Blackmask's standalone browser-extension and web-vault v1.

## 9. Source alignment and evidence status

- Blackmask: [product strategy](./product-strategy.md), [features](./features.md), [execution plan](./engineering-execution-plan.md).
- Blackout: `docs/features/OVERVIEW.md`, `docs/features/discord_parity_blueprint.md`, and `THREAT_MODEL.md`.
- Coalition map/location observations supplied from a **2 November 2026 code review** are leads for verification, not independently confirmed deployment or security guarantees.

**MVP decision:** Build the privacy-review screen now if desired; only ship real-time sharing management after Blackout's security and integration gates pass.
