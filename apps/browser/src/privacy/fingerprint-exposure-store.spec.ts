import { toFingerprintBits } from "./fingerprint-exposure-store";

describe("toFingerprintBits", () => {
  it("accepts a finite non-negative number", () => {
    expect(toFingerprintBits(0)).toBe(0);
    expect(toFingerprintBits(41.5)).toBe(41.5);
  });

  it("rejects values that would silently distort the score", () => {
    // Session storage is untyped, so anything could come back. Each of these must read as
    // "not measured" rather than reaching the score as a number.
    expect(toFingerprintBits(undefined)).toBeUndefined();
    expect(toFingerprintBits(null)).toBeUndefined();
    expect(toFingerprintBits("41")).toBeUndefined();
    expect(toFingerprintBits(NaN)).toBeUndefined();
    expect(toFingerprintBits(Infinity)).toBeUndefined();
    expect(toFingerprintBits(-1)).toBeUndefined();
  });
});
