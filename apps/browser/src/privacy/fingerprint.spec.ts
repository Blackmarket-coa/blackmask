import {
  FingerprintExposureLevel,
  FingerprintSignals,
  estimateFingerprintEntropy,
} from "./fingerprint";

/** A fully-exposed desktop browser snapshot. */
const fullSignals: FingerprintSignals = {
  userAgent: "Mozilla/5.0",
  platform: "Linux x86_64",
  languages: ["en-US", "en"],
  timezone: "Europe/London",
  screenResolution: { width: 1920, height: 1080 },
  colorDepth: 24,
  pixelRatio: 2,
  hardwareConcurrency: 8,
  deviceMemory: 8,
  maxTouchPoints: 0,
  canvasHash: "abc123",
  webglVendor: "Intel",
  webglRenderer: "Mesa",
  audioHash: "def456",
  fonts: ["Arial", "Helvetica", "Times"],
};

describe("estimateFingerprintEntropy", () => {
  it("reports zero exposure for an empty snapshot", () => {
    const result = estimateFingerprintEntropy({});

    expect(result.bits).toBe(0);
    expect(result.level).toBe(FingerprintExposureLevel.Low);
    expect(result.signals.every((signal) => !signal.revealed)).toBe(true);
  });

  it("flags a fully-exposed browser as high exposure", () => {
    const result = estimateFingerprintEntropy(fullSignals);

    // Sum of all probe weights: 10+8+7+6+5+4+3+3+2+2+2+2+1+1.
    expect(result.bits).toBe(56);
    expect(result.level).toBe(FingerprintExposureLevel.High);
    expect(result.signals.every((signal) => signal.revealed)).toBe(true);
  });

  it("attributes a signal's weight only when it is revealed", () => {
    const result = estimateFingerprintEntropy({ timezone: "Europe/London", canvasHash: "x" });

    const timezone = result.signals.find((signal) => signal.id === "timezone");
    const canvas = result.signals.find((signal) => signal.id === "canvas");
    const screen = result.signals.find((signal) => signal.id === "screen");

    expect(timezone?.bits).toBe(4);
    expect(canvas?.bits).toBe(8);
    expect(screen?.revealed).toBe(false);
    expect(screen?.bits).toBe(0);
    expect(result.bits).toBe(12);
  });

  it("buckets a mid-range snapshot as medium exposure", () => {
    const result = estimateFingerprintEntropy({
      userAgent: "Mozilla/5.0",
      canvasHash: "x",
      screenResolution: { width: 1280, height: 720 },
    });

    // 10 + 8 + 5 = 23 bits.
    expect(result.bits).toBe(23);
    expect(result.level).toBe(FingerprintExposureLevel.Medium);
  });

  it("surfaces a non-identifying detail for revealed signals", () => {
    const result = estimateFingerprintEntropy({ hardwareConcurrency: 8 });

    const cores = result.signals.find((signal) => signal.id === "hardware-concurrency");
    expect(cores?.detail).toBe("8");
  });

  it("omits the detail when a signal is not revealed", () => {
    const result = estimateFingerprintEntropy({});

    expect(result.signals.every((signal) => signal.detail === undefined)).toBe(true);
  });
});
