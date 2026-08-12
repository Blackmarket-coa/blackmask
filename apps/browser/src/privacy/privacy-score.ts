/** Locally-available signals used to compute a v1 privacy score (no backend required). */
export interface PrivacyScoreSignals {
  /** Whether tracker blocking is enabled. */
  trackerProtectionEnabled: boolean;
  /** Number of personas the user has created. */
  personaCount: number;
  /** Number of login items whose password is reused on another item. */
  reusedPasswordCount: number;
  /** Number of login items with a weak password. */
  weakPasswordCount: number;
  /** Number of login items on a 2FA-capable site that have no two-step login configured. */
  twoFactorGapCount: number;
  /**
   * Estimated browser-fingerprint entropy in bits, from the most recent run of the fingerprint
   * test. Undefined when the test has never been run — the factor is then left out of the score
   * entirely rather than scored zero, so an unmeasured browser is not penalised as an exposed one.
   */
  fingerprintBits?: number;
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
const REUSED_PASSWORD_POINTS = 50;
const WEAK_PASSWORD_POINTS = 50;
const TWO_FACTOR_POINTS = 50;
const FINGERPRINT_POINTS = 50;

/**
 * Entropy bounds the fingerprint factor scores between: full points at or below the lower bound,
 * none at or above the upper, linear in between. They match the low/medium/high thresholds the
 * fingerprint test itself reports, so the score and that page never disagree.
 *
 * Black Mask does not itself reduce fingerprint entropy — it measures it. The factor still moves
 * with real user action (Firefox's resistFingerprinting, Tor Browser, disabling canvas readback),
 * which is why it is scored on a ramp rather than awarded for merely running the test.
 */
const FINGERPRINT_LOW_BITS = 20;
const FINGERPRINT_HIGH_BITS = 35;

function fingerprintEarned(bits: number): number {
  if (bits <= FINGERPRINT_LOW_BITS) {
    return FINGERPRINT_POINTS;
  }
  if (bits >= FINGERPRINT_HIGH_BITS) {
    return 0;
  }
  const span = FINGERPRINT_HIGH_BITS - FINGERPRINT_LOW_BITS;
  return Math.round(((FINGERPRINT_HIGH_BITS - bits) / span) * FINGERPRINT_POINTS);
}

/**
 * Computes a Black Mask privacy score from locally-available signals. Pure and deterministic; the
 * backend exposure index (breaches, data brokers) will contribute additional factors in later
 * milestones.
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
      id: "reused-passwords",
      labelKey: "blackMaskScoreAccountSecurity",
      earned: signals.reusedPasswordCount === 0 ? REUSED_PASSWORD_POINTS : 0,
      max: REUSED_PASSWORD_POINTS,
      met: signals.reusedPasswordCount === 0,
    },
    {
      id: "weak-passwords",
      labelKey: "blackMaskScoreStrongPasswords",
      earned: signals.weakPasswordCount === 0 ? WEAK_PASSWORD_POINTS : 0,
      max: WEAK_PASSWORD_POINTS,
      met: signals.weakPasswordCount === 0,
    },
    {
      id: "two-factor",
      labelKey: "blackMaskScoreTwoFactor",
      earned: signals.twoFactorGapCount === 0 ? TWO_FACTOR_POINTS : 0,
      max: TWO_FACTOR_POINTS,
      met: signals.twoFactorGapCount === 0,
    },
  ];

  if (signals.fingerprintBits != null) {
    const bits = Math.max(signals.fingerprintBits, 0);
    const earned = fingerprintEarned(bits);
    factors.push({
      id: "fingerprint",
      labelKey: "blackMaskScoreFingerprint",
      earned,
      max: FINGERPRINT_POINTS,
      met: bits <= FINGERPRINT_LOW_BITS,
    });
  }

  const score = factors.reduce((sum, factor) => sum + factor.earned, 0);
  const max = factors.reduce((sum, factor) => sum + factor.max, 0);
  const percent = max === 0 ? 0 : Math.round((score / max) * 100);

  return { score, max, percent, factors };
}
