/**
 * Black Mask starter tracker blocklist (clean-room, curated).
 *
 * A small, hardcoded seed set of widely-known analytics / advertising / tracking domains. It ships
 * with the extension and is the complete list in use: nothing updates it at runtime. Syncing a
 * larger indicator set from the backend is planned (see docs/black-mask) but not implemented.
 * Entries are bare registrable hosts; the matcher also blocks their subdomains, and the
 * declarativeNetRequest ruleset (trackers.dnr.json) is a hand-maintained copy of this list, so
 * change both together.
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
