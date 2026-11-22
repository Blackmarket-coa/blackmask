# Evidence — Android proof of concept for the two-web-view shell, 2026-11-22

The owner accepted option A of the [mobile shell brief](../mobile-shell-options.md) on 2026-11-22:
one thin app with two separate web views, Chats and Spaces in one and the Vault in the other. This
run checks the part of that option that was uncertain, on Android. Can one app keep the two web views
apart? Does the vault stay closed until the device's screen lock is confirmed? The app is in
[`apps/mobile-poc`](../../../apps/mobile-poc/README.md).

It loads small local pages, not the real clients. It covers no logins, no messaging and no iOS.

## Environment

| Item     | Value                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | PR #21 at `f24003c8`                                                                                                                                                        |
| Device   | Android 14 (API 34) emulator, Google APIs x86_64 image, 320×640, software GPU. Android System WebView 113. Run by the `Mobile proof of concept` workflow on a GitHub runner |
| App      | Debug build of `app.blackmask.poc`. minSdk 30, targetSdk 35. The test hooks and the storage probe page exist only in debug builds                                           |
| Sequence | One test with no screen lock, then `locksettings set-pin 1111`, then the other nine tests. Each test starts with the app's tasks removed and the vault process ended        |
| Results  | The [workflow run](https://github.com/Blackmarket-coa/blackmask/actions/runs/44988003835) and its `mobile-poc-device-test-results` artifact (JUnit XML and logcat per test) |

## Results

10 device tests: **10 pass**.

| Brief §6 condition                                      | Test                                                                        | Result |
| ------------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| Script in the chat view cannot read the vault's storage | `IsolationTest.theChatViewCannotReadWhatTheVaultStored`                     | Pass   |
| The two views do not share cookies or local data        | `IsolationTest.theVaultCannotReadWhatTheChatViewStored`, and the test above | Pass   |
| The vault cannot be opened without the device unlock    | `GateTest.theVaultStaysClosedUntilTheScreenLockIsConfirmed`                 | Pass   |
|                                                         | `GateTest.cancellingTheScreenLockKeepsTheVaultClosed`                       | Pass   |
|                                                         | `NoScreenLockTest.withoutAScreenLockTheVaultNeverOpens`                     | Pass   |
| With the vault locked or closed, chat keeps working     | `LockTest.lockEndsTheVaultProcessAndTheChatViewKeepsRunning`                | Pass   |
|                                                         | `LockTest.closingTheVaultLocksIt`                                           | Pass   |
| Returning from the background leaves the vault locked   | `LockTest.leavingTheVaultInTheBackgroundLocksItAfterTheTimeout`             | Pass   |
|                                                         | `LockTest.aLockedVaultAsksForTheScreenLockAgain`                            | Pass   |
|                                                         | `LockTest.aVaultEndedByAndroidInTheBackgroundComesBackLocked`               | Pass   |

What the tests show, in more detail:

- **Isolation.** Both views load the same origin, so only the separate process and WebView data
  directory keep them apart. The writing view stores a random token in local storage, a cookie,
  IndexedDB and Cache Storage, and reads all four back. The other view finds none of them. This
  holds in both directions, and the two views report different process ids. The vault's process
  name ends in `:vault`.
- **Unlock gate.** The vault's web view is created only after Android's system prompt accepts the
  device PIN. Before that, and after the prompt is cancelled, the probe page never runs. With no
  screen lock set, the vault shows a message and never opens.
- **Lock.** Lock, Back, and a background timeout (shortened to 2 s for the test) each end the vault
  process. The chat view stays running and keeps its own data. A reopened vault asks for the PIN
  again.
- **A vault Android ends and recreates.** Android can end a background process and recreate its
  screen when the user returns. The test ends the vault process while the vault is in the
  background, then brings the app back. The recreated vault shows its Unlock button and loads
  nothing until the PIN is entered.

## Earlier run on the same day

The [first run](https://github.com/Blackmarket-coa/blackmask/actions/runs/44986462538), at
`fcb151df`, passed 7 of 9 tests. The two failures came from the test cleanup, not the app.

1. The cleanup killed the vault process from outside, which left the vault's task behind.
2. Android keeps a task's identity from the activity that started it, even after the test framework
   clears the task to launch the chat view. It also compares intents without their extras. So the
   next test's vault start only brought the old task back.
3. One test then saw nothing open. The other got the previous test's vault screen back, with that
   test's extras.

The cleanup now removes the app's tasks before each test. The app opens the vault inside the chat's
own task, so it is not affected. The second failure also showed Android recreating a vault screen
after ending its process. The last `LockTest` check above was added to cover that.

## Not covered by this run

- **The real clients.** The brief's first two §6 conditions are still open: the chat view logging in
  to a test Matrix server and sending a message, and the vault view logging in to a test
  Vaultwarden. The app takes real client addresses at build time (`-PpocChatUrl`, `-PpocVaultUrl`).
- **iOS.** The same checks need a Mac.
- **Real hardware.** Only an emulator was used. Fingerprint and face unlock were not exercised; the
  tests use the PIN.
- **Other Android versions and WebView builds.** Only API 34 with WebView 113 was run. The app's
  minimum is API 30.
- A phone-sized vault interface, push, how a vault unlock secret would be held, release signing and
  store packaging.
