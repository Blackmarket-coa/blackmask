/**
 * Pure account-security audit helpers for the privacy score. No vault access here — callers pass in
 * the data. Weak-password and 2FA-gap factors are deferred (they need additional services).
 */

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
