import { countReusedPasswords, countTwoFactorGaps, countWeakPasswords } from "./account-audit";

describe("countReusedPasswords", () => {
  it("returns 0 when every password is unique", () => {
    expect(countReusedPasswords(["a", "b", "c"])).toBe(0);
  });

  it("counts the items that share a password", () => {
    expect(countReusedPasswords(["a", "a", "b"])).toBe(2);
  });

  it("ignores empty and missing passwords", () => {
    expect(countReusedPasswords(["", undefined, null, "a", "a"])).toBe(2);
  });

  it("sums across multiple reused groups", () => {
    expect(countReusedPasswords(["a", "a", "c", "c", "c", "d"])).toBe(5);
  });
});

describe("countWeakPasswords", () => {
  it("counts scores at or below the default weak threshold (2)", () => {
    expect(countWeakPasswords([0, 1, 2, 3, 4])).toBe(3);
  });

  it("ignores missing scores", () => {
    expect(countWeakPasswords([undefined, null, 1])).toBe(1);
  });

  it("respects a custom threshold", () => {
    expect(countWeakPasswords([0, 1, 2, 3], 1)).toBe(2);
  });

  it("returns 0 when every password is strong", () => {
    expect(countWeakPasswords([3, 4, 4])).toBe(0);
  });
});

describe("countTwoFactorGaps", () => {
  const sites = new Set(["github.com", "google.com"]);

  it("flags logins on a 2FA-capable site with no TOTP", () => {
    expect(countTwoFactorGaps([{ hasTotp: false, domains: ["github.com"] }], sites)).toBe(1);
  });

  it("ignores logins that already have a TOTP secret", () => {
    expect(countTwoFactorGaps([{ hasTotp: true, domains: ["github.com"] }], sites)).toBe(0);
  });

  it("ignores logins whose domains are not 2FA-capable", () => {
    expect(countTwoFactorGaps([{ hasTotp: false, domains: ["example.com"] }], sites)).toBe(0);
  });

  it("counts each gap login once even with multiple matching domains", () => {
    expect(
      countTwoFactorGaps([{ hasTotp: false, domains: ["github.com", "google.com"] }], sites),
    ).toBe(1);
  });

  it("sums gaps across multiple logins", () => {
    expect(
      countTwoFactorGaps(
        [
          { hasTotp: false, domains: ["github.com"] },
          { hasTotp: false, domains: ["google.com"] },
          { hasTotp: true, domains: ["github.com"] },
          { hasTotp: false, domains: ["example.com"] },
        ],
        sites,
      ),
    ).toBe(2);
  });
});
