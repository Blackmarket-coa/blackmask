/** Locally-available signals used to compute a v1 privacy score (no backend required). */
export interface PrivacyScoreSignals {
  /** Whether tracker blocking is enabled. */
  trackerProtectionEnabled: boolean;
  /** Number of personas the user has created. */
  personaCount: number;
  /** Number of login items whose password is reused on another item. */
  reusedPasswordCount: number;
}

/** A single scored contribution to the privacy score. */
export interface PrivacyScoreFactor {
  id: string;
  /** i18n key for the factor's label. */
  labelKey: string;
  earned: number;
  max: number;
  met: boolean;
}

export interface PrivacyScore {
  score: number;
  max: number;
  /** 0–100 percentage, rounded. */
  percent: number;
  factors: PrivacyScoreFactor[];
}

const TRACKER_POINTS = 50;
const PERSONA_POINTS_EACH = 10;
const PERSONA_MAX = 50;
const ACCOUNT_POINTS = 50;

/**
 * Computes a Black Mask privacy score from locally-available signals. Pure and deterministic; the
 * backend exposure index (breaches, data brokers, fingerprint entropy) will contribute additional
 * factors in later milestones.
 */
export function computePrivacyScore(signals: PrivacyScoreSignals): PrivacyScore {
  const personaEarned = Math.min(
    Math.max(signals.personaCount, 0) * PERSONA_POINTS_EACH,
    PERSONA_MAX,
  );

  const factors: PrivacyScoreFactor[] = [
    {
      id: "tracker-protection",
      labelKey: "blackMaskScoreTrackerProtection",
      earned: signals.trackerProtectionEnabled ? TRACKER_POINTS : 0,
      max: TRACKER_POINTS,
      met: signals.trackerProtectionEnabled,
    },
    {
      id: "personas",
      labelKey: "blackMaskScorePersonas",
      earned: personaEarned,
      max: PERSONA_MAX,
      met: signals.personaCount > 0,
    },
    {
      id: "account-security",
      labelKey: "blackMaskScoreAccountSecurity",
      earned: signals.reusedPasswordCount === 0 ? ACCOUNT_POINTS : 0,
      max: ACCOUNT_POINTS,
      met: signals.reusedPasswordCount === 0,
    },
  ];

  const score = factors.reduce((sum, factor) => sum + factor.earned, 0);
  const max = factors.reduce((sum, factor) => sum + factor.max, 0);
  const percent = max === 0 ? 0 : Math.round((score / max) * 100);

  return { score, max, percent, factors };
}
