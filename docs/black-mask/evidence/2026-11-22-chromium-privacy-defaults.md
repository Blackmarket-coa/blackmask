# Evidence — Chromium run after the two privacy defaults, 2026-11-22

The owner decided two defaults on 2026-11-22 after the
[2026-11-21 run](./2026-11-21-chromium-vault-flows.md) found them:

1. **Breach check on item view: opt-in.** Opening a login item no longer sends anything to Have I
   Been Pwned unless the user turns on a new setting, which is off by default.
2. **Sender's email on Sends: hidden by default.** A new Send starts with "Hide my email" ticked.

This run checks both in the browser. Status per feature is in the
[feature audit register](../feature-audit-register.md).

## Environment

Same as the [2026-11-21 run](./2026-11-21-chromium-vault-flows.md#environment): a production Chrome
MV3 build in headless Chromium 153 against a local Vaultwarden 1.37.5 over HTTPS, with every other
hostname resolving to NOTFOUND. The build is `main` at `66be4f3d` plus the two changes. The server
data folder was empty at the start.

## Results

41 checks: **39 pass**, 1 partial (THEME-01, unchanged) and 1 informational (ENV-04). Every check
that passed on 2026-11-21 passed again. Two checks are new:

| Check   | Result | Evidence                                                                                                                                                |
| ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRIV-01 | Pass   | The run opened its login item twice (VLT-01 and ATT-01). The NetLog shows no request to `api.pwnedpasswords.com`. On 2026-11-21 the same steps sent two |
| SEND-06 | Pass   | SEND-01 created a text Send without touching "Hide my email". The recipient page did not show the sender's account email. On 2026-11-21 it did          |

Hosts seen only with the extension loaded: `vault.blackmask.app` (default server, before switching),
`localhost:8443` (the test server), `assets.bitwarden.com` (the phishing list) and Chromium's own
`content-autofill.googleapis.com`. `api.pwnedpasswords.com` is gone from the list.

## How the changes work

- **Breach check.** A new per-user setting, "Check passwords against known breaches when you open an
  item", sits under Settings → Appearance next to the at-risk password setting. It is off unless the
  user turns it on, and its description says what is sent. With it off, opening an item still finds
  weak and reused passwords on the device; only the lookup is skipped. Code:
  `checkPasswordsForBreaches$` in `libs/common/src/vault/services/vault-settings/vault-settings.service.ts`,
  used by `passwordIsAtRisk` in `libs/vault/src/cipher-view/cipher-view.component.ts`.
- **Sender's email.** `initializeSendForm` in
  `libs/tools/send/send-ui/src/send-form/services/default-send-form.service.ts` starts every new
  Send with the email hidden. An organization policy that forbids hiding it still wins, and a Send
  being edited keeps its own setting.

## Not covered by this run

- **Turning the breach check on.** The run never opts in. Unit tests cover that the setting, when
  on, makes the item view ask for the lookup.
- **The sign-up breach check.** Choosing a master password shows "Check known data breaches for
  this password", ticked by default. It sends the first five characters of the master password's
  SHA-1 hash to Have I Been Pwned. It is a visible box, unlike the item-view check, and the owner's
  decision did not cover it. The run unticks it.
- Everything listed as not covered on 2026-11-21.
