# Blackmask Product Strategy

**Status:** Product strategy  
**Scope:** Blackmask browser/privacy surfaces and its relationship to Blackout  
**Principle:** Blackmask must be a painkiller, not a vitamin.

## 1. Product thesis

Blackmask exists to solve privacy, surveillance, identity, and personal-data problems people already experience. It should make users measurably safer and more in control in the ordinary course of browsing, communicating, organizing, and maintaining relationships—not ask them to adopt a collection of abstract security tools because privacy is theoretically important.

The product should become part of a user's everyday digital routine. When people think about protecting their identity, browsing, personal information, and private conversations with friends, they should think of Blackmask.

**Core promise:** Understand what is exposed, reduce unnecessary exposure, choose how to present yourself, and communicate with your people through the connected Blackout ecosystem—with honest explanations of what is and is not protected.

Blackmask should be useful on its own. Blackout makes the promise more powerful by providing the communication and community environment in which privacy has recurring social value.

## 2. The product relationship: Blackmask + Blackout

Blackmask and Blackout are complementary products with distinct responsibilities. Do not build a second messaging platform inside Blackmask or imply that the Blackmask browser extension already contains Blackout's communication features.

Blackout is the messaging and community layer Blackmask should use. Integration should make the products feel connected without collapsing their security boundaries or making Blackout a prerequisite for Blackmask's standalone v1.

| Product | Primary responsibility | User value |
| --- | --- | --- |
| **Blackmask** | Privacy, counter-surveillance, identity separation, browsing protection, exposure awareness, and personal-data control | Understand and reduce what websites, trackers, and other parties can learn or collect |
| **Blackout** | Private communication and community: messaging, direct and group conversations, Canopies and Dens, voice/video, and community participation | Stay connected, organize, share, and build trusted communities |
| **Together** | A coherent privacy and communication experience across the BMC ecosystem | Carry stronger privacy habits from browsing and identity management into everyday relationships and collective activity |

### Blackout capabilities to build around

Blackout's feature documentation describes a Matrix-based communication platform with:

- End-to-end-encrypted messaging in encrypted Matrix rooms, including direct/private rooms and group conversations.
- Reactions, replies, threads, mentions, message editing/deletion, and room-level communication controls.
- Message and media search, rich attachments, voice messages, and GIF support.
- Scheduled messages, with an important current limitation: the Blackout threat model says scheduled text is stored in plaintext by the API until sending and the resulting bot post is not end-to-end encrypted. It is refused in encrypted rooms.
- Voice/video calls, screen sharing, and stage channels using LiveKit. The current threat model describes call/townhall media as TLS-only today, with SFrame end-to-end media encryption planned; do not market calls as end-to-end encrypted until that work is implemented and verified.
- Canopies (communities/spaces), Dens (rooms/channels), roles, permissions, forums, topics, documents, education, moderation, notifications, presence, and federation.
- Privacy and safety capabilities such as burner identities, steganography, Deaddrop, metadata privacy, data deletion controls, and panic/active-defense surfaces. Their availability and maturity vary; consult Blackout's feature overview, threat model, and known limitations before describing any one as generally available.

The Discord-parity blueprint maps DMs/group DMs to private Matrix rooms, threads to Matrix thread relations, replies to Matrix reply relations, edits/deletes to Matrix replacement/redaction events, and reactions to Matrix reaction events. It describes the platform as Matrix-first, with E2EE defaults for encrypted rooms. These are the architectural foundations; feature maturity and deployment configuration still matter.

### Integration rules

1. **Reuse Blackout for messaging.** Blackmask should link users into Blackout's existing communication and community surfaces rather than duplicate chat, room, voice, or federation infrastructure.
2. **Keep the product boundary explicit.** Blackmask owns privacy and identity controls; Blackout owns communication and community interactions. Cross-product navigation and shared onboarding can connect them without assuming shared authentication, account linking, or synchronized identity until those contracts exist.
3. **Do not make Blackout a v1 dependency.** Blackmask's current v1 remains the browser extension and self-hosted web vault. Blackout integration is an ecosystem path and later product connection, not a reason to delay standalone privacy value.
4. **Respect protection boundaries.** Explain which room is encrypted, what metadata remains visible, and which features or transports have different guarantees. Never imply that scheduled messages, calls, every room, or every Blackout feature inherits the same E2EE guarantees.
5. **Keep privacy controls user-directed.** A user must be able to understand and manage what identity or persona is presented, what information is shared, and which connections or integrations are enabled. Cross-product linking must be explicit, revocable, and documented.
6. **Avoid identity conflation.** A Blackmask persona is a context-specific identity choice, not permission to impersonate another person or silently merge identities. Do not assume that a browser persona automatically changes a Blackout account identity.

## 3. Problems Blackmask must solve

Prioritize problems users can recognize immediately:

- **Tracking and profiling:** identify and reduce third-party tracking and unnecessary data collection.
- **Identity exposure:** understand where personal information and account identifiers reveal more than intended.
- **Context collapse:** keep work, business, creator, personal, and pseudonymous activity from being needlessly connected.
- **Browser fingerprinting:** show users how identifiable their browser may be and explain practical ways to reduce exposure. Distinguish measurement from protection; a fingerprint test alone does not reduce fingerprintability.
- **Phishing and deceptive content:** help users recognize suspicious destinations and understand why an interaction is risky.
- **Data visibility and control:** make it easier to inspect, correct, export, and manage information held in the user's vault or other connected services where supported.
- **Self-censorship and social risk:** give people practical ways to choose how they present themselves and communicate with trusted people without promising immunity from surveillance or consequences.

A feature belongs in the product when it reduces one of these real risks, makes the user's choices clearer, or removes friction from a repeated privacy task.

## 4. Identity and the unmasking metaphor

Blackmask's identity model should make it easier to be oneself in different contexts—not encourage deception.

Use the playful trickster / unmasking metaphor as a statement of agency: people can choose what to reveal, when to reveal it, and which context they are participating in. Pseudonymity can give people room to express themselves among trusted friends and communities without exposing every part of their offline identity.

Support clear context separation, such as:

- Real / personal
- Business
- Creator
- Anonymous or pseudonymous

Explain the limits of each layer. A separate persona does not guarantee anonymity: account recovery, email forwarding, payment records, device identifiers, browser characteristics, writing patterns, contacts, and behavior can still connect identities. Warn users when a chosen alias or configuration points back to a real identity.

## 5. The daily-use loop

Blackmask must not be a dashboard people open once and forget. It should form practical habits that reinforce one another:

1. **Notice:** surface a meaningful exposure, tracker, risky permission, phishing signal, or identity leak.
2. **Understand:** explain in plain language what is being revealed, to whom, and why it matters.
3. **Act:** offer a concrete protective action the user can take immediately.
4. **Choose identity:** let the user select the appropriate persona or context where supported.
5. **Connect:** make it natural to continue a private conversation or participate in a trusted community through Blackout.
6. **Review:** show what changed and what remains exposed, without overstating the result.

The strongest recurring habit is social: people return because their friends, groups, and communities are there. Blackout supplies that social context; Blackmask supplies privacy and identity controls that make participation more comfortable and informed.

Avoid dark patterns, fear-based alerts, meaningless privacy scores, and engagement loops that reward compulsive checking. Measure useful protective actions and successful communication—not anxiety or screen time.

## 6. Product experience principles

- **Painkiller first:** lead with a concrete user problem and an action, not a list of security terminology.
- **Useful without a security degree:** explain technical concepts in plain language and show the next practical step.
- **Private by default, transparent by design:** minimize collection and make data flows, permissions, retention, and integrations understandable.
- **User control is real:** users should be able to inspect, edit, export, delete, and revoke access to their information wherever the underlying service supports it.
- **Progressive disclosure:** simple protections should work without configuration; advanced controls should be available without overwhelming new users.
- **Interoperable, not captive:** preserve open protocols and user portability where possible. Do not make privacy dependent on locking users into one service.
- **Honest threat models:** distinguish local protection, encrypted content, metadata protection, anonymity, and availability. State what a compromised device, recipient, homeserver, network observer, or third-party service can still learn.
- **Accessible pricing:** core safety should not be artificially crippled to force an upgrade. Monetize useful infrastructure and optional advanced capabilities without selling personal data or message content.

## 7. Business and ecosystem model

Blackmask should not depend on monetizing surveillance data. Its business model should align revenue with useful privacy capabilities, dependable infrastructure, and user trust.

Potential value-based offerings, subject to implementation and security review:

- Optional advanced privacy and identity-management capabilities.
- Additional self-hosting, backup, or administration conveniences where they can be delivered safely.
- Privacy-preserving infrastructure and service tiers.
- Ecosystem capabilities that connect Blackmask and Blackout without selling access to personal data or encrypted content.

Billing, analytics, and entitlement systems must remain content-blind. Do not let subscription status or marketing analytics reveal message contents, private-room membership, browsing history, or persona details beyond what is strictly required to provide a user-requested service.

## 8. Priorities and sequencing

### Priority 1 — Make standalone Blackmask trustworthy

- Validate the existing browser extension features in real browsers before public claims or store submission.
- Complete launch prerequisites for the default service endpoint and clearly document self-hosted operation.
- Explain what tracker blocking, fingerprint measurement, phishing protection, persona storage, and data-exposure surfaces actually do—and their limitations.
- Ensure privacy controls and data-management flows work reliably.

### Priority 2 — Connect the everyday experience to Blackout

- Define explicit cross-product navigation and onboarding.
- Design an opt-in, revocable account-linking contract only if it is needed; do not assume it already exists.
- Let users move from privacy and persona guidance into the appropriate Blackout conversation or community surface.
- Keep persona selection and Blackout identity semantics clear; do not silently synchronize identities.
- Add shared privacy education that explains room encryption, metadata, scheduled-message limitations, and call-media status accurately.

### Priority 3 — Deepen privacy across the ecosystem

- Coordinate Blackmask privacy controls with Blackout's room, device, identity, metadata, and data-deletion controls.
- Improve consistency of privacy explanations and user-facing threat models across products.
- Prioritize independent review and validation of high-risk features before expanding claims or reach.

Do not duplicate Blackout messaging features in the Blackmask repository. Do not pull future Blackout capabilities into Blackmask's shipping claims until they are implemented, enabled, and verified.

## 9. Measures of success

Measure whether Blackmask solves real problems and becomes a trusted daily tool:

- Users who complete a protective action after an exposure is explained.
- Reduction in blocked tracker requests and repeat exposure for users who enable protection (reported locally or in privacy-preserving aggregate form).
- Users who create and successfully use context-separated personas.
- Users who understand the limits of their fingerprint exposure and take a measurable mitigation step.
- Successful completion of data review, export, correction, and deletion flows.
- Retention driven by meaningful use—not notifications, streak pressure, or time spent.
- Opt-in movement from Blackmask into Blackout and continued use of trusted conversations/communities, without collecting message content.
- User-reported trust, comprehension, and confidence in privacy controls.
- Security findings, remediation time, and independently verified protection claims.

Never collect message content, browsing history, or persona contents to calculate product engagement. Prefer on-device measurement and minimal, opt-in aggregate telemetry.

## 10. Non-negotiable claims discipline

Blackmask must never promise:

- Absolute anonymity or invisibility.
- Immunity from AI-based identification or surveillance.
- That a pseudonym cannot be linked to a real person.
- That every Blackout message, scheduled message, call, attachment, or room has identical encryption guarantees.
- That a privacy score is a guarantee of safety.
- That a feature is available or validated merely because code or a design document exists.

Product copy must match the current implementation, deployment configuration, tests, and threat model. When those disagree, use the more conservative claim and fix the documentation.


## 12. Location privacy and Coalition operations (proposed integration)

Blackout Coalition owns the map, operational status, tasks, volunteer slots, assets, routes, and field reports. Blackmask owns **the user's ability to understand and control the privacy consequences** of using them. Do not add a parallel map, force tracker, or operations database to Blackmask.

### Useful Blackmask capabilities

1. **Location sharing control panel:** Show active and recent permissions, intended audiences, precision, expiration, and a clear stop-sharing action. Use exact / approximate block / neighborhood choices only when the underlying provider actually enforces them; never label a rounded coordinate "anonymous."
2. **Consent and expiry:** Default to off; require explicit, per-session opt-in for any live location. Require bounded duration, visible recipients, and automatic expiry. No streaks, social pressure, or rewards for revealing location.
3. **Identity-context guardrails:** Warn before location or operational activity can connect a pseudonymous Blackmask persona with a real name, other persona, Blackout account, or public Coalition activity. Do not automatically map browser personas onto Matrix identities.
4. **Third-party map exposure:** Warn when remote tile, geocoding, or routing providers receive map requests that may disclose the viewed area, IP address, or usage patterns. Prefer a self-hosted/offline map option for sensitive activity, owned by Blackout infrastructure.
5. **Check-in without tracking:** Favor voluntary status updates and buddy check-ins over continuous GPS. Blackout owns the check-in workflow; Blackmask explains what data is disclosed and helps users review permissions.
6. **Sharing audit and revocation:** Make it easy to inspect sharing recipients and stop future transmissions. Explain that stopping sharing does **not** retract locations already seen, cached, screenshot, forwarded, or stored on other devices or servers.
7. **Location metadata literacy:** Explain that time, route, repeated approximate positions, volunteer shifts, and spot reports can reveal home/work patterns and identities even when exact coordinates are hidden.
8. **Fail safely:** If encryption, authorization, recipient validation, or delivery is uncertain, do not silently downgrade sensitive location sharing to a public channel. Display a failure and require an informed choice.

### Cross-product release gates

- **Authorization first:** Blackout must verify per-object/per-layer audiences (public, coalition, operations team, Steward) on the server, not only hide UI controls. Confirm the latest Coalition audit findings are resolved before connecting sensitive Blackmask controls to Coalition data.
- **No live dots in open-join groups:** Limit sensitive live-sharing designs to restricted, verified audiences; room membership changes and invitations must be accounted for.
- **Do not claim secure live sharing before verification:** Matrix live-location event support, client interoperability, encryption behavior, retention, and decryption reliability require implementation tests. An encrypted room does not by itself prove that position history disappears from servers or recipients.
- **Protect against location history:** Avoid creating a persistent plaintext location history. Document ciphertext retention, Matrix event history, backups, recipients' copies, server metadata, and device-compromise risks.
- **Validate operational reliability:** Resolve relevant decryption and delivery failures before positioning check-ins or live sharing as safety-critical.
- **Keep infrastructure ownership clear:** Offline tiles, spatial objects, status boards, assets, operational lifecycle, reports, and LoRa/mesh transport remain Blackout/Coalition responsibilities.

### Suggested sequence

- **Phase A — Privacy specification:** Define audiences, precision semantics, data flows, retention, threats, third-party map requests, consent, and stop-sharing behavior. Audit Blackout authorization and map providers.
- **Phase B — Blackmask privacy UX:** Prototype a location-permission dashboard, exposure explanations, identity-context warnings, and revocation flows. Use mocked integrations until Blackout contracts exist.
- **Phase C — Blackout integration:** After authorization, encryption, and delivery gates pass, connect to Blackout's consented location/check-in APIs and encrypted communication surfaces. Test across devices, offline recovery, room membership changes, and expiry.
- **Phase D — Independent validation:** Security review and user testing of claims, controls, and failure states before release.

**Product success:** Users can correctly answer "Who can see me? What can they see? How long can they see it? How do I stop?" without assuming absolute anonymity or guaranteed erasure.

**Evidence status:** The Coalition implementation observations that motivated this section were supplied as a 2 November review, not independently revalidated here. They are inputs for verification, not claims of currently deployed or working live-location functionality.

## 11. Source documents to keep aligned

- Blackout feature map: Blackmarket-coa/blackout/docs/features/OVERVIEW.md
- Blackout messaging/Discord parity map: Blackmarket-coa/blackout/docs/features/discord_parity_blueprint.md
- Blackout authoritative threat model: Blackmarket-coa/blackout/THREAT_MODEL.md
- Blackout feature documentation index: Blackmarket-coa/blackout/docs/features/README.md
- Blackmask implementation reference: docs/black-mask/features.md
- Blackmask engineering scope and sequencing: docs/black-mask/engineering-execution-plan.md

Re-check these sources whenever messaging behavior, encryption posture, integration contracts, or product scope changes.
