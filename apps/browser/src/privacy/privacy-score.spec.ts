import { PrivacyScoreSignals, computePrivacyScore } from "./privacy-score";

/** All-unprotected baseline; tests override only the signal under test. */
const baseSignals: PrivacyScoreSignals = {
  trackerProtectionEnabled: false,
  personaCount: 0,
  reusedPasswordCount: 1,
  weakPasswordCount: 1,
  twoFactorGapCount: 1,
};

describe("computePrivacyScore", () => {
  it("scores zero with no protections", () => {
    const result = computePrivacyScore(baseSignals);

    expect(result.score).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.factors.every((factor) => !factor.met)).toBe(true);
  });

  it("awards tracker-protection points when enabled", () => {
    const result = computePrivacyScore({ ...baseSignals, trackerProtectionEnabled: true });

    expect(result.score).toBe(50);
    expect(result.factors.find((factor) => factor.id === "tracker-protection")?.met).toBe(true);
  });

  it("awards persona points up to the cap", () => {
    const result = computePrivacyScore({ ...baseSignals, personaCount: 10 });

    expect(result.factors.find((factor) => factor.id === "personas")?.earned).toBe(50);
  });

  it("awards reused-password points when no passwords are reused", () => {
    const result = computePrivacyScore({ ...baseSignals, reusedPasswordCount: 0 });

    expect(result.factors.find((factor) => factor.id === "reused-passwords")?.met).toBe(true);
    expect(result.factors.find((factor) => factor.id === "reused-passwords")?.earned).toBe(50);
  });

  it("awards strong-password points when none are weak", () => {
    const result = computePrivacyScore({ ...baseSignals, weakPasswordCount: 0 });

    expect(result.factors.find((factor) => factor.id === "weak-passwords")?.met).toBe(true);
    expect(result.factors.find((factor) => factor.id === "weak-passwords")?.earned).toBe(50);
  });

  it("awards two-factor points when there are no gaps", () => {
    const result = computePrivacyScore({ ...baseSignals, twoFactorGapCount: 0 });

    expect(result.factors.find((factor) => factor.id === "two-factor")?.met).toBe(true);
    expect(result.factors.find((factor) => factor.id === "two-factor")?.earned).toBe(50);
  });

  it("reaches 100% with full protections", () => {
    const result = computePrivacyScore({
      trackerProtectionEnabled: true,
      personaCount: 5,
      reusedPasswordCount: 0,
      weakPasswordCount: 0,
      twoFactorGapCount: 0,
    });

    expect(result.score).toBe(250);
    expect(result.max).toBe(250);
    expect(result.percent).toBe(100);
  });
});
