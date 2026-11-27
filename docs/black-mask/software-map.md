# Blackmask software map

**Updated:** November 27, 2026  
**Status:** Consolidated target map. Proposed workflows and integrations are not implemented/verified by this document. Current behavior remains governed by the [feature reference](features.md) and [audit register](feature-audit-register.md).

## 1. Product and service ownership

| Surface or service | Blackmask responsibility | Dependency / authority |
| --- | --- | --- |
| Chats | Everyday private conversations, recipient/identity review and privacy choices | Reuse Blackout Matrix transport, rooms and protocol verification; no second messaging backend |
| Spaces | Everyday private group/organization collaboration, membership, invites and access decisions | Matrix authority for Matrix resources; vault/resource services enforce their own grants |
| Vault | Separately locked supported records, credentials, collections, controlled sharing and recovery | Existing Bitwarden-derived client/vault service; distinct from Matrix stores and release keys |
| Profile / masks | Presented identity and Personal or authorized Space/organization context | Context is not automatically a separate account, pseudonymous network identity or key domain |
| Protection & privacy | Consolidated everyday privacy/security controls for individuals, families, businesses, startups, organizations, groups and creators | Six sections below; scopes and actual platform support must be visible |
| Forge hub | Persistent Forge entry near Settings/Privacy plus relevant contextual shortcuts | Advanced configuration/authoring/hosting runs through Forge; sensitive service authority remains with its owner |
| Commerce and delivery | Explicit handoff to an eligible offer/order/payment where needed | FBM owns commerce/entitlements/payouts; Blackstar owns eligible transport; no commerce ledger in Blackmask |

No additional primary navigation tab is required. Ordinary membership, access reviews, incident decisions, sharing and recovery choices remain available in Blackmask without opening Forge. Personal privacy remains separate from an organization's administration.

## 2. Privacy navigation and complete workflow coverage

The stable IDs below refer to the [36-workflow catalogue](individual-and-organization-security-plan.md). Preserve them across maps, specifications and implementation tickets; do not treat them as shipped route names or runtime feature flags.

| Existing section | Target workflows | Scope |
| --- | --- | --- |
| Screen & notifications | BM-P35: Confidential meeting controls; BM-P36: Visual and notification privacy | Personal or authorized organization context; effective state and platform limits visible |
| People & activity | BM-P06: Communication privacy preferences; BM-P09: Temporary guest and contractor access; BM-P10: Join, move and leave workflows; BM-P11: Access reviews; BM-P18: Confidential reporting and intake; BM-P19: Private member directory; BM-P20: Sensitive case and project boundaries; BM-P21: Verified requests and impersonation resistance; BM-P32: Short security lessons and reporting | Personal or authorized organization context; effective state and platform limits visible |
| Sharing & metadata | BM-P14: Review before sharing; BM-P15: Secure document requests; BM-P16: Private client, project and deal rooms; BM-P17: Sharing expiry and retention choices; BM-P22: Safer links, QR codes and attachments; BM-P33: Private creator previews and provenance choices | Personal or authorized organization context; effective state and platform limits visible |
| Location & identity | BM-P02: Personal and work identity contexts; BM-P03: Contact aliases; BM-P34: Location and physical privacy tools | Personal or authorized organization context; effective state and platform limits visible |
| Devices & connected tools | BM-P04: Account and credential health; BM-P05: Device and session review; BM-P08: Safer shared accounts and service credentials; BM-P12: Approval for sensitive actions; BM-P23: Owned-asset exposure review; BM-P24: Connected tools and AI permission review; BM-P25: Device protection summaries; BM-P26: Lost-device and account incident kit; BM-P27: Trusted recovery and succession; BM-P31: Personal and organization protection presets | Personal or authorized organization context; effective state and platform limits visible |
| My data & cleanup | BM-P01: Guided security plan; BM-P07: Shared organization vaults; BM-P13: Minimal organization activity records; BM-P28: Encrypted backup and restore; BM-P29: Data inventory, retention and privacy requests; BM-P30: Shareable security practices record | Personal or authorized organization context; effective state and platform limits visible |

## 3. New capability → technical responsibility

| Capability family | Blackmask surface and authoritative service | Technical work / evidence needed |
| --- | --- | --- |
| Privacy View, covers and notification privacy | Chat/vault views and native host lifecycle; device-local state | Both WebViews, screenshots/recording/casting/app snapshots, accessible reveal/cancel, no plaintext flash; browser/iOS/Android limits |
| Shared organization vaults and credential ownership | Vault and authorized organization access editor | Separate personal/organization custody, per-object permissions, membership changes and encrypted sync; no copied-password revocation claim |
| Guests, onboarding/offboarding and access reviews | Space membership/access details | Matrix and vault/file/linked services verify their own scope; delayed jobs/offline sessions and partial failures recorded |
| Document requests, project rooms and safe sharing | Sharing flow and separately locked selected records | Per-submission isolation, recipient-key design, supported local inspection/redaction and exact expiry/revocation behavior |
| Confidential intake and sensitive cases | Restricted Space/case workflow | Differentiate confidentiality from anonymity; room names, membership, file metadata and operator access remain relevant |
| Verification and account/incident response | Conversation details and Devices & connected tools | Per-service verification/revocation, explicit action authorization, key-change and failure state handling |
| Recovery/succession and backup restore | Vault/recovery and user-directed export | Separate Matrix/vault/release-key contracts; reviewed opt-in recovery design; organization role or SSO reset is not universal decryption |
| Activity records, retention and privacy requests | My data & cleanup | Minimal authorized events, exact export/delete coverage, private indexes/caches/backups and retention scope |
| Presets, integrations and operational protection | Select/apply/review in Blackmask; configure advanced work in Forge | Versioned capabilities, compatibility and delegated access; no secret-bearing project/URL/log export |
| Browser/network/physical privacy | Labeled companion entry and supported status | Actual OS/browser/native support, permissions and local-data handling; no universal safety verdict |
| Anti-OCR and protective media research | Optional clearly experimental item | ProTegO and similar candidates remain off by default pending current-model/camera/video/accessibility evaluation |

The [engineering map](engineering-execution-plan.md) remains the foundation source-location reference. New integration contracts and exact implementation paths must be defined before coding; this target map does not invent APIs or transfer vault keys into a shared ecosystem store.

## 4. Cross-app surfaces and handoffs

| Starting point | User action | Destination / return |
| --- | --- | --- |
| Blackout Privacy, conversation, group or relevant sharing context | Review advanced private collaboration/security | Open the matching authorized Blackmask context; return to the original Blackout resource |
| FBM account, team/client/project or supported sharing context | Protect selected collaboration/records | Open matching Blackmask context without passing order/customer/private payloads automatically; return to FBM |
| Blackmask Privacy, Vault template selection, Space or organization customization | Configure a technical preset, integration or hosting | Context-specific Forge tool; persistent Forge hub remains available; return with confirmed scoped status |
| Forge project, deployment or preset | Apply/use an authorized result | Blackmask applies supported settings after preview; Forge receives only permitted status/reference data |

All links are proposed contracts until implemented. A handoff carries source/destination/resource identifiers and a short-lived authenticated reference; never bearer tokens, stream keys, passwords, vault records or private message bodies in URLs. The destination reauthorizes. Preserve intent for signed-out, unavailable, unsupported-device and denied-role states. Do not remove existing working interfaces until replacement and return paths pass.

## 5. Trust and purchasing boundaries

An organization administrator can manage only authorized organization resources; billing, hosting, moderation, policy and recovery roles remain separate. No personal-vault access, unrelated private conversations, contact upload, continuous location collection, screen recording or employee monitoring is implied.

Keep protocol encryption separate from public room state, metadata, files, call/media encryption and external tool access. No screen effect stops all outside cameras; no expiry control retracts recipient copies. Cleanup and key destruction are separate explicit operations.

Core encryption, supported basic capture/notification privacy, essential recovery/revocation and accessibility are not purchase/reward gates. Optional convenience enhancements use one-time purchases; additional hosted storage is the sole recurring Blackmask charge.

## 6. Research and delivery status

The [OSS research inventory](privacy-security-oss-research.md) links a 136-repository screen, including 84 additions beyond previous inventories and four separately described non-GitHub families. Candidate status is not adoption. Keep archived LLM Guard, deprecated KES, the old Tink monorepo and restrictive SDK leads held as recorded there.

Current mobile release priorities stay in [app-plan.md](app-plan.md). Choose complete slices: personal protection/recovery, one small-team grant/revoke flow, one isolated document request, one cross-service access review, then advanced intake/approvals/succession only after key and authority design. The 36 workflows are a catalogue, not simultaneous release commitments.

Related: [privacy controls](privacy-controls-plan.md), [individual and organization plan](individual-and-organization-security-plan.md), [problem–solution map](problem-solution-map.md), [monetization](monetization-plan.md), and [Forge software map](https://github.com/Blackmarket-coa/Forge/blob/master/SOFTWARE_MAP.md).
