import { TRACKER_BLOCKLIST } from "./tracker-blocklist";

/** Parses the lowercase hostname from a URL; returns null when the URL can't be parsed. */
export function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** True when `host` equals, or is a subdomain of, any blocklisted tracker domain. */
export function isTrackerHost(
  host: string,
  blocklist: readonly string[] = TRACKER_BLOCKLIST,
): boolean {
  const normalized = host.toLowerCase();
  return blocklist.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

/** True when the request URL points at a known tracker host. */
export function isTrackerUrl(
  url: string,
  blocklist: readonly string[] = TRACKER_BLOCKLIST,
): boolean {
  const host = hostFromUrl(url);
  return host !== null && isTrackerHost(host, blocklist);
}
