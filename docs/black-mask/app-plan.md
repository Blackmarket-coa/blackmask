# Blackmask App Plan — Private Messenger, Spaces, and Vault

**Recorded:** November 20, 2026  
**Status:** Product direction approved by the founder in conversation; implementation and release readiness remain unverified.  
**Target:** Minimalist mobile experience for iOS and Android, with browser and web companions.  
**Primary navigation:** Chats · Spaces · Vault.  
**Business rule:** Optional enhancements are one-time purchases; no enhancement subscriptions. Core encryption, essential safety, recovery, and accessibility remain available independently of purchases or rewards.

## 1. Product direction and document precedence

Blackmask should feel like a calm, familiar messenger while also providing an encrypted vault, private communities, identity control, and practical defenses against scams, impersonation, AI manipulation, and cyber attacks.

The everyday promise is: **choose who you are with, choose what they see, and communicate comfortably.** The unmasking metaphor represents agency and the ability to be oneself among trusted people.

Facebook Messenger is a familiarity reference; Signal is an encrypted-communication usability reference; Discord is a community-organization reference. These references are not claims of protocol compatibility, identical protections, or current feature parity.

This is the canonical app experience and mobile release plan. It expands the earlier browser-only product direction. The existing [standalone MVP](mvp.md) and [engineering execution plan](engineering-execution-plan.md) continue to describe the browser-extension/web-vault foundation and its release checks; their mobile and messaging exclusions do not veto this app roadmap. The [feature reference](features.md), [audit register](feature-audit-register.md), and dated evidence remain authoritative about what has actually been implemented and verified.

Reuse Blackout's messaging and community infrastructure and Blackmask's existing vault foundation. A unified Blackmask interface does not require a second messaging service, a new identity provider, or new encryption primitives.

## 2. Source review and evidence boundaries

The catalogue below records the source review used for this plan:

- Blackmask: [934fa1127ee796dd6e8976146927f28f96dc08e6](https://github.com/Blackmarket-coa/blackmask/tree/934fa1127ee796dd6e8976146927f28f96dc08e6).
- Blackout: [3c2e72fc2b63d417a63ddfad26554282f0c3a66c](https://github.com/Blackmarket-coa/blackout/tree/3c2e72fc2b63d417a63ddfad26554282f0c3a66c).
- Blackmask's latest recorded browser evidence at review time was the [November 16 Chromium run](evidence/2026-11-16-chromium-logged-in.md): 27 of 30 automated checks passed against a local Vaultwarden. This does not verify the hosted backend, Firefox, store installation, every vault operation, or mobile behavior.
- The review did not certify a deployed service, exercise the mobile app, or independently audit cryptography. Source presence, automated tests, browser behavior, backend behavior, and independent security review must be tracked separately.
- Recheck linked Blackout limitations before implementation; this is a dated inventory, not an assertion that dependencies can never change.

### Blackmask catalogue

| Capability | Existing foundation and limitation | Intended app placement |
| --- | --- | --- |
| Encrypted vault, accounts, sync | Bitwarden-derived client-side vault encryption, authentication, and synchronization code; production configuration and recovery still require verification | Vault; devices and recovery under profile |
| Credential and private-record types | Login, SecureNote, Card, Identity, and SshKey models; BankAccount, DriversLicense, and Passport types also exist. A type declaration does not prove its UI/backend availability | Vault categories after support checks |
| Autofill | Inherited browser autofill; native mobile autofill needs a separate platform integration | Browser companion; later native capability |
| Generators | Inherited password generation and configured email-alias forwarders | Vault and identity tools |
| Vault attachments | Inherited attachment interfaces; not evidence of a complete general-purpose encrypted file drive | Vault item attachments |
| Controlled text/file sharing | Inherited Send code and models include expiration, deletion date, access limits, password, disable, and recipient-related settings; verify actual client/backend behavior | Shared links and deliberate sharing flow |
| Import/export | Inherited vault portability code; export flow remains to be verified | Vault management |
| Personas | Create/edit Real, Business, Creator, and Anonymous identity records as Identity ciphers | Profile identity chooser after messaging identity contracts exist |
| Email-alias guidance | Provider integrations and warnings for linkable plus/catchall addresses; a forwarding alias is not an anonymity guarantee | Identity setup |
| Account-health audit | Local weak/reused-password checks and potential 2FA gaps against a starter domain list; missing TOTP is not proof a site account lacks every form of 2FA | Protection and privacy |
| Tracker blocking/counting | Browser rules and per-tab counts with a 20-domain starter list; not comprehensive device-wide protection | Browser companion |
| Phishing protection | Local feed-based engine, status, and toggle; feed comes from an upstream host and the full warning flow needs verification | Browser companion; future explicit chat-link integration |
| Fingerprint exposure | On-device browser exposure estimate, not fingerprint prevention | Browser companion and exposure review |
| Breach lookup | User-initiated backend-dependent email lookup; backend can report that it is not configured | Protection and privacy |
| AI-media inspection | On-device image/video classifier; downloaded model weights, bounded video sampling, uncertain results, and incomplete runtime validation | Optional Inspect action |
| Browsing separation | Firefox containers by persona layer; Chromium equivalent not implemented; separation is by layer rather than guaranteed isolation of every persona | Browser companion |
| Privacy overview | Heuristic dashboard of account/browser signals; not an objective safety score and some actual-state checks need improvement | Secondary protection screen |
| Welcome/onboarding | Bundled first-install welcome exists; milestone progress, points, reward catalogue, and broader onboarding remain planned | First run and optional setup |
| Existing clients | Browser extension and web vault are current release surfaces; inherited desktop/CLI are deprioritized | Companion surfaces |
| Native mobile shell | No native Android/iOS app in this repository at the reviewed commit | New implementation work |

Source pointers: [feature reference](features.md), [audit register](feature-audit-register.md), [record types](../../libs/common/src/vault/enums/cipher-type.ts), [Send model](../../libs/common/src/tools/send/models/view/send.view.ts), and [persona service](../../apps/browser/src/privacy/popup/services/persona.service.ts).

### Communication and community catalogue to reuse

These are Blackout capabilities or integration candidates, not automatically available Blackmask app features.

| Area | Source-backed foundation | Current boundary |
| --- | --- | --- |
| Direct and group messaging | Matrix encrypted rooms and the broader client's timeline/composer | Encrypted-room behavior and device/history recovery require end-to-end verification |
| Conversation tools | Replies, reactions, threads, mentions, edits/deletion, search, voice messages, attachments, and GIF integration in the broader client | Compact panel does not expose every full-client tool; external media services have their own exposure |
| Communities | Canopies/spaces, dens/channels, roles, permissions, announcements, member controls, moderation, forums, topics, and documents | A room's message encryption does not encrypt all community metadata or room state |
| Compact Blackmask panel | Dedicated /embed routes for joined DMs, joined communities, text/announcement channels, unread indicators, and community/channel creation | Built with partial/local test evidence; complete deployment/extension integration unverified |
| Compact-panel gaps | Existing panel omits new-DM creation, invitation management, calls, threads panel, member lists, and room settings | Required mobile flows must be added or deliberately deferred |
| Private creation defaults | Panel-created communities start invite-only; channels start private/restricted and encrypted by default | Defaults are client behavior; authorization and enforcement still need server and cross-client testing |
| Voice/video | Broader call, LiveKit, screen-share, and stage code | Reviewed call path/runtime and media-encryption gaps prevent a Signal-like calling promise |
| Scheduled messages | Server/bot scheduling implementation | Plaintext until sending; refused in encrypted rooms. Exclude from encrypted-chat launch scope |
| Plugins | Sandboxed plugin framework, discovery, and capability manifests | App integration, isolation, and permissions need validation |
| Burner identities | Broader identity tools | A Blackmask vault persona is not automatically a separate Matrix identity |
| Steganography/Deaddrop | Code and design work in Blackout | Availability varies; reviewed threat model says no shipped app flow creates a dead drop |
| Panic controls | Existing panic wipe removes selected local data | Does not erase all Matrix stores, message keys, server copies, or forensic traces |
| Dead-man switch | Experimental records, check-in, and cancellation | New arming is disabled; firing does not notify or automatically deliver a message. Exclude from safety promises |
| Transparency and privacy tools | Key/data transparency, metadata and deletion-related surfaces | Validate the exact behavior; existence does not prove anonymity or complete erasure |
| Federation/self-hosting | Matrix infrastructure and administration tooling | Hosting, identity, reliability, and metadata boundaries remain deployment-dependent |

Sources: Blackout [overview](https://github.com/Blackmarket-coa/blackout/blob/3c2e72fc2b63d417a63ddfad26554282f0c3a66c/docs/features/OVERVIEW.md), [Blackmask panel plan](https://github.com/Blackmarket-coa/blackout/blob/3c2e72fc2b63d417a63ddfad26554282f0c3a66c/docs/black-mask-chat-panel-and-account-link.md), [panel scoping code](https://github.com/Blackmarket-coa/blackout/blob/3c2e72fc2b63d417a63ddfad26554282f0c3a66c/apps/blackout-client/src/app/features/black-mask-embed/embedScope.ts), [room component](https://github.com/Blackmarket-coa/blackout/blob/3c2e72fc2b63d417a63ddfad26554282f0c3a66c/apps/blackout-client/src/app/features/black-mask-embed/EmbedRoom.tsx), [limitations](https://github.com/Blackmarket-coa/blackout/blob/3c2e72fc2b63d417a63ddfad26554282f0c3a66c/KNOWN_LIMITATIONS.md), and [threat model](https://github.com/Blackmarket-coa/blackout/blob/3c2e72fc2b63d417a63ddfad26554282f0c3a66c/THREAT_MODEL.md).

## 3. Navigation and visual direction

| Surface | First view | Controls revealed when needed |
| --- | --- | --- |
| Chats | Familiar conversation list, search, unread state, one compose action | Requests, attachments, conversation details, device verification |
| Spaces | Joined communities; a community opens its channels | Invitations, channel creation, roles, moderation, administration |
| Vault | Locked entry or recent items/search after deliberate unlock | Categories, attachments, sharing, import/export, generators |
| Profile/mask button | Current presentation identity | Identity management, protection/privacy, devices/recovery, add-ons, settings |

Use a quiet neutral palette, one accent color, restrained mask artwork, readable typography, familiar message bubbles, clear labels, and comfortable touch targets. Provide light/dark appearance and reduced motion. Pair meaningful icons with accessible labels. Never use color alone for trust or encryption state.

Use **Spaces** and **Channels** as the initial familiar vocabulary; Canopy/Den terminology can be optional. Keep Town Square, Coliseum, shopping, feeds, creator dashboards, and the Coalition map outside primary Blackmask navigation. Explicit links may open the appropriate ecosystem surface.

Avoid a security dashboard as the home screen. Surface relevant actions at the moment they matter: a new device, suspicious destination, sharing request, changed identity, or newly connected tool. Keep advanced tools discoverable without creating additional permanent tabs.

## 4. Chats and sharing

### Conversation list and composer

- Open Chats by default and return users to useful conversations.
- Provide direct/group messaging, clear pending/sent/delivered/failure states where the protocol actually supports them, search, and a visible new-conversation action.
- Design new-DM and invitation flows explicitly; they are absent from the current compact panel.
- Keep unknown senders in Requests. Proposed defaults prevent automatic opening of their links, attachments, and remote previews.
- In a conversation, show the recipient/group, the identity being presented, and a small accurate encryption status. Tapping status opens useful details.
- Reactions, replies, voice messages, and threads can reuse verified broader-client capabilities without making the default composer crowded.
- Offer usernames, QR codes, and invitations as contact paths. Do not require contact-list upload.
- Explain relevant failure states and retry safely without duplicate sending.

### Attachment menu

The initial design groups actions under one plus button:

1. Photo or file.
2. Voice message.
3. From vault.
4. Inspect media.

Inspect may also be available on a received image/clip through its context menu. These are proposed app interactions, not evidence that the current compact panel exposes them.

### Vault-to-chat sharing

1. Choose From vault.
2. Authenticate/unlock the vault explicitly.
3. Select only the intended item.
4. Review recipient, presented identity, content, and supported access/expiration controls.
5. Share through a verified mechanism and show success or failure accurately.

Never send raw credentials, the whole vault, or vault keys to the chat API, plugins, AI providers, analytics, logs, or the app shell. Distinguish an encrypted message attachment from a controlled Send link: they have different access and revocation behavior. Expiration/revocation cannot retract copies already read, downloaded, forwarded, or captured.

### Conversation details

Show the actual encryption state, participants, verified/unverified devices, current presented identity, and connected bots/bridges/tools. Explain metadata limits. A community title, membership, server routing, push timing, or unencrypted room-state document does not inherit message E2EE.

## 5. Spaces: simple groups that can grow

A small group can remain one conversation indefinitely. A growing community can add channels, announcements, invitations, roles, moderation, and administration progressively.

- Invite-only communities and encrypted eligible text channels should be the private defaults, with enforcement verified.
- Keep the channel conversation layout consistent with DMs.
- Make membership and audience clear before joining, posting, sharing a file, or installing a tool.
- Reveal advanced controls to the people who need them, in the relevant Space.
- Reuse Blackout's community infrastructure; avoid a second room database or permission system.
- Add forums, documents, shared tools, and voice only after their encryption and authorization boundaries are explicit.
- Bridges and bots must be visible. Any feature that makes plaintext available to another service requires a clear disclosure and user-directed choice.
- Design reporting so a user deliberately selects what to disclose; do not introduce silent remote scanning of encrypted conversations.

## 6. Vault: a separate security boundary

The vault is a private space with its own lock, not an always-unlocked attachment drawer.

- Chats can remain open while the vault is locked.
- Re-authentication, lock timeouts, background/app-switch behavior, notification privacy, OS storage, clipboard behavior, and device revocation need explicit designs.
- Enforce separation in key access and storage, not merely by hiding vault screens.
- Do not let a compromised plugin or an ordinary chat session unlock the vault.
- Start with search, recent items, and clear categories for supported credentials, notes, identities, documents/attachments, and shared links.
- Treat a full encrypted file drive, native autofill, and new record types as separate implementation decisions.
- Preserve user-directed import/export and document what recovery can and cannot restore.
- Blackout has its own encrypted-vault code; do not silently merge the two stores. Decide ownership and migration explicitly while retaining this repo's Bitwarden-derived foundation.

## 7. Masks and identity control

The profile button is the mask control. Users should be able to answer **Who am I appearing as here?** before communicating.

- Support familiar personal, business, creator, and pseudonymous contexts.
- An Organizer presentation is a design candidate; it is not an existing vault-layer enum.
- Define whether a choice changes a profile, a room-specific display name, or a genuinely separate account/device identity. Show that distinction plainly.
- Do not silently link personas, contacts, ecosystem accounts, or public activity.
- Explicitly warn before an action connects identities through an alias, shared account, location, payment, or integration.
- Keep account linking user-directed, inspectable, time-bounded where supported, and revocable.
- Do not promise anonymity based on a different name/avatar or a Firefox container.

## 8. Practical defenses against AI manipulation and cyber attacks

| Defense objective | Proposed user experience | Implementation boundary |
| --- | --- | --- |
| Resist impersonation | Verify contacts/devices, compare codes or QR codes through a trusted channel, explain changed identities/devices | Reuse validated protocol verification; never present an unimplemented verification badge |
| Reduce scams/phishing | Separate Requests; inspect destinations; add context before suspicious credential/payment requests | Existing browser phishing checks are not yet a verified chat-link protection contract |
| Inspect synthetic media | Long-press or attachment action opens on-device analysis with uncertainty and relevant evidence | Experimental detector output is not proof of authenticity, truth, or identity; voice impersonation is not established coverage |
| Make automation visible | Identify bots, assistants, bridges, tools, and the content they can access | An assistant or bridge may become a recipient of decrypted content |
| Keep AI use private | Default to no vault access; prefer local processing; require explicit content scope and consent for remote providers | Never send decrypted vault data to API services; don't silently upload messages or files for analysis |
| Prevent unauthorized actions | Require explicit approval for sensitive exports, purchases, installations, permission changes, and account actions | Instructions in a chat, document, or attachment are untrusted data, not authorization |
| Limit tool compromise | Review capability permissions, isolate tools, and let users revoke access | Validate sandbox/runtime enforcement; a manifest alone is insufficient |
| Protect accounts/devices | Clear new-device review, session revocation, recovery, secure local storage, and safe attachment handling | Encryption cannot protect content on an already compromised unlocked endpoint |
| Protect software delivery | Trusted signing/update process, dependency controls, and reviewed release artifacts | Do not advertise a signing or reproducibility guarantee before releases are actually verified |

A broad AI-manipulation claim must not be reduced to a deepfake score. Coordinated persuasion, social engineering, account takeover, synthetic audio, and misinformation need distinct threat models and evidence. Avoid fear-based alerts and absolute protection claims.

## 9. Protection, privacy, and ecosystem tools

Put protection/privacy under the profile button. Show actionable issues rather than a persistent threat meter.

- Review devices and recovery.
- Review sharing recipients, connected tools, and permissions.
- Run supported account-health and exposure checks.
- Access optional media inspection.
- Show browser-companion status and explain that tracker blocking, fingerprint probes, and Firefox containers are browser-specific.
- Keep unsupported capabilities absent or truthfully unavailable; never imply the phone app blocks tracking in every other app.
- Keep Coalition location review as later optional work under [location privacy MVP](location-privacy-mvp.md). Do not create a parallel map or collect location to populate a dashboard.
- No live GPS or contact-upload requirement for onboarding.
- Push notifications should carry no message text by default; explain OS push-provider timing/metadata exposure. Design content previews as a deliberate user choice.

## 10. Onboarding, habits, rewards, and add-ons

Follow the [onboarding, habits, and rewards plan](onboarding-habits-and-rewards.md).

Starter journey: **choose an identity → complete one useful private action → choose a reward.**

- Teach through previews and doing, with short labels and accessible explanations.
- Show short, accurate progress; autosave and resume.
- Offer a private demo if there is nobody to message yet; identify simulated content as simulated.
- Ask for permissions when their action needs them, not all at installation.
- Keep security consequences, audience choices, account linking, and recovery instructions explicit.
- Award published milestone points toward real native features; offer a choice of useful digital products.
- Keep core encryption, essential safety, recovery, and accessibility free of purchase/reward gates.
- Avoid rewards tied to message volume, constant checking, recruitment, contact upload, or identity/location disclosure.

Optional add-ons can include themes, mask packs, and selected community/convenience tools. Paid enhancements are one-time purchases. Explain permissions, data recipients, scope, and revocation before installation; keep tools in the appropriate conversation/Space/menu. Avoid an add-on dashboard as another mandatory navigation layer.

## 11. First mobile release and sequencing

This sequence is a proposed implementation order. No item is marked complete by this document.

| Phase | Deliverable | Exit evidence |
| --- | --- | --- |
| A. Contracts and foundations | Choose mobile shell; document vault/chat key and session boundaries, identity linking, supported servers, recovery, and permission contracts | Reviewed architecture and explicit threat models; no invented shared-login assumptions |
| B. Core messenger | Chats, new DM, group conversation, invitations/Requests, private Spaces/channels, trustworthy delivery and failure states | Two-device tests against the intended backend, offline/reconnect, membership/authorization checks |
| C. Private vault | Separate lock, supported items, safe storage, sync, recovery, import/export, explicit share flow | Chat remains usable with vault locked; keys/data remain inaccessible to chat/tools; successful cross-device and failure tests |
| D. Identity and protection | Accurate presented identity, contact/device verification, session review/revocation, clear privacy controls | Verified behavior and understandable new-device, key-change, and account-linking flows |
| E. Useful first run | Accessible three-tab navigation, permission timing, optional setup, error/empty/loading states | First-time user completes a useful action without developer help or unnecessary disclosure |
| F. Distribution | Platform packaging, signing/update process, push privacy, backend operation, support and store disclosures | Real release-build/device testing and accurate feature claims |
| G. Optional expansion | Media inspection, advanced community tools, add-ons, calls, privacy integrations | Per-feature authorization, encryption, performance, accessibility, and security evidence before enabling |

First-release priorities are dependable encrypted conversations, private Spaces, a separately locked vault, device verification/recovery, and safe sharing. Hide unfinished optional paths with their effects disabled.

Calls and media E2EE, scheduled sending compatible with the intended encryption design, Deaddrop, steganography, continuity/release tools, a broad encrypted file drive, location integrations, and system/network protection need separate specifications and validation. The existing server-scheduled plaintext bot flow is not an encrypted-chat feature.

## 12. Acceptance checklist

- [ ] iOS/Android implementation location and shell are selected; platform-specific storage, lifecycle, and signing responsibilities are documented.
- [ ] Chats, Spaces, and Vault are the primary navigation; profile holds identity/protection controls.
- [ ] Create/join/invite/new-DM flows work, including Requests and refusal/retry behavior.
- [ ] Encrypted text and attachments work across devices; verification, history recovery, membership changes, and offline behavior are tested.
- [ ] Room metadata, documents, calls, external previews, bots, bridges, and notifications have accurate protection labels.
- [ ] Vault lock is enforced independently of chat and cannot be bypassed by a plugin, preview, or background transition.
- [ ] Vault sharing discloses only the chosen item through a verified mechanism after explicit recipient review.
- [ ] Identity selection reflects actual account/context separation without silently linking personas.
- [ ] Device revocation and recovery succeed and explain remaining copies and limits.
- [ ] AI inspection remains optional, local where implemented, and accurately uncertain.
- [ ] External analysis and sensitive tool actions require explicit scoped authorization.
- [ ] Core safety, recovery, accessibility, and earned products remain independent of purchases.
- [ ] Optional enhancements use one-time purchases with clear ownership/restoration behavior.
- [ ] First run works without contact upload, location access, purchases, or recruitment.
- [ ] UI supports keyboard/screen-reader use where relevant, readable contrast, large text, touch targets, and reduced motion.
- [ ] Release evidence distinguishes source presence, tests, device/browser checks, intended backend checks, and independent review.
- [ ] Marketing makes no absolute anonymity, universal anti-AI, Signal-parity, comprehensive cyber-defense, or total-wipe promise.

## 13. Concept interaction reference

The approved discussion included an illustrative mobile concept with:

- Chats containing sample one-to-one and group conversations, search, and compose.
- Spaces opening into channels that reuse the conversation layout.
- A Vault screen that stays locked until a separate preview-unlock action.
- A mask/profile selector with personal/creator/organizer examples.
- Protection/privacy, devices/recovery, add-ons, conversation details, and verification entry points.
- Conversation details showing encryption, device verification, presented identity, and connected tools.
- A sharing menu with file and From vault paths; vault sharing requires unlock and recipient review.
- A sample local composer and explicit design-concept labeling.

The concept demonstrated navigation and proposed interactions only. It did not send real messages, encrypt content, authenticate a vault, implement account isolation, or validate security behavior. Use these flows as design requirements, not screenshots or proof of a working app.
