/**
 * Pure AI-generated-media scoring. Takes per-frame deepfake probabilities (produced elsewhere by an
 * on-device model) and aggregates them into a single verdict. Deterministic and unit-testable — no
 * DOM, no model I/O here.
 *
 * The thresholds are deliberate, conservative cut-offs over a probabilistic classifier; the result
 * is presented as guidance, never a definitive judgement. Nothing here is transmitted or logged.
 */

/** Whether a verdict was produced from a still image or sampled video frames. */
export const MediaKind = Object.freeze({
  Image: "image",
  Video: "video",
} as const);
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];

/** How likely the media is AI-generated / manipulated. */
export const AiMediaVerdictLevel = Object.freeze({
  LikelyAi: "likely-ai",
  Uncertain: "uncertain",
  LikelyAuthentic: "likely-authentic",
} as const);
export type AiMediaVerdictLevel = (typeof AiMediaVerdictLevel)[keyof typeof AiMediaVerdictLevel];

/** Per-frame model output. For a still image there is a single frame at index 0. */
export interface FrameScore {
  index: number;
  /** Position of the frame within the video, in milliseconds (omitted for images). */
  timestampMs?: number;
  /** Model-estimated probability that the frame is AI-generated / a deepfake (0..1). */
  deepfakeProbability: number;
}

export interface AiMediaInput {
  kind: MediaKind;
  frames: FrameScore[];
}

export interface AiMediaVerdict {
  level: AiMediaVerdictLevel;
  /** Aggregate AI-generated probability across all frames (0..1). */
  deepfakeProbability: number;
  /** Frames whose probability crossed the per-frame flag threshold. */
  flaggedFrameCount: number;
  totalFrameCount: number;
  /** Pass-through of the per-frame scores for a breakdown view. */
  frames: FrameScore[];
}

/** At or above this aggregate probability the media is reported as likely AI-generated. */
export const LIKELY_AI_THRESHOLD = 0.7;
/** At or above this aggregate probability the result is uncertain rather than authentic. */
export const UNCERTAIN_THRESHOLD = 0.4;
/** A single frame at or above this probability counts as flagged. */
export const FRAME_FLAG_THRESHOLD = 0.5;

function levelFor(probability: number): AiMediaVerdictLevel {
  if (probability >= LIKELY_AI_THRESHOLD) {
    return AiMediaVerdictLevel.LikelyAi;
  }
  if (probability >= UNCERTAIN_THRESHOLD) {
    return AiMediaVerdictLevel.Uncertain;
  }
  return AiMediaVerdictLevel.LikelyAuthentic;
}

/**
 * Aggregate per-frame scores into a verdict. The aggregate probability is the **maximum** across
 * frames: a manipulated video only needs some fake frames, so the most-suspicious frame drives the
 * result. An empty frame list is treated as authentic (nothing to flag).
 */
export function aggregateVerdict(input: AiMediaInput): AiMediaVerdict {
  const frames = input.frames;
  const deepfakeProbability = frames.reduce(
    (max, frame) => Math.max(max, frame.deepfakeProbability),
    0,
  );
  const flaggedFrameCount = frames.filter(
    (frame) => frame.deepfakeProbability >= FRAME_FLAG_THRESHOLD,
  ).length;

  return {
    level: levelFor(deepfakeProbability),
    deepfakeProbability,
    flaggedFrameCount,
    totalFrameCount: frames.length,
    frames,
  };
}
