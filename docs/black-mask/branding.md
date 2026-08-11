# Black Mask — Branding & Asset Guide

What "Black Mask" branding currently covers in this repository, what is still placeholder, and how
to regenerate or replace the assets. The rebrand landed in
[PR #8](https://github.com/Blackmarket-coa/blackmask/pull/8).

## What is rebranded today

### Repository metadata

- Root `README.md`, `CONTRIBUTING.md`, `SECURITY.md` describe the Black Mask fork.
- Root `package.json` — name `@blackmask/clients`, description, repository/bugs/homepage URLs,
  author.

### Browser extension (user-facing)

- **Manifests** (`apps/browser/src/manifest.json`, `apps/browser/src/manifest.v3.json`):
  `short_name`, `author`, `homepage_url`, and the toolbar `default_title` are Black Mask.
  The display name and description come from i18n (`__MSG_extName__` / `__MSG_extDesc__`).
- **Locales** — all 63 files under `apps/browser/src/_locales/*/messages.json` and the
  store-listing copy under `apps/browser/store/locales/*/copy.resx`: every user-facing "Bitwarden"
  brand token was replaced with "Black Mask". English `extName`/`extDesc` were rewritten for the
  privacy scope and stay within Safari's limits (name < 40 chars, description < 112 chars).
- **Hardcoded strings** — extension HTML page `<title>`s (inline menu, notification bar, offscreen
  document, sidepanel), the right-click context menu root item
  (`apps/browser/src/autofill/browser/main-context-menu-handler.ts`), and Storybook mocks.
- **Icons** — every extension icon (`apps/browser/src/images/icon*.png`) and store icon
  (`apps/browser/store/icons/*.png`): a dark rounded square with a white domino-mask glyph.
  Gray variants cover the disabled toolbar state; an amber padlock overlay marks the locked state.
- **Shared SVG artwork** (`libs/assets/src/svg/svgs/`) — the wordmark
  (`bitwarden-logo.icon.ts`), nav glyph (`shield.ts`), and app icon (`bitwarden-icon.ts`) are
  redrawn as Black Mask artwork. Because these live in a shared lib, the desktop and web apps pick
  up the new mark wherever they use these components.

### Web, desktop, and CLI

- **Locales** — `apps/web/src/locales/*/messages.json` (66), `apps/desktop/src/locales/*/messages.json`
  (66), and `apps/cli/src/locales/en/messages.json` have had every user-facing "Bitwarden" brand
  token replaced with "Black Mask". i18n **keys** are untouched.
- **HTML titles** — `apps/web/src/index.html`, `apps/web/src/404.html`, the six pages under
  `apps/web/src/connectors/`, and `apps/desktop/src/index.html`, plus their logo `alt` text.
- **Package metadata** — `description` / `homepage` / `author` / `repository` / `keywords` in
  `apps/cli/package.json`, `apps/desktop/package.json`, and `apps/desktop/src/package.json`
  (which also carries `productName`).
- **Desktop app identity** — `electron-builder.json` / `.beta.json`: `productName`, `appId`
  (`app.blackmask.desktop`), `copyright`, `extraMetadata.name`, the Linux desktop-entry name, snap
  summary/description, the snap polkit `action-prefix`, and the protocol handler's display name.
  `publish` now points at this fork's GitHub releases.
- **Linux packaging resources** — `apps/desktop/resources/com.bitwarden.desktop.*` renamed to
  `app.blackmask.desktop.*`, with the referencing scripts in `apps/desktop/package.json` updated.
- **Desktop runtime strings** — the tray name and OS credential-store service name in
  `apps/desktop/src/main.ts`, and the Linux autostart entry in `src/main/messaging.main.ts`.
- **Palette and typography** — see below.

### Deliberately NOT renamed

These are internal identifiers, not user-facing branding. Renaming them is churn with real
regression risk and zero user benefit:

- npm workspace/package names (`@bitwarden/common`, `@bitwarden/browser`, …) and all import paths.
- i18n **keys** (e.g. `toggleBitwardenVaultOverlay`) — only the translated **values** changed.
- Code identifiers (`BitwardenLogo`, `BitwardenShield`, `BitwardenIcon`, `NudgeType.DownloadBitwarden`, …).
- Native-messaging log strings that name the Bitwarden desktop app they actually talk to.
- Lowercase `bitwarden.com` help links — they still point at valid documentation for inherited
  features. Replace them as Black Mask docs come online.
- References to genuinely external Bitwarden products ("Bitwarden Authenticator",
  "Bitwarden Secrets Manager") kept where the string really means that external product.

- The `bitwarden` URL scheme (`x-scheme-handler/bitwarden`, `bitwarden://`). It is a functional
  protocol handler wired through the SSO callback paths, not a brand string. Only the handler's
  **display name** changed.

### Not yet rebranded

- **Safari appex / Xcode project metadata** (`apps/browser/src/safari/`).
- **Desktop/web icon binaries** (`apps/desktop/resources/`, `apps/web/src/images/`) — see
  placeholder assets below.
- **Code-signing and store-account identities**, which cannot be invented and must be replaced with
  Black Mask developer accounts before any desktop release: `nsis.publisherName`, `mas.identity`,
  `appx.publisherDisplayName` / `applicationId` / `identityName`, and the
  `*.provisionprofile` filenames in `apps/desktop/electron-builder*.json`. These still name
  Bitwarden; a build cannot be signed with them, so it fails rather than mis-attributing.
- **Linux flatpak/snap packaging is unverified.** The identifiers were renamed consistently, but no
  flatpak or snap build has been run against them.

## Fixed: i18n keys corrupted by the first sweep

The original browser sweep replaced the "Bitwarden" token in i18n **keys** as well as values,
producing 17 broken keys per locale — including keys containing a space, such as
`"newToBlack Mask"` and `"toggleBlack MaskVaultOverlay"`. The application code still looked up the
original names (`newToBitwarden`, `toggleBitwardenVaultOverlay`, …), so every one of them was a
failed translation lookup at runtime.

All 1,071 affected keys across the 63 browser locale files have been restored to their original
names; only the values remain rebranded. **When sweeping locales, never touch keys.**

## Placeholder assets — regenerating and replacing

The current icons are **generated placeholders**, good enough for development and unpacked-load
testing, not for store submission. They are produced deterministically by:

```bash
node scripts/generate-placeholder-icons.js
```

The script is dependency-free (draws the glyph procedurally, 4× supersampled, and encodes the PNGs
with node's built-in `zlib`). Design parameters (colors, glyph geometry, padlock overlay) are
constants at the top of the script. It writes:

| Output                                              | Files                                        |
| --------------------------------------------------- | -------------------------------------------- |
| Toolbar/app icons (16–128 px, normal + gray)        | `apps/browser/src/images/icon<N>[_gray].png` |
| Locked-state toolbar icons (19, 38 px)              | `apps/browser/src/images/icon<N>_locked.png` |
| Safari toolbar icons (18 px + @2x, normal + locked) | `apps/browser/src/images/icon18_safari*.png` |
| Store listing icons (64, 128, 300 px)               | `apps/browser/store/icons/*.png`             |

To replace with designed brand assets, overwrite the same file names at the same dimensions (the
manifests and `apps/browser/src/platform/badge/icon.ts` reference them by path) and update the
three SVGs in `libs/assets/src/svg/svgs/`. Keep the `tw-fill-*` classes on SVG paths — they carry
theming — and keep the exported symbol names, which many components import.

## Palette and typography

The brand palette lives in `libs/components/src/tw-theme.css` — the light `:root` block and the
`.theme_dark` override. `libs/components/tailwind.config.base.js` maps semantic tokens to
`rgb(var(--color-*) / <alpha-value>)` and holds no literal colors, so a palette change means
editing the CSS only.

Teal `#1ABC9C` reaches only **2.41:1** against white, which fails WCAG AA for text and controls.
It is therefore the light **accent** (`--color-primary-300`), while forest green `#16813D`
(**4.95:1**) carries the interactive `--color-primary-600` step. On dark surfaces the ramp inverts:
teal reaches **6.90:1** against the dark background and takes the `600` step. `--color-background-alt2/3/4`
are deep forest greens in place of Bitwarden's blues.

Typography is self-hosted through `@fontsource` — IBM Plex Sans for UI text, Archivo Black for
display — declared in `libs/components/src/theme.css` and exposed as `--font-sans` and a new
`--font-display` (available as Tailwind's `tw-font-display`). Inter stays bundled as the fallback.
No external font CDN is used: the extension CSP forbids it, and a privacy product must not leak
font requests.

Changing the palette invalidates every Storybook snapshot. Chromatic required a Bitwarden project
token and has been removed from CI, so there is no visual-regression gate — check light **and**
dark themes by hand after palette work.

## Trademark note

Bitwarden is a trademark of Bitwarden, Inc. This fork must not present itself as Bitwarden:
user-facing brand strings and marks should stay Black Mask, while GPLv3 attribution to the upstream
codebase remains in `LICENSE_BITWARDEN.txt` / `LICENSE_GPL.txt` and the root README.
