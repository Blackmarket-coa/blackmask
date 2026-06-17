# third_party — vendored upstream OSS sources

Full-source snapshots of the open-source projects in the Black Mask build map, vendored into this
repository. Each snapshot was taken with a shallow clone (`--depth 1 --single-branch`) and had its
`.git` directory removed, so the files are tracked as ordinary files in this repo.

**This directory is NOT part of the monorepo build.** It is excluded from ESLint (`eslint.config.mjs`)
and Prettier (`.prettierignore`), and `third_party/*` does not match any npm workspace glob. Do not
import from `third_party/` in `apps/` or `libs/` code — these trees exist for reference and
clean-room study, consistent with the engineering execution plan (`docs/black-mask/`).

**Licensing.** Every subdirectory retains its upstream `LICENSE`/`COPYING` file; that license governs
its contents. This is an aggregation of independently licensed works, several under copyleft
(GPL/AGPL/LGPL) and a few source-available-only terms (see cautions below). Before reusing any of it,
honor the per-project license — keep the forked client code GPLv3-clean and keep the proprietary moat
in backend services, per `docs/black-mask/engineering-execution-plan.md`.

## Not stored in git (fetch on demand)

Two large trees are **not committed** — they were purged from history to keep the repo lean and under
GitHub's file-size limits:

- `bitwarden-fdroid` — ~2.2 GB of distribution APKs/metadata
- `hagezi-dns-blocklists` — ~1.5 GB of generated DNS list data

Run [`./fetch-large-sources.sh`](./fetch-large-sources.sh) from this directory to clone them at the
pinned commits listed in the inventory below. Everything else is vendored normally.

## Inventory

| Directory | Source | Commit | License | Role |
| --- | --- | --- | --- | --- |
| `bitwarden-android` | https://github.com/bitwarden/android.git | `7d062b9617eb` | LICENSE.txt | Anchor (Bitwarden) |
| `bitwarden-credential-exchange` | https://github.com/bitwarden/credential-exchange.git | `0ee5516e4c04` | LICENSE | Anchor (Bitwarden) |
| `bitwarden-fdroid` | https://github.com/bitwarden/f-droid.git | `6348a11b265b` | LICENSE.txt | Anchor (Bitwarden) |
| `bitwarden-ios` | https://github.com/bitwarden/ios.git | `346780121980` | LICENSE.txt | Anchor (Bitwarden) |
| `bitwarden-sdk-internal` | https://github.com/bitwarden/sdk-internal.git | `61b6ed044280` | LICENSE | Anchor (Bitwarden) |
| `bitwarden-sdk-swift` | https://github.com/bitwarden/sdk-swift.git | `4af24c1e9aa1` | NONE | Anchor (Bitwarden) |
| `adguardhome` | https://github.com/AdguardTeam/AdGuardHome.git | `54e6e300228b` | LICENSE.txt | Android system/input |
| `anysoftkeyboard` | https://github.com/AnySoftKeyboard/AnySoftKeyboard.git | `56bb1f0f2848` | LICENSE | Android system/input |
| `blokada` | https://github.com/blokadaorg/blokada.git | `90cd5ca11bd9` | LICENSE | Android system/input |
| `dnscrypt-proxy` | https://github.com/DNSCrypt/dnscrypt-proxy.git | `307e37989623` | LICENSE | Android system/input |
| `florisboard` | https://github.com/florisboard/florisboard.git | `90a7b2654343` | LICENSE | Android system/input |
| `netguard` | https://github.com/M66B/NetGuard.git | `d3e8b6991aee` | LICENSE | Android system/input |
| `rethinkdns-app` | https://github.com/celzero/rethink-app.git | `df1af30f6d3d` | LICENSE | Android system/input |
| `adguard-ios` | https://github.com/AdguardTeam/AdguardForiOS.git | `b5d1db808673` | COPYING | Apple |
| `lockdown-ios` | https://github.com/confirmedcode/Lockdown-iOS.git | `e456e0974a78` | LICENSE.md | Apple |
| `exiftool` | https://github.com/exiftool/exiftool.git | `2200871d9cef` | LICENSE | Backend |
| `fawkes` | https://github.com/Shawn-Shan/fawkes.git | `aedaa82d2250` | LICENSE | Backend |
| `mat2` | https://0xacab.org/jvoisin/mat2.git | `235403bc11d8` | LICENSE | Backend |
| `simplelogin-app` | https://github.com/simple-login/app.git | `f8ee0eb1c525` | LICENSE | Backend |
| `vaultwarden` | https://github.com/dani-garcia/vaultwarden.git | `d6a3d539ed13` | LICENSE.txt | Backend |
| `androidqf` | https://github.com/mvt-project/androidqf.git | `eff4ff52691e` | LICENSE | Compromise detection |
| `mvt` | https://github.com/mvt-project/mvt.git | `08e6a0eae2d3` | LICENSE | Compromise detection |
| `lulu` | https://github.com/objective-see/LuLu.git | `3e8f8e94a822` | LICENSE.md | Desktop agent |
| `portmaster` | https://github.com/safing/portmaster.git | `af0c60140ec4` | LICENSE | Desktop agent |
| `tauri` | https://github.com/tauri-apps/tauri.git | `fbcf1b05aea9` | LICENSE.spdx | Desktop agent |
| `windivert` | https://github.com/basil00/WinDivert.git | `97101072dbe3` | LICENSE | Desktop agent |
| `wireguard-windows` | https://github.com/WireGuard/wireguard-windows.git | `c73653279daf` | COPYING | Desktop agent |
| `canvasblocker` | https://github.com/kkapsner/CanvasBlocker.git | `c813333ba94a` | LICENSE.txt | Extension |
| `multi-account-containers` | https://github.com/mozilla/multi-account-containers.git | `7dda6da1292c` | LICENSE | Extension |
| `privacybadger` | https://github.com/EFForg/privacybadger.git | `54bf8e2347cf` | LICENSE | Extension |
| `ublock-origin` | https://github.com/gorhill/uBlock.git | `c09fd18cbee2` | LICENSE.txt | Extension |
| `hagezi-dns-blocklists` | https://github.com/hagezi/dns-blocklists.git | `6ce844c38cec` | LICENSE | Filter lists (data) |
| `stevenblack-hosts` | https://github.com/StevenBlack/hosts.git | `b4f4d7af895a` | license.txt | Filter lists (data) |
| `arti` | https://gitlab.torproject.org/tpo/core/arti.git | `c0fdf8400c1a` | LICENSE-APACHE | Network/transport |
| `wireguard-tools` | https://github.com/WireGuard/wireguard-tools.git | `a99840774700` | COPYING | Network/transport |

## License cautions

- **`mvt`, `androidqf`** (Amnesty International) — source-available under Amnesty's own terms, **not**
  standard permissive/OSS, and not for unrestricted commercial bundling. Treat as reference; write
  the indicator matcher **clean-room** and consume the indicator *feeds* as data rather than shipping
  this code.
- Copyleft projects (`ublock-origin`, `vaultwarden`, `simplelogin-app`, `portmaster`, `netguard`,
  `lulu`, AdGuard, etc. — GPL/AGPL/LGPL) require that any derivative you ship stays under the same
  license. The Bitwarden-derived client is already GPLv3.

## Notes & exclusions

- **Anchor:** `bitwarden/clients` is **this repository** and is therefore not vendored here. Per the
  execution plan, `bitwarden-android`, `bitwarden-ios`, the SDKs, and `vaultwarden` are normally
  *sibling repos*; they are vendored here at the maintainer's request.
- **Removed (not needed right now):** `ollama`, `synapse`, `mullvadvpn-app`.
- **Intentionally NOT vendored** (per the build map's "Do NOT fork" list): `bitwarden/sdk-sm` and the
  enterprise/integration repos (`server`, `self-host`, `directory-connector`, `key-connector`,
  `sm-*`, `passwordless-*`, `splunk`, `mcp-server`, `billing-relay`).
- **Unresolved upstream URLs (TODO — confirm correct source):**
  - `clearurls` — the gitlab.com/ClearURLs/Addon path now returns auth/404 and it is not on Codeberg.
  - `tinycheck` — the github.com/KasperskyLab/TinyCheck path now returns auth/404.
- Snapshots are point-in-time `--depth 1` clones; nested git submodules of upstreams were **not**
  fetched. Re-vendor from the listed Source + Commit to update.
