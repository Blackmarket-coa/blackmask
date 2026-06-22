import { AiMediaVerdictLevel, FrameScore, MediaKind, aggregateVerdict } from "./ai-media-detector";

function imageFrame(deepfakeProbability: number): FrameScore {
  return { index: 0, deepfakeProbability };
}

function videoFrames(probabilities: number[]): FrameScore[] {
  return probabilities.map((deepfakeProbability, index) => ({
    index,
    timestampMs: index * 1000,
    deepfakeProbability,
  }));
}

describe("aggregateVerdict", () => {
  it("treats an empty frame list as authentic", () => {
    const result = aggregateVerdict({ kind: MediaKind.Image, frames: [] });

    expect(result.level).toBe(AiMediaVerdictLevel.LikelyAuthentic);
    expect(result.deepfakeProbability).toBe(0);
    expect(result.totalFrameCount).toBe(0);
    expect(result.flaggedFrameCount).toBe(0);
  });

  it("reports a high-probability image as likely AI", () => {
    const result = aggregateVerdict({ kind: MediaKind.Image, frames: [imageFrame(0.92)] });

    expect(result.level).toBe(AiMediaVerdictLevel.LikelyAi);
    expect(result.deepfakeProbability).toBeCloseTo(0.92);
    expect(result.flaggedFrameCount).toBe(1);
    expect(result.totalFrameCount).toBe(1);
  });

  it("reports a low-probability image as likely authentic", () => {
    const result = aggregateVerdict({ kind: MediaKind.Image, frames: [imageFrame(0.05)] });

    expect(result.level).toBe(AiMediaVerdictLevel.LikelyAuthentic);
    expect(result.flaggedFrameCount).toBe(0);
  });

  it("reports a mid-probability image as uncertain", () => {
    const result = aggregateVerdict({ kind: MediaKind.Image, frames: [imageFrame(0.55)] });

    expect(result.level).toBe(AiMediaVerdictLevel.Uncertain);
    expect(result.flaggedFrameCount).toBe(1);
  });

  it("treats the exact likely-AI threshold as likely AI", () => {
    const result = aggregateVerdict({ kind: MediaKind.Image, frames: [imageFrame(0.7)] });

    expect(result.level).toBe(AiMediaVerdictLevel.LikelyAi);
  });

  it("treats the exact uncertain threshold as uncertain", () => {
    const result = aggregateVerdict({ kind: MediaKind.Image, frames: [imageFrame(0.4)] });

    expect(result.level).toBe(AiMediaVerdictLevel.Uncertain);
  });

  it("flags a video on its most-suspicious frame using max aggregation", () => {
    const result = aggregateVerdict({
      kind: MediaKind.Video,
      frames: videoFrames([0.1, 0.1, 0.9, 0.1, 0.1]),
    });

    expect(result.level).toBe(AiMediaVerdictLevel.LikelyAi);
    expect(result.deepfakeProbability).toBeCloseTo(0.9);
    expect(result.flaggedFrameCount).toBe(1);
    expect(result.totalFrameCount).toBe(5);
  });

  it("counts every flagged frame above the per-frame threshold", () => {
    const result = aggregateVerdict({
      kind: MediaKind.Video,
      frames: videoFrames([0.6, 0.8, 0.2, 0.51, 0.49]),
    });

    expect(result.flaggedFrameCount).toBe(3);
  });

  it("passes the per-frame scores through for a breakdown view", () => {
    const frames = videoFrames([0.2, 0.3]);
    const result = aggregateVerdict({ kind: MediaKind.Video, frames });

    expect(result.frames).toBe(frames);
  });
});
