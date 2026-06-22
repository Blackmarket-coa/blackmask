/**
 * Pure account-security audit helpers for the privacy score. No vault access here — callers pass in
 * the data (passwords, pre-computed strength scores, login domains), so these stay deterministic and
 * unit-testable. The vault read and password-strength scoring live in the Angular service.
 */

/** zxcvbn scores at or below this value (0–4 scale) are considered weak. Matches the vault report. */
export const WEAK_PASSWORD_MAX_SCORE = 2;

/** Counts how many login items share a password with at least one other item (i.e. are reused). */
export function countReusedPasswords(passwords: ReadonlyArray<string | undefined | null>): number {
  const occurrences = new Map<string, number>();
  for (const password of passwords) {
    if (password == null || password === "") {
      continue;
    }
    occurrences.set(password, (occurrences.get(password) ?? 0) + 1);
  }

  let reused = 0;
  for (const count of occurrences.values()) {
    if (count > 1) {
      reused += count;
    }
  }
  return reused;
}

/**
 * Counts how many provided zxcvbn scores fall at or below the weak threshold. Missing scores (e.g.
 * items with no password) are ignored.
 */
export function countWeakPasswords(
  scores: ReadonlyArray<number | undefined | null>,
  maxWeakScore: number = WEAK_PASSWORD_MAX_SCORE,
): number {
  let weak = 0;
  for (const score of scores) {
    if (score != null && score <= maxWeakScore) {
      weak += 1;
    }
  }
  return weak;
}

/** A login's two-factor posture: whether it already has a TOTP secret and the domains it covers. */
export interface TwoFactorLogin {
  hasTotp: boolean;
  domains: readonly string[];
}

/**
 * Counts logins that have no two-step login configured but sit on a 2FA-capable site. A login is a
 * "gap" when it has no TOTP secret and at least one of its domains is in the 2FA-capable set.
 */
export function countTwoFactorGaps(
  logins: ReadonlyArray<TwoFactorLogin>,
  twoFactorSites: ReadonlySet<string>,
): number {
  let gaps = 0;
  for (const login of logins) {
    if (login.hasTotp) {
      continue;
    }
    if (login.domains.some((domain) => twoFactorSites.has(domain))) {
      gaps += 1;
    }
  }
  return gaps;
}
