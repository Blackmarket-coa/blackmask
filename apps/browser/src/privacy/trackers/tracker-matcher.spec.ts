import { hostFromUrl, isTrackerHost, isTrackerUrl } from "./tracker-matcher";

describe("tracker-matcher", () => {
  const blocklist = ["google-analytics.com", "doubleclick.net"];

  describe("hostFromUrl", () => {
    it("extracts the lowercase host", () => {
      expect(hostFromUrl("https://WWW.Example.com/path?q=1")).toBe("www.example.com");
    });

    it("returns null for an unparseable url", () => {
      expect(hostFromUrl("not a url")).toBeNull();
    });
  });

  describe("isTrackerHost", () => {
    it("matches an exact tracker domain", () => {
      expect(isTrackerHost("doubleclick.net", blocklist)).toBe(true);
    });

    it("matches a subdomain of a tracker domain", () => {
      expect(isTrackerHost("ssl.google-analytics.com", blocklist)).toBe(true);
    });

    it("does not match an unrelated host", () => {
      expect(isTrackerHost("example.com", blocklist)).toBe(false);
    });

    it("does not match a look-alike suffix", () => {
      expect(isTrackerHost("notdoubleclick.net", blocklist)).toBe(false);
    });
  });

  describe("isTrackerUrl", () => {
    it("flags a tracker request url", () => {
      expect(isTrackerUrl("https://ssl.google-analytics.com/collect", blocklist)).toBe(true);
    });

    it("ignores a non-tracker url", () => {
      expect(isTrackerUrl("https://example.com/app.js", blocklist)).toBe(false);
    });
  });
});
