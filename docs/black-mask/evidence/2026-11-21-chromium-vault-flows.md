# Evidence — automated Chromium run of the vault flows the app plan reuses, 2026-11-21

Third pass of [`browser-validation.md`](../browser-validation.md). The
[app plan](../app-plan.md) of 2026-11-20 reuses this repository's vault inside a mobile messenger, so
this run adds the vault pieces that plan leans on: Send, attachments, export, lock and unlock, and
log out. It also explains why lock was blocked on
[2026-11-16](./2026-11-16-chromium-logged-in.md). Status per feature is in the
[feature audit register](../feature-audit-register.md).

It covers a production Chrome MV3 build in Chromium against a local Vaultwarden. It does not cover
Firefox, a store-installed build, the hosted service or any mobile app.

## Environment

| Item     | Value                                                                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `main` at `2b541611` (the merge of PR #18) with this change's harness; no product code has changed since PR #15. Built with `npm run build:prod:chrome`; manifest version `2026.6.0`, MV3       |
| Browser  | Chromium 153.0.8010.12, headless, Playwright 1.59.1, regular Chrome user agent, a fresh profile per run with Developer mode on (see [Lock and unlock](#lock-and-unlock-what-blocked-it-before)) |
| Server   | Vaultwarden 1.37.5 with its bundled web vault 2026.10.1, on `https://localhost:8443`, self-signed certificate trusted by SPKI hash only, empty data folder at the start                         |
| Network  | Hermetic: every hostname except `localhost` resolved to NOTFOUND; attempted requests captured with a Chromium NetLog                                                                            |
| Accounts | A new synthetic account per run, created through the extension's signup screens                                                                                                                 |

Reproduce with (after building the extension):

```bash
node scripts/validate-black-mask-chromium.js --extension apps/browser/build --out /tmp/bm-run \
  --server https://localhost:8443 --trust-spki <base64 SPKI sha256 of the server certificate> \
  --server-data <the test server's data folder>
```

## Results

39 checks: **37 pass**, 1 partial (THEME-01, unchanged) and 1 informational (ENV-04). The run was
made twice, the second time against an empty server data folder, with the same result. Every check
that passed on 2026-11-16 passed again. The new and changed checks:

| Check     | Result                 | Evidence                                                                                                                                                                |
| --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEND-01   | Pass                   | A text Send was created in the popup. A tab with no account opened its link and showed the text (server: token 200, access 200)                                         |
| SEND-02   | Pass                   | A Send limited to one view opened once. The second attempt was refused (token 404) and the page said the Send is no longer available                                    |
| SEND-03   | Pass                   | A password-protected Send asked for the password (token 400), rejected a wrong one ("Invalid password") and opened with the right one                                   |
| SEND-04   | Pass                   | A file Send's recipient downloaded a file identical to the original. The one file the server stored for it did not contain the plaintext                                |
| SEND-05   | Pass                   | After the Send was deleted in the popup, its link was refused (token 404)                                                                                               |
| ATT-01    | Pass                   | An attachment uploaded from the item's attachments page, was listed on the item, and downloaded back identical. The one stored file did not contain the plaintext       |
| EXPORT-01 | Pass                   | The `.json` export asked for the master password and contained both vault items (the login and the persona), unencrypted as its warning says                            |
| EXPORT-02 | Pass                   | The `.json (Encrypted)` export, account restricted, contained two items and no readable item name or password                                                           |
| LOCK-01   | Pass (was **Blocked**) | Lock now locked the vault and the extension restarted. The vault page went to the lock screen and showed no item; the master password unlocked it and the item was back |
| LOGOUT-01 | Pass                   | Log out restarted the extension and left it on the login screen; the vault page showed no item                                                                          |

"Stored file did not contain the plaintext" means this: the uploaded file is 200 lines of a known
marker string, and the run searched the file Vaultwarden wrote under `sends/` or `attachments/` for
that marker. It shows the upload was encrypted before it left the browser. It is not a review of
the encryption.

## Lock and unlock: what blocked it before

On 2026-11-16 the extension never came back after locking. The cause is a Chromium rule, not the
product:

- Chromium disables an unpacked extension when it reloads itself, unless Developer mode is on in
  that profile. Locking and logging out both reload the extension, to clear secrets from memory.
- `chrome://extensions-internals` shows it directly. Before locking, the extension had no disable
  reason. After locking in a profile without Developer mode, it had
  `DISABLE_UNSUPPORTED_DEVELOPER_EXTENSION`, and its pages failed with `ERR_BLOCKED_BY_CLIENT`.
- With Developer mode on in the test profile, the service worker was back 0.9 seconds after the
  lock click, the popup showed "Your vault is locked", and the master password unlocked it.

The harness now creates its profiles with Developer mode on. A person who loads an unpacked build
has it on already, and an extension installed from a store is not an unpacked extension, so this
rule does not reach users.

**Correction to the 2026-11-16 report.** That report said a direct `chrome.runtime.reload()`
"recovers in about 2 seconds" and used it as a control. Rerun on 2026-11-21, that call never
reloaded the extension when made through the automation: no new service worker appeared and
Chromium's record of the extension did not change. The control proved nothing, and the conclusion
drawn from it ("the cause is not established") is replaced by the finding above.

Still not covered for lock: branded Chrome, a store-installed build, Firefox, the automatic vault
timeout, and PIN or biometric unlock.

## Findings

1. **A Send names its sender.** The recipient page showed the sender's account email
   ("… member `<email>` shared the following with you"). The Send form's "Hide my email" box is
   unticked by default. For a product built on masks, sharing from the vault reveals the vault
   account's email unless the user ticks it.
2. **The recipient page comes from the server, not from the extension.** A Send link opens the web
   vault that the server serves. On this test server that is Vaultwarden's bundled web vault, which
   says "Bitwarden member". This repository's own web vault says "Black Mask member"
   (`apps/web/src/locales/en/messages.json`), so the hosted server has to serve this repository's
   web vault build for recipients to see Black Mask.
3. **What a Send can restrict.** The form offers a deletion date, a view limit, who can view (anyone
   with the link, specific people, or a password), hiding the sender's email, and a private note.
   There is no expiry separate from deletion, and no control to disable a Send without deleting it.
   "Specific people" verifies recipients by email and was not run: it needs a mail server.
4. **Viewing a login item sends a breach-check request.** Each time a login item's view opened, the
   extension requested `api.pwnedpasswords.com/range/70D21`, the first five characters of the
   SHA-1 of that item's password. The request times in the NetLog match the two moments the item
   view opened. The code is `passwordIsAtRisk` and `checkIfPasswordIsAtRisk` in
   `libs/vault/src/cipher-view/cipher-view.component.ts`: the check runs for an editable personal
   login with a password when the account has premium, and Vaultwarden reports every account as
   premium. Read from the code and not tested: the "show at-risk password notifications" setting
   gates the link that follows the check, not the check itself. This settles the trigger left
   open on 2026-11-16.
5. **Bitwarden names in output.** Export files are named `bitwarden_export_<time>.json` and
   `bitwarden_encrypted_export_<time>.json`.
6. **File Sends and attachments worked because the server calls every account premium.** The client
   gates both on premium (register record CORE-09).

## Hosts contacted

Hosts seen only with the extension loaded, with the NetLog's initiator for each:

| Host                              | Initiator     | What it is                                                                                                                               |
| --------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `vault.blackmask.app`             | the extension | The default server's `/api/config`, before the server was switched                                                                       |
| `localhost:8443`                  | the extension | The test server, including the recipient tabs                                                                                            |
| `assets.bitwarden.com`            | the extension | The phishing blocklist and its manifest (the documented exception)                                                                       |
| `api.pwnedpasswords.com`          | the extension | Two breach-check requests, one per view of the login item (finding 4)                                                                    |
| `content-autofill.googleapis.com` | the browser   | Chromium's own autofill service, 19 requests while the recipient pages were open. The NetLog gives no origin for them; not the extension |

The two tracker-test controls (`example.org`, `cdn.jsdelivr.net`) are the harness's own requests.

## Not covered

- Sends for specific people (email verification), a Send's deletion date passing, editing a Send.
- Import. The `.csv` and `.zip` exports, and the password-protected export.
- The automatic vault timeout, PIN and biometric unlock, lock from the browser's other surfaces.
- Recovery: the master password hint, emergency access, reviewing and revoking devices or sessions.
- Autofill and the generator.
- This repository's own web vault as the recipient page for Send links.
- Firefox, a store-installed build, the hosted backend, and anything on a phone.
