> **DRAFT — not yet reviewed.** This was written from the source code, so it is technically
> accurate about what the software does. It is **not** legal advice and has not been reviewed by
> anyone qualified. Have it reviewed before publishing, and delete this banner when you do.
>
> Placeholders to fill in before publishing: the contact address and the effective date.

# Black Mask Privacy Policy

**Effective:** _(fill in)_

Black Mask is a password manager and privacy toolkit. This policy describes what the browser
extension and web vault do with your information. It is deliberately specific: for a product sold
on privacy, vague reassurance is worse than useless.

## The short version

Your vault is encrypted on your device before it is sent anywhere. We cannot read it. The privacy
tools — tracker blocking, the fingerprint test, persona containers, phishing protection, and the
AI-generated media detector — run entirely on your device and send nothing to us or to anyone
else. Two things do leave your device, and both are named below.

We run no analytics, no telemetry, no crash reporting, and no advertising code. There is nothing to
opt out of because there is nothing collecting.

## Your vault data

Vault items — passwords, notes, identities, personas — are encrypted on your device with keys
derived from your master password. Your master password never leaves your device, and neither do
your keys. The server stores only encrypted blobs it cannot decrypt.

This means we cannot read your vault, cannot recover it if you forget your master password, and
cannot hand its contents to anyone who asks, because we do not have them.

## What runs entirely on your device

None of the following transmits anything. Each runs locally and shows you the result:

- **Tracker blocking.** The blocklist ships inside the extension. The browser matches requests
  against it locally; no browsing history is sent anywhere. Per-tab counts stay on your device.
- **Fingerprint exposure test.** Reads properties your browser already exposes to every website —
  screen size, timezone, fonts, canvas and audio rendering — and scores how identifying they are.
  The readings are shown to you and never transmitted. Only the total score is cached, locally, for
  the current browser session.
- **Persona containers.** Isolates cookies per persona using your browser's own container feature.
  No data is sent.
- **Phishing protection.** Checks the site you are on against a list bundled with the extension.
  The addresses you visit are not sent anywhere for checking.
- **Personas.** Stored as ordinary encrypted vault items, with the same protection as everything
  else in your vault.
- **Account security checks.** Reused and weak passwords, and missing two-step login, are computed
  on your device from your already-decrypted vault. No password, and no hash of a password, is sent
  anywhere for these checks.

## The two things that do leave your device

**1. Your vault syncs to the Black Mask server.** Encrypted, as described above. The server
necessarily sees your account email address, your IP address as part of any normal network request,
and the timing and size of your syncs. It does not see your vault contents.

**2. The AI-generated media detector downloads its model once.** The first time you use it, the
extension fetches the model from Hugging Face, a third-party host, and caches it in your browser.
That request tells Hugging Face your IP address and that you downloaded that file. **The image you
analyse is never uploaded** — it is classified on your device, by that downloaded model, and no
result is transmitted. Subsequent uses make no network request at all. If you never open the
detector, no download happens.

## Data exposure checks

The data exposure dashboard tells you whether your email address appears in known breaches. Your
email address is sent to the Black Mask server, which asks the Have I Been Pwned service on your
behalf. Your address is not sent to any other third party, and the results are not logged or
retained.

## Permissions the extension requests

A password manager with autofill needs broad access to work, so the install prompt looks alarming.
What each is for:

- **Access to all websites.** Autofill has to work on whatever site you choose. There is no
  narrower permission that allows a general-purpose password manager to function. This access is
  used to fill and save credentials — not to record where you go.
- **Clipboard.** Copying usernames, passwords and one-time codes, and clearing the clipboard
  afterwards.
- **Storage.** Your encrypted vault, locally.
- **Tabs and navigation.** Matching the current site to saved items and prompting to save at the
  right moment.
- **Desktop app connection** _(optional)_. Requested only if you turn on biometric unlock; never
  granted at install.
- **Browser privacy settings** _(optional)_. Requested only if you choose to turn off your
  browser's own built-in autofill.

## What we do not do

- No analytics, telemetry, crash reporting, or usage statistics.
- No advertising, ad networks, or trackers of our own.
- No selling, renting, or sharing of personal information. There is no commercial arrangement under
  which your data is transferred to anyone.
- No profiling and no automated decisions about you.

## Your controls

You can export or delete your vault, and delete your account, from the web vault at any time.
Deleting your account removes your encrypted data from the server. Because we cannot decrypt it,
deletion is the only meaningful operation we can perform on it for you.

## Children

Black Mask is not directed at children under 13, and we do not knowingly create accounts for them.

## Changes

Material changes to this policy will be posted here with a new effective date. Because the software
is open source, you can also verify these claims yourself — every behaviour described above is
visible in the published source.

## Contact

_(fill in a contact address before publishing)_
