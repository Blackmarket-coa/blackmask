/** chrome.storage.session key under which per-tab tracker counts are mirrored for the popup. */
export const TRACKER_COUNTS_SESSION_KEY = "blackMaskTrackerCounts";

/**
 * In-memory per-tab counter for trackers seen on a page. Lives in the background service worker;
 * counts are best-effort and reset when the service worker is recycled or the tab navigates.
 */
export class TrackerCountStore {
  private readonly counts = new Map<number, number>();

  /** Increments and returns the count for a tab. */
  record(tabId: number): number {
    const next = (this.counts.get(tabId) ?? 0) + 1;
    this.counts.set(tabId, next);
    return next;
  }

  /** Resets a tab's count to zero (e.g. on top-level navigation). */
  reset(tabId: number): void {
    this.counts.set(tabId, 0);
  }

  /** Drops a tab's count entirely (e.g. when the tab is closed). */
  remove(tabId: number): void {
    this.counts.delete(tabId);
  }

  /** Current count for a tab (0 when unseen). */
  get(tabId: number): number {
    return this.counts.get(tabId) ?? 0;
  }

  /** Plain-object snapshot keyed by tab id, suitable for persisting to session storage. */
  snapshot(): Record<number, number> {
    return Object.fromEntries(this.counts);
  }
}
