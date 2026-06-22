import { TestBed } from "@angular/core/testing";
import { mock } from "jest-mock-extended";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";

import { AiMediaVerdictLevel } from "../../ai-media-detector";

import {
  AiMediaDetectorError,
  AiMediaDetectorErrorReason,
  AiMediaDetectorService,
  deepfakeProbabilityFromResults,
  sampleTimes,
} from "./ai-media-detector.service";

describe("deepfakeProbabilityFromResults", () => {
  it("passes a Deepfake label score straight through", () => {
    const probability = deepfakeProbabilityFromResults([
      { label: "Deepfake", score: 0.83 },
      { label: "Realism", score: 0.17 },
    ]);

    expect(probability).toBeCloseTo(0.83);
  });

  it("uses the complement when only a Realism label is present", () => {
    const probability = deepfakeProbabilityFromResults([{ label: "Realism", score: 0.9 }]);

    expect(probability).toBeCloseTo(0.1);
  });

  it("returns zero for an empty result set", () => {
    expect(deepfakeProbabilityFromResults([])).toBe(0);
  });

  it("clamps scores into the 0..1 range", () => {
    expect(deepfakeProbabilityFromResults([{ label: "Deepfake", score: 1.4 }])).toBe(1);
  });
});

describe("sampleTimes", () => {
  it("samples a single zero timestamp for a zero/unknown duration", () => {
    expect(sampleTimes(0, 16)).toEqual([0]);
    expect(sampleTimes(Number.NaN, 16)).toEqual([0]);
  });

  it("samples roughly one mid-interval frame per second for short clips", () => {
    expect(sampleTimes(5, 16)).toEqual([0.5, 1.5, 2.5, 3.5, 4.5]);
  });

  it("caps the number of samples at maxFrames", () => {
    expect(sampleTimes(120, 16)).toHaveLength(16);
  });
});

describe("AiMediaDetectorService", () => {
  let service: AiMediaDetectorService;
  let logService: ReturnType<typeof mock<LogService>>;

  beforeEach(() => {
    logService = mock<LogService>();
    TestBed.configureTestingModule({
      providers: [AiMediaDetectorService, { provide: LogService, useValue: logService }],
    });
    service = TestBed.inject(AiMediaDetectorService);

    // jsdom does not implement object URLs.
    URL.createObjectURL = jest.fn().mockReturnValue("blob:fake");
    URL.revokeObjectURL = jest.fn();
  });

  function stubClassifier(classifier: jest.Mock) {
    jest.spyOn(service as never, "loadClassifier").mockResolvedValue(classifier as never);
  }

  it("routes images through single-frame classification", async () => {
    const classifier = jest.fn().mockResolvedValue([
      { label: "Deepfake", score: 0.95 },
      { label: "Realism", score: 0.05 },
    ]);
    stubClassifier(classifier);

    const file = new File(["x"], "ai.png", { type: "image/png" });
    const verdict = await service.analyze(file);

    expect(classifier).toHaveBeenCalledTimes(1);
    expect(verdict.level).toBe(AiMediaVerdictLevel.LikelyAi);
    expect(verdict.totalFrameCount).toBe(1);
    expect(verdict.deepfakeProbability).toBeCloseTo(0.95);
  });

  it("routes videos through frame extraction and max-aggregates the verdict", async () => {
    const classifier = jest
      .fn()
      .mockResolvedValueOnce([{ label: "Deepfake", score: 0.1 }])
      .mockResolvedValueOnce([{ label: "Deepfake", score: 0.9 }]);
    stubClassifier(classifier);
    jest.spyOn(service as never, "extractFrames").mockResolvedValue([
      { timestampMs: 0, dataUrl: "data:a" },
      { timestampMs: 1000, dataUrl: "data:b" },
    ] as never);

    const onFrame = jest.fn();
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
    const verdict = await service.analyze(file, { onFrame });

    expect(classifier).toHaveBeenCalledTimes(2);
    expect(verdict.level).toBe(AiMediaVerdictLevel.LikelyAi);
    expect(verdict.deepfakeProbability).toBeCloseTo(0.9);
    expect(verdict.flaggedFrameCount).toBe(1);
    expect(verdict.totalFrameCount).toBe(2);
    expect(onFrame).toHaveBeenLastCalledWith(2, 2);
  });

  it("rejects unsupported file types", async () => {
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });

    await expect(service.analyze(file)).rejects.toMatchObject({
      reason: AiMediaDetectorErrorReason.Unsupported,
    });
  });

  it("wraps a classifier failure as a decode error and logs it", async () => {
    const classifier = jest.fn().mockRejectedValue(new Error("bad image"));
    stubClassifier(classifier);

    const file = new File(["x"], "broken.png", { type: "image/png" });

    await expect(service.analyze(file)).rejects.toBeInstanceOf(AiMediaDetectorError);
    await expect(service.analyze(file)).rejects.toMatchObject({
      reason: AiMediaDetectorErrorReason.Decode,
    });
    expect(logService.error).toHaveBeenCalled();
  });
});
