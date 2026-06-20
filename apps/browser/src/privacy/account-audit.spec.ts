import { countReusedPasswords } from "./account-audit";

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
