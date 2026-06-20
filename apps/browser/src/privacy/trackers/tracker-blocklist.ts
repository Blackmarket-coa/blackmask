/**
 * Black Mask starter tracker blocklist (clean-room, curated).
 *
 * A small seed set of widely-known analytics / advertising / tracking domains. This is intentionally
 * minimal: in production the full indicator set is synced from the backend bundle (see
 * docs/black-mask). Entries are bare registrable hosts; the matcher also blocks their subdomains,
 * and the declarativeNetRequest ruleset (trackers.dnr.json) mirrors this list.
 */
export const TRACKER_BLOCKLIST: readonly string[] = Object.freeze([
  "google-analytics.com",
  "googletagmanager.com",
  "googlesyndication.com",
  "doubleclick.net",
  "adservice.google.com",
  "connect.facebook.net",
  "graph.facebook.com",
  "analytics.tiktok.com",
  "ads.linkedin.com",
  "bat.bing.com",
  "scorecardresearch.com",
  "quantserve.com",
  "hotjar.com",
  "mixpanel.com",
  "segment.io",
  "amplitude.com",
  "fullstory.com",
  "mc.yandex.ru",
  "stats.wp.com",
  "branch.io",
]);
