import { Observable } from "rxjs";

import { UserId } from "@bitwarden/user-core";

/**
 * Abstraction for phishing detection settings
 */
export abstract class PhishingDetectionSettingsServiceAbstraction {
  /**
   * An observable for whether phishing detection is available for the active user account.
   *
   * True when there is an active account and the PhishingDetection feature flag is enabled.
   * Always false on Safari. No subscription or organization is required: in Black Mask,
   * phishing protection is core safety and only enhanced features are premium.
   */
  abstract readonly available$: Observable<boolean>;
  /**
   * An observable for whether phishing detection is on for the active user account
   *
   * This is true when {@link available$} is true and when {@link enabled$} is true
   */
  abstract readonly on$: Observable<boolean>;
  /**
   * An observable for whether phishing detection is enabled
   */
  abstract readonly enabled$: Observable<boolean>;
  /**
   * Sets whether phishing detection is enabled
   *
   * @param enabled True to enable, false to disable
   */
  abstract setEnabled: (userId: UserId, enabled: boolean) => Promise<void>;
}
