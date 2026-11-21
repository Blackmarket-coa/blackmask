# Blackmask Problem–Solution Map

**Recorded:** November 21, 2026  
**Status:** Product goals and proposed behavior, not a claim that every solution is implemented.

## 1. Purpose

Blackmask should give people a simple place to communicate, organize, and manage private information while controlling what they reveal. The experience should support being oneself among trusted people, with clear boundaries between conversation, identity, and private records.

The five everyday needs are:

1. “I want to talk comfortably with my people.”
2. “I want to know who can see my information.”
3. “I want my private things protected separately.”
4. “I want to organize a group without managing complicated software.”
5. “I want to turn useful skills and contributions into income.”

## 2. Complete problem–solution map

| ID  | User problem                                                             | Intended solution                                                                                                          |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| P01 | Private communication is difficult to trust                              | Verified encrypted conversations, clear audiences, and understandable protection indicators.                               |
| P02 | Community tools are complicated                                          | Spaces start as simple group chats and progressively reveal channels, roles, and administration.                           |
| P03 | Security tools require technical knowledge                               | Familiar controls, useful defaults, short explanations, and protective actions shown when relevant.                        |
| P04 | Sensitive information is scattered across apps                           | A vault for supported credentials, notes, identities, documents/attachments, and controlled sharing.                       |
| P05 | An unlocked messenger exposes too much                                   | A separately locked vault with an enforced authentication and key-access boundary.                                         |
| P06 | People reuse passwords or miss account weaknesses                        | Generators, supported autofill, local account-health checks, and actionable guidance.                                      |
| P07 | Device loss can remove access or leave access behind                     | Verified recovery, backup, device review, and session revocation, with honest limits.                                      |
| P08 | Personal, business, creator, and pseudonymous identities become mixed    | Clear contexts and warnings before linking them; actual separation must match the underlying account system.               |
| P09 | People feel uncomfortable expressing themselves online                   | Trusted groups, deliberate identity presentation, and audience controls without anonymity guarantees.                      |
| P10 | Unknown senders create spam, harassment, and scam exposure               | Separate Requests, block/report controls, cautious link/file handling, and user-directed reporting.                        |
| P11 | Impersonators exploit familiar names and pictures                        | Contact/device verification, identity-change notices, and confirmation through a trusted channel.                          |
| P12 | Synthetic media makes deception harder to recognize                      | Optional uncertain media inspection alongside verification; a detector does not prove truth or identity.                   |
| P13 | Bots, bridges, and AI tools receive information without informed choices | Visible automation, scoped permissions, explicit consent, and revocable access.                                            |
| P14 | Malicious messages/documents can manipulate tools                        | Treat content as untrusted input; require explicit authorization for sensitive actions.                                    |
| P15 | Files reveal more than users intend                                      | Clear recipient review, supported metadata safeguards, and deliberate sharing controls.                                    |
| P16 | Sharing information means surrendering control indefinitely              | Supported expiration, disabling, and access management; recipients may retain copies.                                      |
| P17 | Tracking, phishing, and account exposure are hard to understand          | Browser companion for supported blocking, warnings, containers, and exposure review; no device-wide protection claim.      |
| P18 | Location/activity can accidentally reveal identity                       | Later sharing review of audience, precision, duration, identity consequences, and how to stop future sharing.              |
| P19 | Organizations juggle communication, documents, and coordination          | Private Spaces with optional workflows and scoped ecosystem integrations; validate each tool's encryption/authorization.   |
| P20 | Private professional collaboration is fragmented                         | A proposed inquiry/agreement/payment/collaboration/delivery flow connected to verified commerce.                           |
| P21 | Useful skills are hard to monetize without followers                     | Digital products, commissions, teaching, funded tasks, and community labor backed by real buyers/funders.                  |
| P22 | Useful features require too many subscriptions                           | One-time enhancement purchases and finite engagements; hosted storage is the only recurring Blackmask charge.              |
| P23 | Users become dependent on one provider                                   | Standard import/export, open-protocol interoperability, and supported self-host paths.                                     |
| P24 | Onboarding overwhelms users or demands disclosure                        | Short setup goals, visual demonstrations, optional permissions, and a useful first action without contact/location upload. |
| P25 | Accessibility is sacrificed for simplicity                               | Readable labels, screen-reader support, adequate text/touch targets, reduced motion, and clear error states.               |

## 3. Ecosystem responsibilities

| Product   | Intended role                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| Blackout  | Discovery, expression, participation, demonstrations, and contribution visibility                                   |
| FBM       | Exchange, listings, checkout, orders, and applicable commerce operations                                            |
| Blackmask | Private communication, identity presentation, information control, collaboration, and supported controlled delivery |

These roles do not prove the integrations are wired. Account linking must be explicit, revocable, and aware of identity consequences. Reuse existing infrastructure rather than duplicating messaging, maps, commerce ledgers, or identity providers.

## 4. Success criteria

- A new user sends a private message and understands its audience and actual encryption state.
- Chats remain usable while vault records stay locked.
- A group can begin with one conversation and add channels without confusing members.
- A person knows who they are appearing as before posting or sharing.
- A user can review/verify/revoke a supported device and understand what remains elsewhere.
- Sharing exposes only the chosen item and explains expiration/revocation limits.
- A useful skill can lead to a real sale or funded task without a large following.
- First run works without unnecessary permissions, purchases, contact upload, or recruitment.
- Recovery, export, cancellation, and failure states are understandable and tested.

Measure task completion, comprehension, reliability, and comfort through local checks, user-directed tests, or minimal opt-in aggregates. Do not inspect private messages, vault data, contacts, browsing history, or pseudonymous relationship graphs to measure success.

## 5. Scope and evidence

Keep Chats, Spaces, and Vault as the primary navigation; identity/protection lives under profile. This map explains those surfaces rather than adding a tab for each problem.

Encryption, identity separation, recovery, AI inspection, location controls, and deletion have distinct guarantees. No absolute anonymity, universal cyber-defense, guaranteed authenticity, total-wipe, or safety-critical continuity claim.

Phone-based physical-device detection is a new research candidate in the [OSS research inventory](hidden-device-detection-oss-research.md), not a validated addition to existing protection.

Related: [app plan](app-plan.md), [user earning plan](user-earning-plan.md), [monetization plan](monetization-plan.md), and [feature audit register](feature-audit-register.md).
