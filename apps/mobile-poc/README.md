# Blackmask mobile shell — Android proof of concept

The owner accepted the [mobile shell recommendation](../../docs/black-mask/mobile-shell-options.md)
on 2026-11-22: one thin app with two separate web views, one for Chats and Spaces and one for the
Vault. This is the proof of concept from section 6 of that brief, for Android. It is not the app and
not a release.

It tests the part of the recommendation that was uncertain: whether Android can keep two web views
in one app apart, and keep the vault closed until the device's screen lock is confirmed. It loads
small local pages, not the real clients.

## How it works

| Piece             | What it does                                                                                                                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ChatActivity`    | Chats and Spaces. Runs in the app's main process. In the app this view would run Blackout's web client                                                                                                                                                               |
| `VaultActivity`   | The vault. Runs in a **separate process** (`:vault`, set in the manifest)                                                                                                                                                                                            |
| `PocApplication`  | Gives the vault process **its own WebView data directory** (`WebView.setDataDirectorySuffix`), so cookies, local storage, IndexedDB and caches are not shared with the chat view                                                                                     |
| Unlock gate       | The vault's web view is created only after Android's `BiometricPrompt` confirms the device screen lock (fingerprint, face or PIN). With no screen lock set, the vault does not open                                                                                  |
| Lock              | Locking, closing the vault with Back, or leaving it in the background past a timeout (30 s here) ends the vault process, which clears everything it held in memory. If Android ends the process first and later recreates the vault screen, the screen starts locked |
| Other protections | The vault window blocks screenshots and the recent-apps preview (`FLAG_SECURE`). App data is excluded from cloud backup and device-to-device transfer                                                                                                                |

No new encryption is involved: each web client would keep its own existing encryption.

The local pages are served from the app's assets at `https://chat.poc.invalid/` and
`https://vault.poc.invalid/` (`.invalid` names never resolve on a network). Debug builds also
contain a storage probe page that the tests use.

## What the device tests check

Mapped to the proof-of-concept conditions in the brief's section 6:

| Condition                                                      | Test                                                                                                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Script in the chat view cannot read the vault's storage        | `IsolationTest`: both views load **the same origin**; what one writes to local storage, cookies, IndexedDB and Cache Storage, the other cannot read, both ways                                                                                |
| The two views do not share cookies or local data               | `IsolationTest`, as above                                                                                                                                                                                                                     |
| The vault cannot be opened without the device unlock           | `GateTest`: no page loads until the PIN is entered, and cancelling the prompt keeps it closed. `NoScreenLockTest`: with no screen lock, it never opens                                                                                        |
| With the vault locked or closed, chat keeps working            | `LockTest`: Lock ends the vault process while the chat view keeps running and keeps its own data                                                                                                                                              |
| Returning from the background leaves the vault locked          | `LockTest`: after the timeout in the background the vault process is gone, and a reopened vault asks for the screen lock again. When Android ends the vault process in the background and recreates the screen on return, the vault is locked |
| The chat view logs in to Matrix; the vault logs in to a server | Not covered: the views load local pages. See [Pointing it at real clients](#pointing-it-at-real-clients)                                                                                                                                      |
| The same checks on iOS                                         | Not covered: needs a Mac                                                                                                                                                                                                                      |

Using the same origin in both views is deliberate. Different origins would be kept apart by the
browser anyway; the same origin shows that the separate data directory does it.

## Building and testing

Needs JDK 17 or later and the Android SDK (platform 36). From `apps/mobile-poc/android`:

```bash
./gradlew assembleDebug assembleDebugAndroidTest testDebugUnitTest lintDebug
```

The device tests need a device or emulator. They enter the device PIN in the system prompt, so set
one first; `NoScreenLockTest` needs the opposite and runs before the PIN is set:

```bash
./gradlew connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=app.blackmask.poc.NoScreenLockTest
adb shell locksettings set-pin 1111
./gradlew connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.notClass=app.blackmask.poc.NoScreenLockTest
```

CI runs exactly this on an Android 14 emulator (`.github/workflows/mobile-poc.yml`), only when this
folder or that workflow changes.

## Pointing it at real clients

```bash
./gradlew assembleDebug -PpocChatUrl=https://<a Blackout client> -PpocVaultUrl=https://<a web vault>
```

The vault view then loads that web vault behind the same gate and in the same separate process.
This has not been tried: it needs test servers reachable from the device, and the web vault is laid
out for a desktop browser window.

## Choices made for the proof of concept

- **Plain Android, not Capacitor.** The brief recommends starting from Capacitor, because Blackout
  already has a Capacitor app. Capacitor runs one web view; the second view, its process and the
  unlock gate are native code whichever way the app is built, and that native code is what needed
  proving. A Capacitor app can host this vault activity unchanged.
- **In this repository**, as `apps/mobile-poc`. The brief suggested running the proof inside
  Blackout's Capacitor project. This repository is where the vault side lives, where its CI can run
  the device tests, and where the proof stays clear of Blackout's app and its app id.
- **App id `app.blackmask.poc`**, not Blackout's `co.bmc.blackout`.
- **minSdk 30** (Android 11), so that the screen-lock prompt can offer PIN and biometrics together.

## Not covered

- The real clients, logins and messaging (see above).
- iOS.
- A phone-sized vault interface: the web vault is built for a desktop window, and the extension
  popup cannot run outside an extension.
- Push notifications, sharing between the two views, and how a vault unlock secret would be held.
- Release signing, store packaging and app review.
