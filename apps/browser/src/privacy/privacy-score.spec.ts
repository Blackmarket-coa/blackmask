import { computePrivacyScore } from "./privacy-score";

describe("computePrivacyScore", () => {
  it("scores zero with no protections", () => {
    const result = computePrivacyScore({
      trackerProtectionEnabled: false,
      personaCount: 0,
      reusedPasswordCount: 1,
    });

    expect(result.score).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.factors.every((factor) => !factor.met)).toBe(true);
  });

  it("awards tracker-protection points when enabled", () => {
    const result = computePrivacyScore({
      trackerProtectionEnabled: true,
      personaCount: 0,
      reusedPasswordCount: 1,
    });

    expect(result.score).toBe(50);
    expect(result.factors.find((factor) => factor.id === "tracker-protection")?.met).toBe(true);
  });

  it("awards persona points up to the cap", () => {
    const result = computePrivacyScore({
      trackerProtectionEnabled: false,
      personaCount: 10,
      reusedPasswordCount: 1,
    });

    expect(result.factors.find((factor) => factor.id === "personas")?.earned).toBe(50);
  });

  it("awards account-security points when no passwords are reused", () => {
    const result = computePrivacyScore({
      trackerProtectionEnabled: false,
      personaCount: 0,
      reusedPasswordCount: 0,
    });

    expect(result.factors.find((factor) => factor.id === "account-security")?.met).toBe(true);
    expect(result.factors.find((factor) => factor.id === "account-security")?.earned).toBe(50);
  });

  it("reaches 100% with full protections", () => {
    const result = computePrivacyScore({
      trackerProtectionEnabled: true,
      personaCount: 5,
      reusedPasswordCount: 0,
    });

    expect(result.score).toBe(150);
    expect(result.max).toBe(150);
    expect(result.percent).toBe(100);
  });
});
