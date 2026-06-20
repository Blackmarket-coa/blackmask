import { Injectable } from "@angular/core";

import { BrowserApi } from "../../../platform/browser/browser-api";
import { TRACKER_COUNTS_SESSION_KEY } from "../../trackers/tracker-count-store";

/**
 * Reads the active tab's live tracker count, which the background tracker counter mirrors into
 * session storage. Returns 0 where unavailable.
 *
 * NEEDS BROWSER VALIDATION: session storage and tab queries can't be exercised by unit tests.
 */
@Injectable({ providedIn: "root" })
export class TrackerCountService {
  async activeTabCount(): Promise<number> {
    if (typeof chrome === "undefined" || chrome.storage?.session == null) {
      return 0;
    }

    const tab = await BrowserApi.getTabFromCurrentWindowId();
    if (tab?.id == null) {
      return 0;
    }

    const result = await chrome.storage.session.get(TRACKER_COUNTS_SESSION_KEY);
    const counts = (result?.[TRACKER_COUNTS_SESSION_KEY] ?? {}) as Record<string, number>;
    return counts[tab.id] ?? 0;
  }
}
