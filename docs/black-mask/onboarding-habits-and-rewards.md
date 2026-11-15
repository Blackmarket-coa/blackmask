# Blackmask: Onboarding, Habits, and Rewards

Product strategy additions · November 15, 2026

Status: requirements and proposed interaction designs; implementation has not been verified or changed by this document.

## Product intent

Make private communication, identity control, and comfortable interaction with trusted people easy to start and useful to repeat. Teach through doing wherever possible. Give people short, achievable setup goals, visible progress, and a choice of useful native digital products when they finish.

## Scope and product boundaries

This is a future-work plan, not a shipping feature inventory or a change to the current MVP. Blackmask owns the browser extension, web vault, privacy controls, and personas. Blackout owns messaging and communities. Conversation examples below apply only to an explicit, supported Blackout integration; they do not require a second messaging platform inside Blackmask or make Blackout a dependency for standalone setup.

Use a persona or vault action for the standalone starter path. Reuse existing onboarding, identity, and entitlement systems where they fit after auditing them. Reward catalog entries below are proposals, not claims that those products already exist. Keep identity linking explicit and revocable.

## Attention and action loop

Use this pattern throughout onboarding and everyday use:

**Relevant cue → one clear action → immediate useful result → visible progress → reward choice at completion.**

Each prompt must have an identifiable purpose, an easy action, and a visible result. Draw attention to the control that performs the action. After completion, remove the prompt and show what changed. Introduce another task only when it becomes relevant.

Examples:

| Moment | Prompt or trigger | Desired action | Immediate result |
| --- | --- | --- | --- |
| Choose an identity | Preview cards showing different masks/personas | Tap a card and personalize it | Live preview updates |
| Understand visibility | Small audience illustration beside the current setting | Select who can see the identity or content | Audience preview changes immediately |
| Start a conversation | Brief composer demonstration in an empty conversation | Send a first message or try a private demo | Message appears with a clear delivery state |
| Return to trusted people | User-enabled conversation indicator | Open the relevant conversation | Resume where the user left off |
| Finish setup | Completed progress segments and reward previews | Choose a digital product | Product unlocks and can be used immediately |

Demonstrations and security indicators must reflect actual supported behavior. A demo must be clearly identified as a demo.

## Instruction without text where possible

- Use short gesture demonstrations, highlighted controls, visual previews, icons, spatial grouping, and immediate feedback.
- Make the action itself teach the feature: preview a theme by tapping it; understand an audience by changing the audience preview.
- Offer optional sound and haptics for completion and confirmation, with independent controls.
- Keep short labels, accessible names, screen-reader instructions, keyboard access, and optional explanations available. Support reduced motion; never rely solely on color, sound, or animation.
- Use plain text for important security consequences, permissions, recovery instructions, and consent. Visual simplicity must preserve informed choices.

## Short setup goals and fewer steps

Proposed starter journey: **choose your identity → complete one useful private action → choose your reward**. Adapt the useful action to the available product surface: a first private conversation, persona setup, or a vault action. Do not advertise unverified capabilities.

- Show a small, accurate progress indicator, such as three completion segments. Keep optional advanced setup separate from the starter goal.
- Present one primary action per screen. Combine related decisions and provide useful defaults with a preview.
- Reuse answers within the authorized context. Avoid repeated forms or silent linking of separate identities across products.
- Autosave and resume. Keep completed steps complete; let people return to optional tasks later.
- Ask for permissions when the relevant action needs them. Let users reach a starter milestone without granting optional permissions or inviting contacts.
- Mark a step complete only when its underlying action succeeds. Provide a clear retry path if it fails.

## Motivators and heuristics

Treat these as design hypotheses to evaluate with users, not guarantees about behavior.

| Motivator | Blackmask application |
| --- | --- |
| Hope | Show an attainable next step toward a private, comfortable digital space |
| Social acceptance | Offer a welcoming invitation, chosen group identity, and optional recognition from trusted people |
| Avoiding social rejection | Let users rehearse privately, choose a pseudonym, and understand their audience before participating |
| Avoiding fear | Show understandable controls, truthful status, and clear recovery paths |
| Seeking pleasure | Offer playful mask customization, expressive reactions, satisfying feedback, and appealing rewards |
| Avoiding pain | Remove repeated setup, confusing navigation, unwanted interruptions, and unnecessary disclosure |

Use recognition over recall, familiar controls, contextual defaults, small commitments, immediate feedback, and visible progress toward a nearby goal. Preview outcomes before commitment and make reversible choices easy to change. Keep social proof authentic and relevant. Build confidence and belonging without rejection threats, fabricated urgency, or inflated security claims.

## Points, variable rewards, and user choice

Award points for meaningful completed goals. Show the earning rule, current balance, and the points required for a chosen native feature. Proposed milestones include starter setup, learning a privacy control through a demo, and completing a useful personal configuration.

Combine predictable progress with variety: guarantee the published points and completion reward, while varying eligible product selections, optional bonus items, or celebration styles. Show the choices before redemption and let the user pick. Preserve an equivalent useful option if a product is incompatible or already owned.

Proposed reward catalog, subject to availability: mask/avatar packs, themes, sticker or reaction packs, personalization presets, and eligible native convenience features or plugins. Points should unlock real usable products, including selected enhancement features, rather than only badges. Earned and purchased copies of the same enhancement should provide the same capability; paid enhancements remain one-time purchases.

Core privacy, security, recovery, and accessibility remain available independently of reward earning. Completion must not depend on purchases, contact uploads, public identity disclosure, or recruitment. Avoid rewards for raw message volume, repeated clicks, or time spent. Preserve earned products and progress during absence.

## Habit and validation

Build return habits around useful moments: a trusted conversation, an unfinished user-chosen goal, or a relevant privacy task. Let users control reminder timing and frequency. Finish each session with a clear result and an optional next step.

Measure starter completion, time to first useful action, abandonment by step, successful pause/resume, prompt comprehension, reward redemption, and voluntary return to useful actions. Use minimal aggregate events; exclude message contents, credentials, vault contents, and private relationship details. Validate the visual path with accessibility support as well as with first-time users.

## Deferred implementation checklist

All items are pending. Audit the existing implementation before estimating or building.

- [ ] **Audit and map the current journey.** Walk through a fresh extension install and web-vault setup; record existing first-run screens, repeated decisions, permissions, available defaults, and completion signals. Identify reusable onboarding, progress, catalog, and entitlement code.
- [ ] **Prototype the visual starter path.** Demonstrate identity selection, one useful standalone privacy/vault action, and a completion reward. Include a clearly marked demo where real data is unnecessary; document each cue, desired action, and result.
- [ ] **Consolidate setup and persist progress.** Reuse authorized answers, combine related choices, support pause/resume, and keep optional tasks separate. Completion follows successful underlying actions; failed actions remain retryable.
- [ ] **Make prompts accessible.** Verify keyboard and screen-reader use, reduced motion, non-color status cues, optional sound/haptics, and readable consent/recovery explanations.
- [ ] **Define points and the eligible catalog.** Specify meaningful milestones, published point values, reward costs, compatibility, ownership, and equivalent choices. Preserve guaranteed milestone rewards while varying eligible selections or optional bonuses; define one-time enhancement entitlements.
- [ ] **Implement reliable reward claiming.** Completion and redemption must be idempotent: retries cannot duplicate points or entitlements. Prevent duplicate charges or deductions, preserve an unclaimed reward after interruption, and give an already-owned/incompatible product a useful alternative. Keep points separate from sensitive vault contents.
- [ ] **Validate useful outcomes.** Check first-action completion, step abandonment, comprehension, resume behavior, and reward usability using local or minimal opt-in aggregate measurement. Verify that optional permissions, purchases, contact uploads, location disclosure, and Blackout account linking are unnecessary for standalone completion.

Before release, demonstrate that users can finish the free starter path, understand what changed, choose and use a compatible reward, and return later without losing progress. Confirm that all product and security claims match implemented behavior.
