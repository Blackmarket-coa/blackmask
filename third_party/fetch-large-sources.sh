#!/usr/bin/env bash
# Materialize the large vendored sources that are NOT stored in git.
#
# Two trees (bitwarden-fdroid, hagezi-dns-blocklists) were purged from history to keep the repo lean
# and under GitHub's file-size limits. This script re-clones them at the commits pinned in README.md.
# Re-running is safe — existing directories are skipped.
#
# Usage: ./third_party/fetch-large-sources.sh
set -euo pipefail
cd "$(dirname "$0")"

fetch() {
  local dir="$1" url="$2" sha="$3"
  if [ -e "$dir" ]; then
    echo "skip   $dir (already present)"
    return 0
  fi
  echo "fetch  $dir  <-  $url @ $sha"
  git clone --filter=blob:none --no-checkout "$url" "$dir"
  git -C "$dir" checkout --detach "$sha"
  rm -rf "$dir/.git"
  echo "       done ($(du -sh "$dir" | cut -f1))"
}

fetch bitwarden-fdroid      https://github.com/bitwarden/f-droid.git     6348a11b265b
fetch hagezi-dns-blocklists https://github.com/hagezi/dns-blocklists.git 6ce844c38cec

echo "All large sources materialized."
