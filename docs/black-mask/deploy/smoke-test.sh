#!/usr/bin/env bash
#
# Black Mask backend smoke test.
#
# Checks the things that silently break a launch: wrong origin layout, a missing HIBP key, and a
# web vault that still talks to bitwarden.com. Read-only except for the optional registration
# check, which is opt-in.
#
# Usage:
#   ./smoke-test.sh https://vault.blackmask.app
#   REGISTER=1 ./smoke-test.sh https://vault.blackmask.app   # also registers a throwaway account
#
# Exit code is the number of failed checks, so CI can gate on it.

set -uo pipefail

BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  echo "usage: $0 <base-url>   e.g. $0 https://vault.blackmask.app" >&2
  exit 64
fi
BASE="${BASE%/}"

FAILURES=0
pass() { printf '  \033[32mok\033[0m   %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAILURES=$((FAILURES + 1)); }
warn() { printf '  \033[33mwarn\033[0m %s\n' "$1"; }
note() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# Prints the HTTP status for a GET, or 000 when the request could not be made at all.
# curl already writes 000 on a connection failure, so this must not add its own fallback —
# doing so prints "000000" and makes a dead host look like a malformed response.
status() {
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$1" 2>/dev/null)
  printf '%s' "${code:-000}"
}
body() { curl -sS --max-time 15 "$1" 2>/dev/null || true; }

note "Reachability — $BASE"

code=$(status "$BASE/")
if [[ "$code" == "200" ]]; then
  pass "web vault responds (200)"
elif [[ "$code" == "000" ]]; then
  fail "cannot reach $BASE at all — check the tunnel and DNS"
else
  fail "web vault returned $code, expected 200"
fi

note "Single origin — every service must answer under this one hostname"
# The web client derives /api and /identity from window.location.origin and cannot be repointed
# at runtime, so anything served from another host here means a vault that cannot log in.
for path in /alive /api/config; do
  code=$(status "$BASE$path")
  if [[ "$code" == "200" ]]; then
    pass "$path (200)"
  else
    fail "$path returned $code, expected 200 — is Vaultwarden serving under the same origin?"
  fi
done

# Identity answers 400 to a GET; anything else (404, 502) means it is not routed.
code=$(status "$BASE/identity/connect/token")
if [[ "$code" == "400" || "$code" == "405" ]]; then
  pass "/identity/connect/token routed ($code — a GET is expected to be rejected)"
else
  fail "/identity/connect/token returned $code — expected 400/405; identity is probably not routed"
fi

note "Web vault is ours, not Bitwarden's"
html=$(body "$BASE/")
if grep -qi "black mask" <<<"$html"; then
  pass "page identifies as Black Mask"
else
  fail "no Black Mask branding in the served HTML — is WEB_VAULT_FOLDER pointing at apps/web/build?"
fi
if grep -qi "bitwarden\.com" <<<"$html"; then
  fail "served HTML references bitwarden.com — the rebrand did not reach this build"
else
  pass "no bitwarden.com references in the served HTML"
fi

note "HIBP — gates the data exposure dashboard"
# Unauthenticated this should be 401, not 404. A 404 means the route is absent, which is what
# happens when HIBP_API_KEY is unset — and the dashboard then shows an error card to every user.
code=$(status "$BASE/api/hibp/breach?username=test@example.com")
case "$code" in
  401 | 400) pass "/api/hibp/breach is routed ($code unauthenticated, as expected)" ;;
  404) fail "/api/hibp/breach is 404 — HIBP_API_KEY is almost certainly unset; the data exposure dashboard will be dead on arrival" ;;
  *) warn "/api/hibp/breach returned $code — verify manually while logged in" ;;
esac

note "Registration"
if [[ "${REGISTER:-0}" == "1" ]]; then
  email="smoke-$(date +%s)@example.invalid"
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 \
    -X POST "$BASE/identity/accounts/register/send-verification-email" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"name\":\"smoke test\"}" 2>/dev/null)
  code="${code:-000}"
  if [[ "$code" == "200" || "$code" == "204" ]]; then
    pass "registration endpoint accepted a request ($code) for $email"
  else
    fail "registration returned $code — check SIGNUPS_ALLOWED"
  fi
else
  warn "skipped (set REGISTER=1 to exercise it)"
fi

note "Result"
if [[ "$FAILURES" -eq 0 ]]; then
  printf '  \033[32mall checks passed\033[0m\n\n'
else
  printf '  \033[31m%d check(s) failed\033[0m\n\n' "$FAILURES"
fi

printf 'Not covered here — these need a browser and a real account:\n'
printf '  - create and sync a vault item, with devtools showing zero bitwarden.com requests\n'
printf '  - the eight privacy features (see ../browser-validation.md)\n\n'

exit "$FAILURES"
