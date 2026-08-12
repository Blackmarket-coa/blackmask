/**
 * Session-scoped cache of the last fingerprint-exposure measurement.
 *
 * The probes behind that measurement are not cheap — the font probe forces a layout per candidate
 * font, and the audio probe renders an offline buffer — so the privacy dashboard reads the last
 * result rather than re-running them every time the popup opens. The fingerprint page writes it.
 *
 * Only the entropy total is kept. The underlying signals describe the user's device and never leave
 * the popup, so there is nothing here worth persisting past the browser session.
 */
export const FINGERPRINT_EXPOSURE_SESSION_KEY = "blackMaskFingerprintBits";

/** Parses a stored value into a usable bit count, or undefined when absent or malformed. */
export function toFingerprintBits(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}
