import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";

import { TRACKER_COUNTS_SESSION_KEY, TrackerCountStore } from "../trackers/tracker-count-store";
import { isTrackerUrl } from "../trackers/tracker-matcher";

const store = new TrackerCountStore();

function persist(): void {
  void chrome.storage?.session?.set({ [TRACKER_COUNTS_SESSION_KEY]: store.snapshot() });
}

/**
 * Black Mask live tracker counting (M3). Observes (does not block) network requests in the
 * background, counts those matching the tracker blocklist per tab — including ones blocked by the
 * declarativeNetRequest ruleset (which surface as errored requests) — and mirrors the counts to
 * session storage so the popup can show a per-page number. Gated by the black-mask-tracker-detection
 * flag; request *blocking* is handled separately by the declarativeNetRequest ruleset.
 *
 * NEEDS BROWSER VALIDATION: webRequest/webNavigation observation and session storage can't be
 * exercised by unit tests.
 */
export async function initTrackerCounting(configService: ConfigService): Promise<void> {
  if (typeof chrome === "undefined" || chrome.webRequest == null) {
    return;
  }

  const enabled = await configService.getFeatureFlag(FeatureFlag.BlackMaskTrackerDetection);
  if (!enabled) {
    return;
  }

  const filter = { urls: ["<all_urls>"] };
  const countIfTracker = (details: { url: string; tabId: number }) => {
    if (details.tabId < 0 || !isTrackerUrl(details.url)) {
      return;
    }
    store.record(details.tabId);
    persist();
  };

  // A tracker request that completes (allowed) or errors (blocked by DNR / network) is counted once.
  chrome.webRequest.onCompleted.addListener(countIfTracker, filter);
  chrome.webRequest.onErrorOccurred.addListener(countIfTracker, filter);

  // Reset a tab's count when it navigates to a new top-level page.
  chrome.webNavigation?.onCommitted.addListener((details) => {
    if (details.frameId === 0) {
      store.reset(details.tabId);
      persist();
    }
  });

  chrome.tabs?.onRemoved.addListener((tabId) => {
    store.remove(tabId);
    persist();
  });
}
