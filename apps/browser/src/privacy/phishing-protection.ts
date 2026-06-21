/**
 * Pure status helper for the Black Mask phishing-protection page. Maps the existing phishing engine's
 * availability + enablement to a single status. Deterministic and unit-testable.
 */

export const PhishingProtectionStatus = Object.freeze({
  Active: "active",
  Off: "off",
  Unavailable: "unavailable",
} as const);
export type PhishingProtectionStatus =
  (typeof PhishingProtectionStatus)[keyof typeof PhishingProtectionStatus];

/**
 * Derives the protection status. "Unavailable" (plan/flag/browser doesn't grant access) takes
 * precedence; otherwise it's "active" when enabled and "off" when not.
 */
export function phishingStatus(available: boolean, enabled: boolean): PhishingProtectionStatus {
  if (!available) {
    return PhishingProtectionStatus.Unavailable;
  }
  return enabled ? PhishingProtectionStatus.Active : PhishingProtectionStatus.Off;
}
