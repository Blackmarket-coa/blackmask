# Blackmask: privacy and security for individuals, groups and organizations

**Updated:** November 27, 2026  
**Status:** User-directed scope consolidation and proposed feature catalogue. No new capability is implemented, enabled or verified by this document.  
**Scope:** 36 workflows for individuals, families, businesses, startups, organizations, informal groups and creators.

## 1. Product direction

Blackmask is the consolidated everyday privacy and security home across BMC: private conversations, Spaces, Vault, identities, protected sharing, access decisions and recovery. A person should be able to protect their own information, collaborate privately, help a small group or administer authorized organization resources from the same familiar app.

Keep Chats / Spaces / Vault. The profile/mask menu opens Protection & privacy and a context selector for Personal or a joined Space/organization. Personal data is separate from organization data. A context is an ownership/permissions boundary where implemented, not proof of anonymous identity or independent accounts.

Continue the six privacy sections in [privacy-controls-plan.md](privacy-controls-plan.md). Show suitable controls for the selected context and role. A one-person user must not complete enterprise setup; a small informal group need not become a company to use private collaboration.

The [app plan](app-plan.md), [current feature reference](features.md), [audit register](feature-audit-register.md), [monetization plan](monetization-plan.md), and [OSS research](privacy-security-oss-research.md) remain authoritative for architecture, actual evidence and payment rules. The features below are proposed requirements; no existing library or inherited organization model establishes that a whole workflow already works.

## 2. Who uses it and why

| Audience | Examples of information and activity to protect | Most useful initial experience |
| --- | --- | --- |
| Individual or family | Credentials, identity documents, selected private files, recovery records and conversations | Private vault, identity/context review, safe sharing, device review and a loss/recovery plan |
| Small business | Client records, account access, contracts, contractors and payment-detail requests | Shared vault, scoped client/guest access, verified requests and clean staff offboarding |
| Startup or technical creator | Product drafts, partner due diligence, service credentials, collaborators and source/release access | Project boundaries, controlled previews, named credential owners and recovery/succession |
| Organization, nonprofit or cooperative | Members, volunteers, donors, beneficiaries, confidential cases and governance | Need-to-know groups, private directory, case intake, changing-role access and proportionate activity records |
| Informal group or creative team | Shared resources, event plans, invitations, drafts and member privacy | Invite-only collaboration, temporary guests, clear roles and private defaults without corporate administration |

A person may belong to several contexts. Membership in one never grants access to another, nor ownership of personal content.

## 3. Consolidated catalogue

**First** means a high-value foundation or candidate for an early complete slice, not a claim that all such items belong in the current release. **Next** and **Later** represent increasing integration/key-governance work. All entries remain proposed unless separately linked to current implementation and verification evidence.

| ID / feature | Intended users | User outcome | Privacy home | Sequence | Required boundary |
| --- | --- | --- | --- | --- | --- |
| BM-P01: Guided security plan | All | Choose what to protect, who should access it and what to do after loss; offer skippable illustrated setup and a private checklist | My data & cleanup | First | Keep the plan itself private; recommendations reflect user choices, not a surveillance probability |
| BM-P02: Personal and work identity contexts | All | Show the current identity and organization before posting, signing in or sharing; warn before cross-context links | Location & identity | First | Different names/avatars are presentation unless separate account/key boundaries are actually implemented |
| BM-P03: Contact aliases | Individuals, creators, businesses | Purpose-specific email aliases for clients, shops, newsletters and projects; revoke a compromised alias | Location & identity | Next | Use the existing configured forwarder; aliases and providers still expose some relationship metadata |
| BM-P04: Account and credential health | All | Passkeys or supported MFA, weak/reused credential review, recovery preparation and changed-key warnings | Devices & connected tools | First | Distinguish Blackmask protection from external-site account state; no claim that missing stored TOTP proves no MFA |
| BM-P05: Device and session review | All | Recognize devices, review sign-ins, revoke selected sessions and see whether the service confirmed revocation | Devices & connected tools | First | Per-service sessions and keys differ; existing local plaintext and offline copies may survive |
| BM-P06: Communication privacy preferences | All | Control receipt/typing emission, presence, requests, invites and discovery; review actual encryption state | People & activity | First | Local display hiding does not stop protocol emission; metadata/calls/bots need separate protection labels |
| BM-P07: Shared organization vaults | Businesses, startups, organizations, groups | Keep team credentials, documents and recovery records in collections scoped to a project, department or client | My data & cleanup | Next | Separate personal and organization keys/ownership; access, sync and history need end-to-end verification |
| BM-P08: Safer shared accounts and service credentials | Businesses, startups, groups | Name an owner, track rotation/recovery and grant narrowly scoped access without putting secrets in chat | Devices & connected tools | Next | Previously revealed passwords cannot be revoked by hiding them; rotation or provider revocation must actually happen |
| BM-P09: Temporary guest and contractor access | Businesses, organizations, groups | Invite a client, freelancer, adviser or volunteer to selected resources with expiry and visible access | People & activity | Next | Membership and authorization checks must apply to every file/API path; expiry cannot erase captured copies |
| BM-P10: Join, move and leave workflows | Businesses, organizations, groups | Grant role-appropriate access on joining, review it after role changes and remove access when someone leaves | People & activity | Next | Track partial failures across Matrix, vault, files and external services; do not report complete removal until verified |
| BM-P11: Access reviews | Businesses, organizations, groups | Answer who can access a resource, why, through which grant, until when and when it was last reviewed | People & activity | Next | An admin can inspect only their authorized organizational scope; no personal-content access |
| BM-P12: Approval for sensitive actions | Businesses, organizations, groups | Require configured approval for organization-wide exports, recovery changes, new administrators or bulk permission changes | Devices & connected tools | Later | Server enforcement and available-client key flows must match; approvers do not automatically receive private content |
| BM-P13: Minimal organization activity records | Businesses, organizations, groups | Record authorized changes to membership, policy, sharing, recovery and credentials with actor, scope, outcome and date | My data & cleanup | Next | Exclude messages, secrets and keystrokes; minimize identifiers, scope access and set retention; no unbuilt immutable-log claim |
| BM-P14: Review before sharing | All | Find possible sensitive text, faces or metadata in selected material; let the sender correct masks and export a cleaned copy | Sharing & metadata | First | Local/user-directed processing; missed detections and hidden layers require review; verify exported pixels and text |
| BM-P15: Secure document requests | Businesses, organizations, groups, individuals | Request documents from a client, applicant or family member through an authenticated or explicitly scoped upload path | Sharing & metadata | Next | One uploader cannot browse other submissions; recipient keys, abuse limits, expiry and unsupported formats need contracts |
| BM-P16: Private client, project and deal rooms | Startups, businesses, organizations, creators | Share selected proposals, contracts, research or creative previews with a defined group and permission history | Sharing & metadata | Later | Room documents and previews need their own E2EE/key design; view-only labels cannot prevent external copying |
| BM-P17: Sharing expiry and retention choices | All | Show recipients, expiry, revocation, download state and retention scope before sharing | Sharing & metadata | First | Differentiate link revocation, deletion, local caches, server backups and recipient copies |
| BM-P18: Confidential reporting and intake | Organizations, businesses, groups | Receive safety concerns, tips or internal reports in a restricted case workspace with controlled responses | People & activity | Later | Confidential does not mean anonymous; protect reporter metadata and use a separately verified anonymous channel if requested |
| BM-P19: Private member directory | Organizations, groups, businesses | Let members choose what contact, role and availability details appear to which audiences | People & activity | Next | No mandatory address-book upload or public roster; organization and personal discovery remain separate |
| BM-P20: Sensitive case and project boundaries | Organizations, businesses, groups | Separate client, beneficiary, donor, organizer and project records by need to know | People & activity | Next | Group names, room state and membership can themselves identify sensitive activity; enforce authorization beyond the UI |
| BM-P21: Verified requests and impersonation resistance | All | Make identity/device changes and unusual payment-detail or recovery requests conspicuous; offer confirmation through a known channel | People & activity | First | A verified account is not proof that a request is truthful; no automatic money movement or authenticity score |
| BM-P22: Safer links, QR codes and attachments | All | Preview real destinations, remove supported tracking parameters and require deliberate fetching from unknown senders | Sharing & metadata | First | Do not execute a QR/link payload or upload private content to remote scanners automatically |
| BM-P23: Owned-asset exposure review | Businesses, startups, individuals | Review user-submitted emails, verified owned domains and relevant breached credentials with clear dates and findings | Devices & connected tools | Next | Only supported authorized lookups; provider disclosures and false positives visible; no default employee surveillance or broad scanning |
| BM-P24: Connected tools and AI permission review | All | See what a bot, bridge, app or assistant can access; revoke grants and review selected content before external analysis | Devices & connected tools | First | No plaintext vault access for external AI, plugins or Forge; classifier output never grants authority |
| BM-P25: Device protection summaries | Individuals, businesses, groups | Show available app-lock, supported capture controls, update and companion status, plus an actionable repair path | Devices & connected tools | Next | App/browser/native scopes differ; no covert fleet monitoring or universal malware-free verdict |
| BM-P26: Lost-device and account incident kit | All | Offer a saved sequence to lock locally, revoke selected sessions/shares, rotate affected credentials and contact trusted helpers | Devices & connected tools | First | Confirm each service action; do not promise remote physical erasure, forensic wiping or instant revocation of offline copies |
| BM-P27: Trusted recovery and succession | Individuals, families, startups, organizations | Design opt-in emergency access and organizational handover with named scope, delay, notification and cancellation | Devices & connected tools | Later | Requires separate reviewed crypto/key-custody design; SSO reset is not vault recovery; never add a hidden administrative backdoor |
| BM-P28: Encrypted backup and restore | All | Export supported encrypted recovery copies, understand key custody and rehearse restoring the intended records | My data & cleanup | First | Account for both vault and Matrix recovery separately; backups without usable keys cannot recover plaintext |
| BM-P29: Data inventory, retention and privacy requests | All | Show what the app stores, select retention, export/delete supported data and manage request receipts | My data & cleanup | Next | Record coverage, failures and retained copies; request generation is not proof of deletion or legal compliance |
| BM-P30: Shareable security practices record | Startups, businesses, organizations, creators | Share selected current evidence about security practices and answer customer/vendor questions from approved templates | My data & cleanup | Later | User-authorized sanitized evidence only; no automatic certification, audit approval or publication of internal topology |
| BM-P31: Personal and organization protection presets | All | Apply understandable settings bundles with a preview, source, affected scope and reset path | Devices & connected tools | Next | Enforceable organization policy is explicit and limited to organization resources; advanced authoring/version tests in Forge |
| BM-P32: Short security lessons and reporting | All | Practice key verification, recipient review and recovery with sample content; report suspicious messages deliberately | People & activity | Next | Optional accessible teaching; no deceptive simulated attacks or private-message surveillance by default |
| BM-P33: Private creator previews and provenance choices | Creators, startups, businesses | Review who gets drafts, choose attribution/provenance metadata and share selected work with controlled access | Sharing & metadata | Next | Watermarks/C2PA do not prove truth or prevent copying; preserve a deliberate choice between attribution and identity exposure |
| BM-P34: Location and physical privacy tools | All | Review place-sharing precision/audience/expiry and access explicitly supported tracker/network companion tools | Location & identity | Next | Blackout remains Coalition owner; no mandatory GPS, continuous scan or room-clear claim |
| BM-P35: Confidential meeting controls | Businesses, groups, organizations, individuals | Review participants, invitations, media encryption, bots, recording/transcription state and screen-sharing scope | Screen & notifications | Later | Do not infer call E2EE from chat E2EE; external participants can record; visible native recording state is not all recording |
| BM-P36: Visual and notification privacy | All | Cover both chat and vault, conceal identifying context, reveal selected fields briefly and use generic notifications | Screen & notifications | First | Platform-specific capture limits remain; anti-OCR is experimental and external cameras can record visible content |

## 4. Concrete examples

### Individual or family

A person selects a document from Vault, reveals only the fields they need, creates a reviewed/redacted sharing copy and grants the intended recipient the supported access. Losing their phone opens a saved response sequence showing which sessions/shares were actually revoked and which credentials still need rotation. A trusted-recovery arrangement is optional later work with explicit scope and key custody, not automatic access for a partner, employer or administrator.

### Business with employees and contractors

An owner creates a Work Space and organization-owned collections, assigns a project role, then invites a contractor to only that project's resources for a limited period. The contractor sees the organization context before sending files. On departure, the owner reviews Matrix membership, vault grants, active shares, external credentials and pending actions. “Removed” requires confirmation from the relevant service; exposed passwords need rotation.

### Startup working with partners

A founder prepares a project room containing selected material, uses alias contacts, requests partner documents through separate upload paths and shares a deliberate security-practices summary. Service credentials have named owners and recovery/rotation records. Due-diligence receipts and document expiry are supported only as enforced service behavior; view-only wording cannot stop a camera or recipient copying.

### Organization or informal group

An organizer shares event operations with volunteers while donor/beneficiary or confidential-case records stay limited to explicitly authorized people. Members control their profile/contact exposure. A reporting channel states whether it is merely confidential or has a separately verified anonymous submission design. Group popularity, rewards and payment do not broaden access.

## 5. Administration without exposing personal lives

Organization administrators can manage the organization's membership, resource grants, chosen policies, organization-owned recovery arrangements and appropriately scoped activity records. They cannot inspect personal vaults, private conversations outside their grants, unrelated Spaces or personal browsing history because they are an administrator.

Keep membership, moderation, billing, vault ownership, hosting administration and recovery authority as separate roles. Public community moderation does not grant decryption of private team documents. Paying for storage does not grant access to members' private keys.

Organization policy applies to organization resources and must be visible before use. BYOD access must state exactly which device/app state is inspected. Default to a consented app-level summary; no covert location collection, screen recording, keylogging, employee productivity scoring or private-message inspection.

Personal privacy settings cannot silently weaken because a person joins a Work Space. Display the effective setting, its scope, who set it and what the user can change. A temporary policy exception needs a bounded, visible authority model.

## 6. Sharing, intake and protected rooms

Preserve clear differences among an encrypted message attachment, a controlled Send link, a guest-access workspace and a confidential submission. Define recipients, authentication, encryption, storage/retention, expiry and revocation separately.

A document request should let an invited person submit only what was asked for without browsing other submissions. Limit resource consumption and file types; quarantine/untrusted rendering must not silently decrypt an E2EE submission on the server. Use local inspection or an explicitly chosen non-E2EE intake design with accurate disclosure.

For local redaction, flattened export must remove original hidden text/layers and thumbnails where applicable, not merely paint an overlay in the current UI. Metadata cleanup does not remove identifiers visible in pixels or audio. Keep original evidence separate from a sharing copy. Provenance and source protection can conflict; show the choice.

Controlled rooms should disclose exactly which material is encrypted and which metadata remains visible. Watermarking can discourage or attribute copying only within its verified limits. No universal screenshot prevention, expiry-based erasure of copies or automatic confidentiality certification.

Anonymous reporting is a distinct threat model involving identifiers, IP/timing, account links, file metadata, operator access and retaliation risks. Do not label an authenticated private form anonymous. Use specialist source-submission companions where a separately reviewed design is appropriate.

## 7. Account access, revocation and recovery

Prefer individual accounts plus supported provider delegation over sharing one reusable password. Track account owner, access method, intended recipients, expiry and rotation need. Do not promise that an organization can revoke a copied password or already decrypted document.

A lost-device workflow distinguishes reversible Cover screen/local lock, service session revocation, share revocation, password rotation, external-provider action, recovery-key handling and destructive cleanup. Show success, pending, unsupported and failure separately, with the scope and time of confirmation.

Removing an organization member must close new access across all applicable services, active sessions, invitations, shares and background jobs. Record incomplete steps and re-check delayed work against current membership. Key rotation must follow the selected Matrix/vault protocols; revocation cannot retract historical plaintext.

Recovery needs separate contracts for personal vaults, organization collections, Matrix history/devices and release keys. Single sign-on or an administrator resetting an account password does not establish access to old E2EE ciphertext. Trusted recovery, multiple approvers, delayed emergency access and organizational succession require reviewed key design and explicit enrollment; no hidden backdoor.

## 8. Privacy records, reporting and security evidence

A private data inventory should identify supported records, recipients/integrations, protection state, retention and deletion/export coverage. Organization access reviewers see their authorized resources, not raw platform-wide records.

Keep activity records focused on material changes: grants/revocations, invites, policy edits, recovery, exports, key changes and integration actions. Do not record secret values, message bodies, private content, clipboard contents or keystrokes. Logging itself creates sensitive metadata, so authorize access, minimize collection and set retention.

A shareable security-practices record should contain only approved evidence with date, scope, owner and limitations. A source-code scan is not a deployed-service audit; a signed export is not a certification. Privacy request templates and deletion receipts record a workflow, not guaranteed external deletion or jurisdiction-wide compliance.

Owned-domain/account exposure review should verify authorization, show the source/date and disclose onward provider handling. Membership alone does not authorize investigating an employee's or volunteer's personal accounts.

## 9. Consolidation in Blackmask and handoff to Forge

The user-directed Forge scope recorded November 27 places complex technical authoring, deployment and operations in Forge while keeping personal privacy and normal use in Blackmask. Apply that division without fragmenting the security experience:

| Task | Blackmask | Forge / service owner |
| --- | --- | --- |
| Select/apply a protection preset | Preview affected scope, apply supported controls and show actual status | Advanced preset authoring, compatibility checks, versioned packaging and distribution |
| Manage ordinary team access | Members, roles, invitations, approvals, access reviews and offboarding outcomes | Build/customize an integration; domain services enforce authorization |
| Use shared records | Unlock, search, edit/share authorized vault items and review recipients | Never obtain decrypted records/keys as a side effect of deployment |
| Handle an incident | Scope-specific response checklist, explicit user actions and confirmed outcomes | Authorized host operations/diagnostics through delegated APIs; no blanket remote control |
| Run backups | User-controlled encrypted export, recovery understanding and status where verified | Server job configuration, storage targets, restore orchestration and deployment diagnostics |
| Connect an optional firewall/tracker companion | Explain platform limits, deliberate setup handoff and available status | Advanced native/build/integration work where applicable |
| Review public-edge/host protection | Authorized plain-language status and incident summary | WAF/rate-limit configuration, host agents, scanning pipelines, domains/TLS and release tooling |
| Select an identity or private audience | Blackmask remains the normal interface | Blackout owns Matrix/Coalition; FBM owns commerce; no new duplicate authority |

Everyday Blackmask protection works without installing Forge. A failed/absent Forge handoff never exposes vault keys or blocks ordinary privacy/recovery. Both products use scoped delegated service access and references to secrets rather than copied plaintext in project files, logs or marketplace bundles.

No infrastructure migration, remote-agent deployment or service activation is authorized by this plan.

## 10. OSS alignment

Reuse the [136-repository catalogue](https://github.com/Blackmarket-coa/blackout/blob/develop/docs/product/BLACKOUT_PRIVACY_SECURITY_OSS_CATALOG.md) as a source of evaluated candidates, not a requirement to bundle every tool.

| Proposed capability | Relevant existing foundation / research | Integration condition |
| --- | --- | --- |
| Private collaboration and vault | Existing Blackout Matrix and Blackmask Bitwarden-derived foundation | Verify organization key custody and end-to-end authorization; no second messenger/vault |
| Local sharing review | Tesseract.js, optional Presidio, current metadata cleanup; mat2/ExifTool/Dangerzone references | Local selected processing, honest support matrix and verified exported artifact |
| Account security and aliases | Existing SimpleWebAuthn server work; configured alias forwarders | Finish complete client/provider flow; MFA/SSO must not bypass vault cryptography |
| Access-policy enforcement | Existing service permissions; OpenFGA/Cerbos/Casbin only for an actual gap | One authoritative owner, scope-bound checks across every applicable path |
| Backup/credential operations | restic/Borg, SOPS/OpenBao | Operator secrets are not end-user E2EE keys; advanced operations in Forge |
| Optional device/network companions | AirGuard, RethinkDNS, TrackerControl, PCAPdroid and platform-specific browser tools | Opt-in, verified platform support and no default diagnostic upload |
| Release/application assurance | Gitleaks, OSV/Trivy, Syft/Cosign, MASVS/MASTG, MobSF/ZAP | Actual owned release artifacts/test environments; no automatic safety verdict |

Archived/restricted leads retain the holds in the catalogue. Core safety never depends on an unmaintained experimental detector or a paid scan.

## 11. Suggested complete delivery slices

The first mobile release priorities already in the app plan remain unchanged. Select one next complete slice based on current dependencies; do not treat this 36-workflow catalogue as a simultaneous launch promise.

1. **Individual protection:** device review, safe sharing, separate vault lock and a usable loss/recovery sequence.
2. **Small-team access:** one organization collection/project, two members and a guest, with permissions and a complete leave/revoke path.
3. **Client document request:** distinct invitations, recipient-key handling, upload isolation, review/export and expiry.
4. **Organization access review:** explain every active grant and revoke it across all relevant services, including partial failures.
5. **Incident and continuity:** rehearse a lost device and a backup restore with current memberships, no cross-organization data and correct recovery limits.
6. **Advanced expansion:** protected deal rooms, confidential intake, approval rules, trusted recovery and security-practices exports only after their key/authority contracts are reviewed.

Acceptance must include personal-vs-organization isolation, two separate organizations with adversarial access attempts, membership/key changes, delayed/offline clients, stale sessions, upload paths, selected exports, private search/indexes, caches, backups/restores, failed provider calls, accessible controls and actual supported device behavior.

Consolidation is complete when ordinary users can find and operate the relevant protections in Blackmask and complex configuration has a context-preserving Forge handoff, without exposing secrets or duplicating backend authority.

## 12. Packaging and user control

Keep core encryption, basic supported vault/organization authorization, essential device revocation, covering, recovery and accessibility independent of purchases/rewards. Do not charge mandatory per-person encrypted-chat seats or put stronger encryption/security fixes behind a plan.

Optional one-time enhancements can provide bulk administration, reusable templates, advanced organization, customization and finite setup/training. A group can buy an appropriate shared-scope convenience tool once without forcing every member to buy it. Additional hosted storage remains Blackmask's only recurring charge. No unlimited managed security operations or recurring support is promised through a one-time feature purchase.

Security presets can be recommended during a short skippable onboarding branch. Explain each effective change with a preview and let the user understand what is unsupported. Never silently enable location, external analysis, contact upload, organization recovery enrollment or continuous monitoring to complete setup.

## 13. Sources and evidence limits

This is an original product proposal based on the user's scope and the current Blackmask app/privacy/monetization plans. It is not a claim that the reference projects implement these combined workflows.

- [EFF: Your Security Plan](https://ssd.eff.org/module/your-security-plan) informs choosing protection by information, people, consequences and practical tradeoffs.
- [OWASP: Multi-Tenant Security](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html) supports organization isolation, scoped authorization, offboarding, minimized activity records and safe restore boundaries.
- [OWASP: File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) supports file validation, access checks, limits and safer handling.
- [CISA: Guidance for MSPs and Small and Mid-sized Businesses](https://www.cisa.gov/sites/default/files/publications/CISA%20Insights_Guidance-for-MSPs-and-Small-and-Mid-sized-Businesses_S508C.pdf) supports least-privilege access, MFA and recoverable backups.

Repository source/automated/browser/backend/physical-device/independent-review evidence remains distinct. No compliance certification, universal anonymity, anti-AI immunity, remote forensic erasure or complete compromise detection is implied.
