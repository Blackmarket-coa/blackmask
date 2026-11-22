# Blackmask Mobile Shell — Options for Decision

**Written:** 2026-11-21  
**Status:** The owner accepted option A, the recommendation below, on 2026-11-22. The Android proof of
concept in section 6 then passed its isolation, unlock and lock checks on local pages
([evidence](evidence/2026-11-22-android-shell-poc.md)). Where the code lives (section 7) is not
decided.  
**Decision needed:** which mobile shell the Blackmask app uses, and where its code lives. This is the
first acceptance item of the [app plan](app-plan.md) (§12) and the start of its Phase A (§11).

A _shell_ here means the installable iOS and Android app. A _web view_ is a browser surface embedded
inside an app.

## 1. Recommendation

Build one thin native app that shows the two existing web clients in **two separate web views**:

- **Chats and Spaces** in one web view, running Blackout's web client.
- **Vault** in a second web view, running this repository's vault interface, with its own storage
  and a native unlock gate in front of it.

Start from Capacitor, because Blackout already has a Capacitor project that wraps its client. Do a
short proof of concept on Android before committing (section 6). Choose where the code lives after
that proof (section 7).

The reason is reuse, and the vault boundary comes with it. Both products exist only as web apps, and
the native options rewrite both interfaces and both encryption integrations. Two web views also give
the app plan's hardest requirement without changing how the vault locks: a vault that locks on its
own while chats stay open (app plan §6).

The main price is feel. A web view will not be as smooth as a native messenger (section 3).

## 2. What the two codebases are today

Checked on 2026-11-21 against this repository at `2b541611` and Blackout at `920f2453`. Blackout was
read from a clone, with a survey first and then the points below checked by hand.

| Fact                                                                                                                                                                | Where                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| This repository has no mobile project. Its clients are the browser extension, the web vault, and the inherited desktop and CLI apps                                 | `apps/`                                                                                 |
| The vault interface is Angular. The phone-sized layout is the extension popup, which depends on extension APIs. The web vault is built for a desktop browser window | `apps/browser/src/popup`, `apps/web`                                                    |
| The persona and privacy pages live in the browser app, not in a shared library                                                                                      | `apps/browser/src/privacy`                                                              |
| The web vault signs in with the master password or a passkey. It has no PIN unlock                                                                                  | `apps/web/src/app/auth`                                                                 |
| Blackout's client is a React app derived from Cinny, licensed AGPL-3.0-only, using `matrix-js-sdk` with its encryption as a WebAssembly module                      | Blackout `apps/blackout-client/package.json`                                            |
| Blackout already has a Capacitor 7 app that wraps that client, with the Android project committed. Its app id is `co.bmc.blackout`                                  | Blackout `blackout-mobile/capacitor.config.ts`                                          |
| Blackout's own plan names that Capacitor app as its supported shell. Its threat model still says the mobile client is React Native                                  | Blackout `docs/product/BLACKOUT_APP_PLAN.md:227`, `THREAT_MODEL.md:11`                  |
| The Capacitor app's native bridge (push, deep links, back button) is called only by Blackout's legacy web app, not by the current client                            | Blackout `legacy/blackout-web/src/main.ts:15-18`                                        |
| Blackout's single-server deployment files include no push gateway, and the client's service worker has no push handler                                              | Blackout `infra/single-server-baseline`, `apps/blackout-client/src/sw.ts`               |
| Blackout's app offers no device verification, and a new device cannot restore message keys, so it cannot read history                                               | Blackout `THREAT_MODEL.md:42,58`, `KNOWN_ISSUES.md` (BO-1)                              |
| No call starts through Blackout's app                                                                                                                               | Blackout `KNOWN_LIMITATIONS.md:849`                                                     |
| Blackout's compact chat panel for Blackmask is "built, not deployed". It has its own login and exchanges no messages with its host                                  | Blackout `docs/black-mask-chat-panel-and-account-link.md:51`                            |
| Linking a Blackmask account to a Blackout account is "design, not built". Blackout's rule is that Blackmask is never the identity provider                          | Blackout `docs/black-mask-account-link-design.md:3`, `docs/contracts/mas-identity.md:8` |
| Registration on Blackout's server is by invitation token                                                                                                            | Blackout `KNOWN_LIMITATIONS.md:1146`                                                    |

## 3. Options

| Option                                                                                           | What it reuses                                             | What it costs                                                                                                                                                                              | Vault boundary                                                                                |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| **A. One app, two web views** (recommended)                                                      | Both web clients as they are; Blackout's Capacitor project | Native code for the second web view and the unlock gate on each platform. A phone layout for the vault. App-store review risk for web-based apps                                           | Separate origin and storage per view, plus a native gate. The vault view can close on lock    |
| B. One web view holding both clients                                                             | Both web clients                                           | Least work                                                                                                                                                                                 | None that holds: one origin, one storage. Fails app plan §6                                   |
| C. React Native or Flutter                                                                       | Server side only                                           | Both interfaces rewritten. Blackout's encryption is a WebAssembly module, which React Native's engine may not run; chat would then need a native Matrix library. In effect two new clients | Can be strong, but all of it is new work                                                      |
| D. Fully native apps (for example forks of upstream Bitwarden's mobile apps, plus a native chat) | Server side; none of this repository's or Blackout's UI    | The largest. Two native codebases per platform. The persona and privacy work here would be redone                                                                                          | Strongest platform support, including native autofill                                         |
| E. Installable web app only, no store app                                                        | Both web clients, on two web origins                       | No native code. No store listing, weaker push on iOS, no device keystore in front of the vault                                                                                             | The browser separates the two origins. Useful for testing Phases B and C, not for the release |

Option A's weak points are real, and they are the reason for the proof of concept:

- **Capacitor shows one web view by default.** The second one needs native code on each platform.
- **Feel.** A web client inside a web view will not be as smooth as a native messenger. Scrolling,
  the keyboard and gestures need tuning, and some of the gap cannot be closed. For a product whose
  promise is a calm, familiar messenger, this is the main price of option A.
- **App review.** Stores can reject apps that are only a wrapped website. Push, the native vault
  gate and sharing make the case that this is more than that. It stays a risk until a build is
  reviewed.
- **Notifications cannot show message text** on iOS from a web view, because nothing can decrypt in
  the background. The app plan already makes text-free notifications the default (§9), so this fits.
- **Native autofill is out of reach** for web code. The app plan already treats it as later, separate
  work (§2, §6).

Option A does not close the door on the others. The two views are independent, so either side can
later be replaced by a native screen without touching the other.

## 4. How option A meets the app plan's vault requirement

The app plan says: chats stay open while the vault is locked; separation is enforced in key access
and storage, not by hiding screens; a compromised plugin or chat session cannot unlock the vault
(§6, Phase C).

| Requirement                         | How two web views provide it                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chats open while the vault locks    | The views are independent. Locking can close the vault view entirely, the way locking the extension restarts it today, and chat is untouched         |
| Separate key access and storage     | Each view loads a different origin with its own storage. Script running in the chat view, including a plugin, cannot read the vault origin's storage |
| The vault cannot be opened silently | The native layer creates the vault view only after a device unlock (biometric or passcode), and hands any unlock secret only to that view            |
| No new encryption                   | Each client keeps its own existing encryption. The native layer stores a secret in the device keystore; it does not encrypt vault data itself        |

What this does not protect against: a compromised device, or a fault in the native layer itself. The
boundary is against script-level compromise of the chat side.

The vault's existing lock model does not have to change. Today one lock covers the whole account,
and locking clears memory by restarting the extension
([evidence](evidence/2026-11-21-chromium-vault-flows.md)). In option A that same behaviour is the
separate vault lock, because the vault is the only thing in its view.

## 5. Work that follows from choosing A

In rough order. None of it is started.

1. **The second web view and its gate**, on Android first, then iOS. Each view gets only the native
   abilities it needs: push and sharing for chat, device unlock for the vault.
2. **A phone layout for the vault.** The phone-sized vault interface is the extension popup, which
   cannot run outside an extension. The first proof can load the web vault as it is. A release needs
   a vault build made for a phone from the shared libraries, and the persona pages moved out of the
   browser app so a second client can use them.
3. **Vault unlock on a phone.** Typing the master password at every unlock is poor on a phone. The
   design to settle: a keystore-held secret released by device unlock, the web vault's existing
   passkey login, or a PIN. No new encryption primitives either way.
4. **Blackout's gaps, which no shell choice removes.** Device verification, key restore on a new
   device, and push have to work before the app plan's Phases B and D can pass. They are Blackout
   work.
5. **Push.** Deploy a push gateway, wire the native bridge into the current client, and keep message
   text out of notifications.
6. **Two servers the project controls.** The default vault server's domain was unregistered when
   last checked (register record DEP-01). Blackout's root domain answers every path with a "Coming
   Soon" page, including the addresses Matrix clients use to find its server (Blackout
   `KNOWN_LIMITATIONS.md:1625`).

## 6. Proof of concept before committing

One Android debug build, with test servers. It passes if all of these hold:

- [ ] The chat view logs in to a test Matrix server and sends a message.
- [ ] The vault view logs in to a test Vaultwarden and shows an item.
- [x] With the vault locked or its view closed, chat keeps running and keeps its data. Checked with a
      local page; sending and receiving need the real chat client.
- [x] Script run in the chat view cannot read the vault's storage, and the two views do not share
      cookies or local data.
- [x] The vault view cannot be opened without the device unlock.
- [x] Sending the app to the background and returning leaves the vault locked according to its
      timeout.
- [ ] The same three isolation checks pass on iOS. This needs a Mac; it cannot be built in the cloud
      environment these documents were written in.

**Android result, 2026-11-22.** The four ticked items pass on an Android 14 emulator, with both web
views loading local pages ([evidence](evidence/2026-11-22-android-shell-poc.md)). The build is
[`apps/mobile-poc`](../../apps/mobile-poc/README.md): plain Android rather than Capacitor, in this
repository rather than Blackout's, with the app id `app.blackmask.poc`. Its README gives the
reasons. The vault runs in its own process with its own WebView data directory. Its web view is
created only after the system screen-lock prompt succeeds, and locking ends the process. The two
login items need the real clients, and the iOS item needs a Mac.

If the second web view cannot be isolated on one of the platforms, option A fails there and the
choice reopens between C and D.

## 7. Related decisions

| Decision                             | Options                                                                                                                                         | Suggested default                                                                                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where the shell's code lives         | A new small repository; inside Blackout next to `blackout-mobile`; or `apps/mobile` here                                                        | Run the proof inside Blackout's Capacitor project, where an Android build already exists. Then a small repository that takes built, pinned copies of both web clients |
| The app's identity                   | Reuse `co.bmc.blackout`, or a new id                                                                                                            | A new id. `co.bmc.blackout` belongs to Blackout's own app                                                                                                             |
| How the two accounts relate          | Two separate sign-ins in one app; the designed account link; one sign-in through Blackout's identity service                                    | Two separate sign-ins for the first release, stated plainly in the app. It matches the app plan's "no invented shared-login assumptions" and Blackout's rule          |
| Whether the vault is needed to start | Require both accounts at first run, or let someone start with chat and create the vault when they first open it                                 | Start with chat. It shortens the first run, and the app plan's starter journey needs only one useful private action                                                   |
| Licences                             | Blackout's client is AGPL-3.0-only. This repository is GPL-3.0, with Bitwarden-licensed code in `bitwarden_license/` that open builds leave out | A person with legal knowledge reviews shipping the two together through the app stores before any store work. This brief is not legal advice                          |

## 8. The app plan's claims about Blackout, checked

The app plan's catalogue of Blackout capabilities (§2) holds up. Each of the twelve entries checked
matches Blackout's repository, including the limits the plan states for it. Three details go
further than the plan's wording:

- **Calls:** the server side and the interface code exist, but no call starts through the app at
  all.
- **Plugins:** the sandbox and capability lists exist, but a production build installs no plugin.
- **Blackout's own vault:** the code exists, and no screen opens it.

This check comes from the survey. The facts in section 2 were then re-checked by hand; the rest of
the twelve were not.

Four things matter for a phone app and are not in the app plan's catalogue: the existing Capacitor
app, the missing push path, the missing device verification and key restore, and invitation-only
registration. They are in the table in section 2.

One housekeeping item for Blackout: its `LICENSE-COMMERCIAL` file is Element's commercial licence
text, not a Blackout licence.

## 9. Limits of this brief

- Nothing was built or run for the brief itself. The Android proof of concept came after it; see
  section 6.
- The statements about iOS and Android web views and about store review come from general platform
  knowledge, not from a test. The proof of concept in section 6 exists to check them.
- Blackout was read at one commit on one day. Its limitations documents change often.
- Effort is described by what has to be built, not in weeks. No estimate here has been tested.

Related: [app plan](app-plan.md), [feature audit register](feature-audit-register.md),
[2026-11-21 evidence](evidence/2026-11-21-chromium-vault-flows.md).
