/**
 * Black Mask starter list of two-factor-capable sites (clean-room, curated).
 *
 * A seed set of widely-known services that support TOTP two-step login. It backs the privacy score's
 * "2FA gap" factor: a login on one of these domains with no TOTP secret is flagged as a gap. This is
 * intentionally minimal — in production the full list is synced from the backend bundle (the public
 * 2fa.directory feed) rather than fetched per-session, keeping vault data on-device. Entries are bare
 * registrable domains, matched against each login URI's registrable domain.
 */
export const TWO_FACTOR_SITES: readonly string[] = Object.freeze([
  "amazon.com",
  "apple.com",
  "atlassian.com",
  "binance.com",
  "bitbucket.org",
  "cloudflare.com",
  "coinbase.com",
  "discord.com",
  "digitalocean.com",
  "dropbox.com",
  "ebay.com",
  "facebook.com",
  "fastmail.com",
  "github.com",
  "gitlab.com",
  "google.com",
  "heroku.com",
  "instagram.com",
  "linkedin.com",
  "microsoft.com",
  "npmjs.com",
  "okta.com",
  "paypal.com",
  "proton.me",
  "protonmail.com",
  "reddit.com",
  "shopify.com",
  "slack.com",
  "steampowered.com",
  "stripe.com",
  "tumblr.com",
  "twitch.tv",
  "twitter.com",
  "wordpress.com",
  "x.com",
  "yahoo.com",
  "zoho.com",
]);
