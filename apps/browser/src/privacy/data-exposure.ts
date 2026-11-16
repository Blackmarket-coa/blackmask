/**
 * Pure data-exposure helpers for the Black Mask breach dashboard. No network or vault access here —
 * the caller fetches breaches (via the audit service) and passes them in, so this stays deterministic
 * and unit-testable.
 */

/** A breach the account appeared in, reduced to the fields the dashboard shows. */
export interface BreachSummaryItem {
  name: string;
  title: string;
  domain: string;
  /** ISO date string (e.g. "2013-10-04"). */
  breachDate: string;
  pwnCount: number;
  dataClasses: readonly string[];
}

export interface DataExposureSummary {
  breachCount: number;
  /** Total accounts pwned across all breaches. */
  totalPwned: number;
  /** Unique data classes exposed across all breaches, sorted (e.g. "Emails", "Passwords"). */
  dataClasses: string[];
  /** Breaches sorted by date, most recent first. */
  items: BreachSummaryItem[];
}

/**
 * The data class on the placeholder Vaultwarden returns instead of breach data when the server has
 * no Have I Been Pwned API key ("Manual HIBP Check", pwnCount 0). The placeholder is not a breach.
 */
export const LOOKUP_NOT_CONFIGURED_DATA_CLASS = "Error - No API key set!";

/** The server cannot look up breaches, so the account was not checked. */
export class BreachLookupNotConfiguredError extends Error {
  constructor() {
    super("Breach lookup is not configured on this server");
    this.name = "BreachLookupNotConfiguredError";
  }
}

/** True when the server answered with its "no API key" placeholder instead of breach data. */
export function isLookupNotConfigured(
  breaches: readonly Pick<BreachSummaryItem, "dataClasses">[],
): boolean {
  return breaches.some((breach) => breach.dataClasses.includes(LOOKUP_NOT_CONFIGURED_DATA_CLASS));
}

/** Aggregates a set of breaches into the dashboard summary. */
export function summarizeBreaches(breaches: readonly BreachSummaryItem[]): DataExposureSummary {
  const dataClasses = new Set<string>();
  let totalPwned = 0;

  for (const breach of breaches) {
    totalPwned += breach.pwnCount > 0 ? breach.pwnCount : 0;
    for (const dataClass of breach.dataClasses) {
      if (dataClass !== "") {
        dataClasses.add(dataClass);
      }
    }
  }

  const items = [...breaches].sort((a, b) => b.breachDate.localeCompare(a.breachDate));

  return {
    breachCount: breaches.length,
    totalPwned,
    dataClasses: [...dataClasses].sort((a, b) => a.localeCompare(b)),
    items,
  };
}
