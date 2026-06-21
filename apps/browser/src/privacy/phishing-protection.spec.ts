import { PhishingProtectionStatus, phishingStatus } from "./phishing-protection";

describe("phishingStatus", () => {
  it("is active when available and enabled", () => {
    expect(phishingStatus(true, true)).toBe(PhishingProtectionStatus.Active);
  });

  it("is off when available but not enabled", () => {
    expect(phishingStatus(true, false)).toBe(PhishingProtectionStatus.Off);
  });

  it("is unavailable when not available, regardless of enabled", () => {
    expect(phishingStatus(false, true)).toBe(PhishingProtectionStatus.Unavailable);
    expect(phishingStatus(false, false)).toBe(PhishingProtectionStatus.Unavailable);
  });
});
