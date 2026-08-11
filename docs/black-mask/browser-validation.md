# Black Mask — Manual Browser Validation

The privacy features carry `NEEDS BROWSER VALIDATION` notes for a reason: `declarativeNetRequest`
blocking, container creation, the fingerprint probes and the ONNX detector cannot be exercised by
jest. Unit tests cover their pure logic only. **Nothing here has been confirmed in a real browser
yet** — walk this before submitting to a store or recording a demo.

## Builds to test

```bash
cd apps/browser
npm run build:chrome              # → apps/browser/build, load unpacked
npm run build:watch:firefox:mv3   # MV3. `build:firefox` is MV2 and has no DNR ruleset.
```

Firefox MV3 is the only build that gets **both** tracker blocking and containers, so it is the one
to demo. Chrome gets everything except containers.

Point the extension at the Phase 0 Vaultwarden and register a test account first.

## Checklist

### Environment

- [ ] Extension defaults to the Black Mask server with **no** manual URL entry. This is what the
      `PRODUCTION_REGIONS` change buys; if a user has to type a server address, the funnel is dead.
- [ ] Register, log in, create and sync a vault item.
- [ ] Devtools network tab shows **zero** requests to `bitwarden.com`.

### Tracker detection _(Chrome + Firefox MV3)_

- [ ] Per-tab tracker count increments on a tracker-heavy page.
- [ ] Requests are actually **blocked**, not merely counted — confirm in the network tab.
- [ ] Firefox MV3 blocks too. Its DNR implementation differs from Chromium's in places, so verify
      rather than assume parity.

### Per-persona containers _(Firefox MV3 only)_

- [ ] Opening a layer creates a container tab with the expected name, colour and icon.
- [ ] Cookies do not leak between two containers.
- [ ] Chromium shows the "requires Firefox" notice instead of a broken control.

### Personas

- [ ] Create a persona; it appears grouped under its layer.
- [ ] Open it — it opens the **persona editor**, not the generic cipher view.
- [ ] Change the layer; it moves group and does not gain a second `Black Mask Layer` field.
- [ ] Add a custom field to the persona in the normal vault UI, then edit it in the persona editor:
      **the custom field must survive.** This is the case unit tests cover, worth confirming for real.
- [ ] Clear the email and notes; both clear on the item.
- [ ] Generate an alias. Note which algorithm the generator is configured with — if it is
      `plusAddress` the alias still derives from the user's real mailbox, which undercuts the
      separation a persona implies.

### Fingerprint exposure

- [ ] Canvas, WebGL, audio and font probes all return values rather than throwing.
- [ ] The exposure level is plausible against a known reference such as coveryourtracks.eff.org.
- [ ] The privacy dashboard shows **no** fingerprint factor before the test has ever been run, and
      gains one after. Getting this backwards is the failure worth catching: an unmeasured browser
      must not score as a fully-exposed one.
- [ ] After a browser restart the factor disappears again (the cache is session-scoped) and returns
      once the test is re-run.

### Data exposure

- [ ] Returns real breach data. This requires `HIBP_API_KEY` on the Vaultwarden deployment —
      without it the page degrades to an error card and the feature is dead on arrival.

### AI media detector

- [ ] First run downloads the model once; progress is visible.
- [ ] A known AI-generated image and a known real photo classify as expected.
- [ ] Second run uses the cached model with no network request.

### Phishing protection

- [ ] Reports **Available**, not "Unavailable". If it still says unavailable, the upstream
      `phishing-detection` flag is off — it gates the engine independently of the Black Mask flag.

### Theme

- [ ] Palette and fonts render correctly in **both** light and dark themes, across the popup and
      the web vault. Chromatic was removed with the rest of the Bitwarden-infra CI, so there is no
      visual-regression gate — this check is the only thing standing in for it.
