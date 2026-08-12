# Black Mask — Backend Deployment (Phase 0)

Everything needed to stand up the backend the clients expect. This is the blocking item: the
browser extension defaults to `vault.blackmask.app`, and four of the eight privacy features do
nothing useful without a server behind them.

| File                                         | What it is                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| [`docker-compose.yml`](./docker-compose.yml) | Vaultwarden + Postgres + Cloudflare Tunnel                                    |
| [`.env.example`](./.env.example)             | Every value you must supply. Copy to `.env`; never commit the filled-in copy. |
| [`smoke-test.sh`](./smoke-test.sh)           | Checks the things that silently break a launch. Exit code = failure count.    |

## The one constraint that dictates the whole shape

**Vaultwarden must serve the web vault itself, from the same origin as `/api`.**

This is not a preference. `apps/web` derives its api/identity URLs from `window.location.origin`,
and `WebEnvironmentService.setEnvironment()` **throws** for `Region.SelfHosted`. A web vault served
from a different origin than its API cannot be repointed at runtime — it will simply fail to log
in, with no setting that fixes it.

Hence `WEB_VAULT_ENABLED=true` plus `WEB_VAULT_FOLDER` pointing at a build of `apps/web`. A reverse
proxy in front of both works equally well, provided every path lands on one hostname.

**Use exactly `vault.blackmask.app`.** The client matches `window.location.hostname` against its
built-in region config, so this hostname makes the browser extension default to your server with no
manual URL entry. Any other hostname works technically, but every extension user would have to type
a server address — the funnel drop-off this whole setup exists to avoid.

**Do not use `apps/web/Dockerfile`.** It carries a .NET stage expecting a sibling `bitwarden/server`
checkout that does not exist in this fork.

## Steps

```bash
# 1. Build the web vault (from the repo root)
npm run dist:oss:selfhost                       # → apps/web/build

# 2. Put it where compose expects it
cp -r apps/web/build docs/black-mask/deploy/web-vault

# 3. Configure
cd docs/black-mask/deploy
cp .env.example .env      # fill it in — see the notes in that file
                          # generate secrets with: openssl rand -base64 48

# 4. Create the tunnel in the Cloudflare Zero Trust dashboard, route
#    vault.blackmask.app → http://vaultwarden:80, and paste the token into .env

# 5. Run
docker compose up -d

# 6. Verify
./smoke-test.sh https://vault.blackmask.app
```

Then turn `SIGNUPS_ALLOWED` off once your own accounts exist, and add the Postgres volume to
whatever backup routine the other services already use.

## What the smoke test will not tell you

It checks reachability, single-origin routing, that the served HTML is actually Black Mask's and
mentions no `bitwarden.com`, and whether the HIBP route exists. That last one is worth calling out:
**an unset `HIBP_API_KEY` makes `/api/hibp/breach` 404, and the data exposure dashboard then shows
an error card to every user.** It is a paid subscription. Budget for it or descope the feature —
those are the only two honest options.

What it cannot check, because these need a browser and a real account:

- creating and syncing a vault item with devtools showing zero `bitwarden.com` requests
- the eight privacy features — see [`../browser-validation.md`](../browser-validation.md), none of
  which has been run yet

## Versions

The image tags are pinned rather than `latest` so a redeploy cannot silently change the server
under a released extension. Bump them deliberately, and re-run the smoke test afterwards.
