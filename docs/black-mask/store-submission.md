# Black Mask — Browser Store Submission

What the Chrome Web Store and Firefox Add-ons need beyond a built zip, and the review-risk items
that need an answer prepared before submitting rather than after a rejection.

Build the artifacts with:

```bash
npm run dist:chrome        # → apps/browser/dist/dist-chrome.zip
npm run dist:firefox:mv3   # MV3. NOT dist:firefox, which builds MV2 and ships without
                           # the tracker-blocking declarativeNetRequest ruleset.
```

Firefox also requires reviewable source for minified bundles. `build-browser.yml` produces a
`browser-source` artifact for exactly this; include written build instructions with it.

---

## Permission justifications

Chrome asks for a per-permission justification. These are the actual call sites, not aspirations.

| Permission                                         | Why Black Mask needs it                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `declarativeNetRequest`                            | Tracker blocking. The static ruleset `privacy/trackers.dnr.json` is toggled at runtime in `main.background.ts` against the `black-mask-tracker-detection` flag.                |
| `activeTab`                                        | Read the focused tab so autofill can match credentials to the page in front of the user.                                                                                       |
| `alarms`                                           | Schedule vault timeout and background sync; MV3 service workers cannot hold timers.                                                                                            |
| `clipboardRead` / `clipboardWrite`                 | Copy usernames, passwords and TOTP codes, and clear the clipboard afterwards (`platform/services/browser-clipboard.service.ts`).                                               |
| `contextMenus`                                     | The right-click "Black Mask" autofill menu.                                                                                                                                    |
| `idle`                                             | Auto-lock the vault after a period of inactivity.                                                                                                                              |
| `offscreen`                                        | MV3 has no DOM in the service worker; clipboard work runs in an offscreen document.                                                                                            |
| `scripting`                                        | Inject the autofill content scripts.                                                                                                                                           |
| `sidePanel`                                        | The side-panel vault UI.                                                                                                                                                       |
| `storage` / `unlimitedStorage`                     | Encrypted vault data locally. `unlimitedStorage` lifts the 5 MB quota, which a real vault exceeds.                                                                             |
| `tabs`                                             | Match the active tab's URL against saved items and drive the notification bar.                                                                                                 |
| `webNavigation`                                    | Detect navigation to offer save/update prompts at the right moment.                                                                                                            |
| `webRequest` + `webRequestAuthProvider`            | Answer HTTP Basic auth prompts (`autofill/background/web-request.background.ts`). Not used for blocking — MV3 blocking goes through `declarativeNetRequest`.                   |
| `notifications`                                    | Save/update-password prompts.                                                                                                                                                  |
| `host_permissions: https://*/*`, `http://*/*`      | Autofill must work on whatever site the user chooses. Narrower host lists are impossible for a general password manager.                                                       |
| `privacy` _(optional)_                             | Requested only when the user opts to turn off the browser's own built-in autofill (`autofill/popup/settings/autofill.component.ts`). Optional, so it never appears at install. |
| `cookies`, `contextualIdentities` _(Firefox only)_ | Per-persona browsing containers. Declared in `__firefox__permissions`, absent from Chromium builds.                                                                            |

---

## `nativeMessaging` — resolve before submitting

**This permission is currently requested but the feature behind it cannot work.** It is the weakest
item in the list and the most likely to draw a reviewer question.

It powers desktop biometric unlock: `nativeMessaging.background.ts` opens a port to a native host,
which the desktop app registers. Three things are true today:

1. Black Mask desktop is not shipped, so no host is registered.
2. The host id was `com.8bit.bitwarden` on both ends. It now matches the Electron `appId`
   (`app.blackmask.desktop`), so it no longer collides with a real Bitwarden install — previously
   whichever app installed last would overwrite the other's host manifest.
3. `allowed_origins` / `allowed_extensions` listed **Bitwarden's** published extension ids and
   never ours. That meant our own extension was refused, while Bitwarden's extension would have
   been accepted by a Black Mask desktop app. Both lists are now empty.

A Chromium extension id derives from the signing key assigned at first publish, so Black Mask's id
is unknowable until the extension is accepted — the lists cannot be filled in advance.

**Still carrying Bitwarden's identity, deliberately:** the leg _behind_ the native host — the IPC
socket between `desktop_native/proxy` and the desktop app — is still keyed on Bitwarden's names
(`~/.cache/com.bitwarden.desktop/s.bw` on Linux, the `LTZ2PFU5D6.com.bitwarden.desktop` App Group on
macOS, `.var/app/com.bitwarden.desktop` under flatpak). Two apps installed side by side would share
one socket. It is not fixed here because the macOS half needs an App Group under an Apple Team ID we
do not have, and there is no desktop build to test the change against. Fix it as part of shipping
desktop, not before.

**Options, in preference order:**

1. **Move `nativeMessaging` to `optional_permissions`** and request it at runtime when the user
   enables desktop integration. Nothing to justify at submission, no install-time warning for a
   dormant feature, and no forced re-consent later. This is the right end state, but it is **not a
   manifest-only change** — see below.
2. **Leave it and justify it** as "desktop application integration for biometric unlock", accepting
   that a reviewer may ask why a feature with no shipping desktop app needs it.
3. **Strip it.** Cheapest now, worst later — adding a permission to a published extension disables
   it until every user re-consents.

Do not defer this to the submission form. Option 2 is acceptable if desktop is close; option 1 is
where this should land otherwise.

### What option 1 actually costs

Moving the permission means the extension no longer holds `nativeMessaging` by default, and
`BackgroundBrowserBiometricsService` connects in two places that have **no user gesture available**:

- Its constructor starts a **30-second poll** (`BACKGROUND_POLLING_INTERVAL`) that calls
  `connect()` whenever `biometricUnlockEnabled$` is true. That runs in the service worker, where
  `permissions.request()` is not callable at all.
- `canEnableBiometricUnlock()` calls `getBiometricsStatus()`, which connects. That is what decides
  whether to **offer** the biometrics toggle — so the probe happens before the user has agreed to
  anything, and cannot itself be the gesture that requests the permission.

So the change is: gate both paths on `permissions.contains()`, report `DesktopDisconnected` when
the permission is absent instead of attempting a connection, and add an explicit "Connect desktop
app" control in the biometrics settings UI whose click is the gesture that calls
`permissions.request()` and then probes.

That is a real change to the unlock path in a password manager, which argues for doing it
deliberately rather than as submission paperwork — and for doing it when there is a desktop build
to test against.

---

## Other review-risk items

**`wasm-unsafe-eval` in the CSP.** Added for the AI media detector's ONNX runtime. The runtime
itself is bundled under `ort/` and served from the extension, so this is not remote code execution
— but expect to explain it. Chrome reviewers treat `wasm-unsafe-eval` as a flag.

**Remotely-fetched model weights.** The detector downloads its weights from Hugging Face on first
run. Weights are data rather than executable code, so this should not count as remotely-hosted
code, but a reviewer may read it that way. Self-hosting the weights on a Black Mask origin removes
the argument entirely and makes the privacy claim cleaner: nothing leaves the device except a
one-time model download from our own server.

**Privacy policy URL.** Required by both stores, and does not exist yet. For a product sold on
privacy, a thin policy page is a credibility risk as much as a review risk. It must state what the
extension does _not_ send anywhere — which for Black Mask is nearly everything, since the privacy
features run on-device.

**Single-purpose description.** Chrome requires the extension serve one purpose. "Password manager
with privacy tooling" is defensible; framing it as an unrelated bundle of tools is not.
