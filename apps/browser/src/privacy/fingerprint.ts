/**
 * Pure fingerprint-exposure scoring. Takes a snapshot of browser/device signals (collected
 * elsewhere) and estimates how identifying they are, in bits. Deterministic and unit-testable — no
 * DOM access here.
 *
 * The per-signal weights are rough population-entropy estimates drawn from public fingerprinting
 * research (e.g. EFF's Cover Your Tracks / Panopticlick). Real-world signals are correlated, so the
 * summed total over-states true uniqueness somewhat; it is presented as an on-device estimate, never
 * a precise measurement, and nothing here is transmitted or logged.
 */

/** Raw signals a probe can collect from the current environment. All optional — absence = not exposed. */
export interface FingerprintSignals {
  userAgent?: string;
  platform?: string;
  languages?: readonly string[];
  timezone?: string;
  screenResolution?: { width: number; height: number };
  colorDepth?: number;
  pixelRatio?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  maxTouchPoints?: number;
  /** Non-cryptographic digest of a rendered canvas; presence means canvas readback is exposed. */
  canvasHash?: string;
  webglVendor?: string;
  webglRenderer?: string;
  /** Non-cryptographic digest of rendered audio; presence means the audio stack is exposed. */
  audioHash?: string;
  fonts?: readonly string[];
}

export const FingerprintExposureLevel = Object.freeze({
  Low: "low",
  Medium: "medium",
  High: "high",
} as const);
export type FingerprintExposureLevel =
  (typeof FingerprintExposureLevel)[keyof typeof FingerprintExposureLevel];

/** Result for one signal: whether the browser exposed it and its estimated entropy contribution. */
export interface FingerprintSignalResult {
  id: string;
  /** i18n key for the signal's label. */
  labelKey: string;
  revealed: boolean;
  /** Estimated entropy contribution in bits (0 when not revealed). */
  bits: number;
  /** Short, user-facing value summary (the user's own environment; safe to show locally). */
  detail?: string;
}

export interface FingerprintExposure {
  /** Total estimated entropy in bits. */
  bits: number;
  level: FingerprintExposureLevel;
  signals: FingerprintSignalResult[];
}

interface ProbeDefinition {
  id: string;
  labelKey: string;
  /** Approximate population entropy this signal can contribute, in bits. */
  maxBits: number;
  read: (signals: FingerprintSignals) => { revealed: boolean; detail?: string };
}

const HIGH_EXPOSURE_BITS = 35;
const MEDIUM_EXPOSURE_BITS = 20;

function isNonEmpty(value: string | undefined): boolean {
  return value != null && value !== "";
}

const PROBES: readonly ProbeDefinition[] = [
  {
    id: "user-agent",
    labelKey: "blackMaskFpUserAgent",
    maxBits: 10,
    read: (s) => ({ revealed: isNonEmpty(s.userAgent) }),
  },
  {
    id: "canvas",
    labelKey: "blackMaskFpCanvas",
    maxBits: 8,
    read: (s) => ({ revealed: isNonEmpty(s.canvasHash) }),
  },
  {
    id: "fonts",
    labelKey: "blackMaskFpFonts",
    maxBits: 7,
    read: (s) => {
      const count = s.fonts?.length ?? 0;
      return { revealed: count > 0, detail: count > 0 ? String(count) : undefined };
    },
  },
  {
    id: "webgl",
    labelKey: "blackMaskFpWebgl",
    maxBits: 6,
    read: (s) => ({
      revealed: isNonEmpty(s.webglRenderer) || isNonEmpty(s.webglVendor),
      detail: s.webglRenderer,
    }),
  },
  {
    id: "screen",
    labelKey: "blackMaskFpScreen",
    maxBits: 5,
    read: (s) =>
      s.screenResolution == null
        ? { revealed: false }
        : {
            revealed: true,
            detail: `${s.screenResolution.width}×${s.screenResolution.height}`,
          },
  },
  {
    id: "timezone",
    labelKey: "blackMaskFpTimezone",
    maxBits: 4,
    read: (s) => ({ revealed: isNonEmpty(s.timezone), detail: s.timezone }),
  },
  {
    id: "audio",
    labelKey: "blackMaskFpAudio",
    maxBits: 3,
    read: (s) => ({ revealed: isNonEmpty(s.audioHash) }),
  },
  {
    id: "hardware-concurrency",
    labelKey: "blackMaskFpHardwareConcurrency",
    maxBits: 3,
    read: (s) =>
      s.hardwareConcurrency == null
        ? { revealed: false }
        : { revealed: true, detail: String(s.hardwareConcurrency) },
  },
  {
    id: "platform",
    labelKey: "blackMaskFpPlatform",
    maxBits: 2,
    read: (s) => ({ revealed: isNonEmpty(s.platform), detail: s.platform }),
  },
  {
    id: "languages",
    labelKey: "blackMaskFpLanguages",
    maxBits: 2,
    read: (s) => {
      const languages = s.languages ?? [];
      return { revealed: languages.length > 0, detail: languages.join(", ") || undefined };
    },
  },
  {
    id: "device-memory",
    labelKey: "blackMaskFpDeviceMemory",
    maxBits: 2,
    read: (s) =>
      s.deviceMemory == null
        ? { revealed: false }
        : { revealed: true, detail: String(s.deviceMemory) },
  },
  {
    id: "pixel-ratio",
    labelKey: "blackMaskFpPixelRatio",
    maxBits: 2,
    read: (s) =>
      s.pixelRatio == null ? { revealed: false } : { revealed: true, detail: String(s.pixelRatio) },
  },
  {
    id: "color-depth",
    labelKey: "blackMaskFpColorDepth",
    maxBits: 1,
    read: (s) =>
      s.colorDepth == null ? { revealed: false } : { revealed: true, detail: String(s.colorDepth) },
  },
  {
    id: "touch",
    labelKey: "blackMaskFpTouch",
    maxBits: 1,
    read: (s) =>
      s.maxTouchPoints == null
        ? { revealed: false }
        : { revealed: true, detail: String(s.maxTouchPoints) },
  },
];

function exposureLevel(bits: number): FingerprintExposureLevel {
  if (bits >= HIGH_EXPOSURE_BITS) {
    return FingerprintExposureLevel.High;
  }
  if (bits >= MEDIUM_EXPOSURE_BITS) {
    return FingerprintExposureLevel.Medium;
  }
  return FingerprintExposureLevel.Low;
}

/** Estimates browser-fingerprint exposure from a snapshot of collected signals. */
export function estimateFingerprintEntropy(signals: FingerprintSignals): FingerprintExposure {
  const results: FingerprintSignalResult[] = PROBES.map((probe) => {
    const read = probe.read(signals);
    return {
      id: probe.id,
      labelKey: probe.labelKey,
      revealed: read.revealed,
      bits: read.revealed ? probe.maxBits : 0,
      detail: read.revealed ? read.detail : undefined,
    };
  });

  const bits = results.reduce((sum, result) => sum + result.bits, 0);
  return { bits, level: exposureLevel(bits), signals: results };
}
