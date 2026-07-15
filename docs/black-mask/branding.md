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

### Not yet rebranded

- **Desktop, web, and CLI locale files and store assets** — only the browser extension's locale
  files were swept. The other apps still say "Bitwarden" in most of their UI text (they do inherit
  the new shared SVG artwork).
- **Safari appex / Xcode project metadata** (`apps/browser/src/safari/`).
- **Desktop/web icon binaries** (`apps/desktop/resources/`, `apps/web/src/images/`).

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

## Trademark note

Bitwarden is a trademark of Bitwarden, Inc. This fork must not present itself as Bitwarden:
user-facing brand strings and marks should stay Black Mask, while GPLv3 attribution to the upstream
codebase remains in `LICENSE_BITWARDEN.txt` / `LICENSE_GPL.txt` and the root README.
