import { Injectable, inject } from "@angular/core";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";

import { BrowserApi } from "../../../platform/browser/browser-api";
import { AiMediaVerdict, FrameScore, MediaKind, aggregateVerdict } from "../../ai-media-detector";

/** Hugging Face model id for the on-device ViT deepfake classifier (Apache-2.0). */
const MODEL_ID = "onnx-community/Deep-Fake-Detector-v2-Model-ONNX";
/** Upper bound on sampled video frames to keep inference time and memory bounded. */
const MAX_FRAMES = 16;
/** Cap a sampled frame's largest dimension before classifying (the model resizes to 224 anyway). */
const MAX_FRAME_DIMENSION = 512;

export const AiMediaDetectorErrorReason = Object.freeze({
  /** The file is neither an image nor a video the tool can read. */
  Unsupported: "unsupported",
  /** The model weights are not cached and could not be fetched (no network). */
  Offline: "offline",
  /** The media could not be decoded into frames the model could read. */
  Decode: "decode",
  /** Any other failure during analysis. */
  Analysis: "analysis",
} as const);
export type AiMediaDetectorErrorReason =
  (typeof AiMediaDetectorErrorReason)[keyof typeof AiMediaDetectorErrorReason];

/** Typed failure the component maps to a user-facing i18n message. Carries no media content. */
export class AiMediaDetectorError extends Error {
  constructor(
    readonly reason: AiMediaDetectorErrorReason,
    readonly cause?: unknown,
  ) {
    super(`ai-media-detector:${reason}`);
    this.name = "AiMediaDetectorError";
  }
}

export interface AiMediaAnalyzeCallbacks {
  /** Model-download progress (0..100); fires only the first time weights are fetched. */
  onModelProgress?: (percent: number) => void;
  /** Per-frame progress for video: (framesCompleted, totalFrames). */
  onFrame?: (completed: number, total: number) => void;
}

interface ClassificationResult {
  label: string;
  score: number;
}

/** Classifies an image referenced by a URL (object URL or data URL) into label/score pairs. */
type Classifier = (url: string) => Promise<ClassificationResult[]>;

/**
 * Converts the model's label/score output into a single "AI-generated" probability (0..1). The
 * model emits "Realism" and "Deepfake" labels; this prefers an explicit fake label and falls back
 * to the complement of an authentic one. Pure and unit-testable.
 */
export function deepfakeProbabilityFromResults(results: ClassificationResult[]): number {
  if (results == null || results.length === 0) {
    return 0;
  }
  const fake = results.find((r) => /deepfake|fake|synthetic|generated/i.test(r.label));
  if (fake != null) {
    return clamp01(fake.score);
  }
  const real = results.find((r) => /realism|real|authentic|genuine/i.test(r.label));
  if (real != null) {
    return clamp01(1 - real.score);
  }
  return clamp01(results[0].score);
}

/**
 * Even, mid-interval sample timestamps (seconds) across a clip, capped at `maxFrames` and roughly
 * one per second for short clips. Mid-interval offsets avoid the often-blank first/last frames.
 * Pure and unit-testable.
 */
export function sampleTimes(durationSeconds: number, maxFrames: number): number[] {
  if (!(durationSeconds > 0)) {
    return [0];
  }
  const count = Math.max(1, Math.min(Math.ceil(durationSeconds), maxFrames));
  const times: number[] = [];
  for (let i = 0; i < count; i += 1) {
    times.push((durationSeconds * (i + 0.5)) / count);
  }
  return times;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/**
 * Runs the Black Mask AI-generated-media detector entirely on-device. Lazily loads a ViT deepfake
 * classifier (Transformers.js + ONNX Runtime Web) the first time it is used, classifies an image or
 * sampled video frames, and never transmits the media anywhere — only the model weights are fetched
 * (once, from Hugging Face) and then cached by the browser.
 *
 * v1 runs in the popup document, mirroring `FingerprintService`'s on-demand pattern. Heavy inference
 * therefore shares the popup lifecycle: if the popup closes mid-run the analysis aborts (cached
 * weights survive). The UI mitigates this with progress and a pop-out-to-tab affordance; moving the
 * pipeline into the background offscreen document is a documented future enhancement.
 *
 * NEEDS BROWSER VALIDATION: the model load and <video>/<canvas> frame extraction can't be exercised
 * by unit tests; the pure scoring/sampling helpers and the analyze routing are covered by specs.
 */
@Injectable({ providedIn: "root" })
export class AiMediaDetectorService {
  private readonly logService = inject(LogService);

  private classifierPromise?: Promise<Classifier>;

  /** Analyze an image or video file and return an aggregated verdict. */
  async analyze(file: File, callbacks: AiMediaAnalyzeCallbacks = {}): Promise<AiMediaVerdict> {
    if (file.type.startsWith("image/")) {
      const frame = await this.classifyImage(file, callbacks.onModelProgress);
      return aggregateVerdict({ kind: MediaKind.Image, frames: [frame] });
    }
    if (file.type.startsWith("video/")) {
      const frames = await this.classifyVideo(file, callbacks);
      return aggregateVerdict({ kind: MediaKind.Video, frames });
    }
    throw new AiMediaDetectorError(AiMediaDetectorErrorReason.Unsupported);
  }

  /** Classify a single still image. */
  async classifyImage(
    source: Blob,
    onModelProgress?: (percent: number) => void,
  ): Promise<FrameScore> {
    const url = URL.createObjectURL(source);
    try {
      const deepfakeProbability = await this.classifyUrl(url, onModelProgress);
      return { index: 0, deepfakeProbability };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /** Sample frames from a video and classify each, returning per-frame scores. */
  async classifyVideo(file: Blob, callbacks: AiMediaAnalyzeCallbacks = {}): Promise<FrameScore[]> {
    // Load the model up front so download progress is reported before frame work begins.
    const classifier = await this.getClassifier(callbacks.onModelProgress);
    const frames = await this.extractFrames(file);
    const scores: FrameScore[] = [];
    for (let i = 0; i < frames.length; i += 1) {
      const results = await this.runClassifier(classifier, frames[i].dataUrl);
      scores.push({
        index: i,
        timestampMs: frames[i].timestampMs,
        deepfakeProbability: deepfakeProbabilityFromResults(results),
      });
      callbacks.onFrame?.(i + 1, frames.length);
    }
    return scores;
  }

  private async classifyUrl(
    url: string,
    onModelProgress?: (percent: number) => void,
  ): Promise<number> {
    const classifier = await this.getClassifier(onModelProgress);
    const results = await this.runClassifier(classifier, url);
    return deepfakeProbabilityFromResults(results);
  }

  private async runClassifier(
    classifier: Classifier,
    url: string,
  ): Promise<ClassificationResult[]> {
    try {
      return await classifier(url);
    } catch (e) {
      this.logService.error(e);
      throw new AiMediaDetectorError(AiMediaDetectorErrorReason.Decode, e);
    }
  }

  private getClassifier(onModelProgress?: (percent: number) => void): Promise<Classifier> {
    if (this.classifierPromise == null) {
      this.classifierPromise = this.loadClassifier(onModelProgress).catch((e) => {
        // Allow a later retry (e.g. once the network returns) by clearing the cached failure.
        this.classifierPromise = undefined;
        throw e;
      });
    }
    return this.classifierPromise;
  }

  /**
   * Lazily import Transformers.js and build the image-classification pipeline. Kept as a protected
   * method so specs can stub it without pulling the multi-MB runtime into the test/popup bundle.
   */
  protected async loadClassifier(onModelProgress?: (percent: number) => void): Promise<Classifier> {
    try {
      const { pipeline, env } = await import("@huggingface/transformers");

      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.useBrowserCache = true;
      const wasm = env.backends?.onnx?.wasm;
      if (wasm != null) {
        // Serve the ONNX Runtime wasm from the bundled extension copy (see webpack.base.js).
        wasm.wasmPaths = BrowserApi.getRuntimeURL("ort/");
        // Single-threaded: avoids SharedArrayBuffer / cross-origin isolation in the popup.
        wasm.numThreads = 1;
      }

      const pipe = await pipeline("image-classification", MODEL_ID, {
        progress_callback: (info) => {
          if (info.status === "progress") {
            onModelProgress?.(Math.round(info.progress));
          }
        },
      });

      return async (url: string): Promise<ClassificationResult[]> => {
        // A single image input yields ImageClassificationSingle[]; flatten defends against the
        // batched ([][]) shape in the pipeline's return-type union.
        const output = await pipe(url, { top_k: 5 });
        return output.flat().map((item) => ({ label: item.label, score: item.score }));
      };
    } catch (e) {
      this.logService.error(e);
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new AiMediaDetectorError(AiMediaDetectorErrorReason.Offline, e);
      }
      throw new AiMediaDetectorError(AiMediaDetectorErrorReason.Analysis, e);
    }
  }

  /**
   * Decode a video and return downscaled frame snapshots as data URLs. Reuses a single canvas and
   * revokes the object URL when done to bound memory. Kept protected so specs can stub it.
   */
  protected async extractFrames(file: Blob): Promise<{ timestampMs: number; dataUrl: string }[]> {
    const doc = globalThis.document;
    const video = doc.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    try {
      video.muted = true;
      video.preload = "auto";
      video.src = objectUrl;
      await waitForEvent(video, "loadedmetadata");

      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const times = sampleTimes(duration, MAX_FRAMES);
      const canvas = doc.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx == null) {
        throw new AiMediaDetectorError(AiMediaDetectorErrorReason.Decode);
      }

      const frames: { timestampMs: number; dataUrl: string }[] = [];
      for (const time of times) {
        video.currentTime = time;
        await waitForEvent(video, "seeked");

        const { width, height } = scaledDimensions(
          video.videoWidth || MAX_FRAME_DIMENSION,
          video.videoHeight || MAX_FRAME_DIMENSION,
          MAX_FRAME_DIMENSION,
        );
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        frames.push({
          timestampMs: Math.round(time * 1000),
          dataUrl: canvas.toDataURL("image/png"),
        });
      }
      return frames;
    } catch (e) {
      if (e instanceof AiMediaDetectorError) {
        throw e;
      }
      this.logService.error(e);
      throw new AiMediaDetectorError(AiMediaDetectorErrorReason.Decode, e);
    } finally {
      video.src = "";
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function scaledDimensions(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const largest = Math.max(width, height);
  if (largest <= max) {
    return { width, height };
  }
  const ratio = max / largest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

function waitForEvent(el: HTMLMediaElement, event: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error(`video ${event} failed`));
    };
    const cleanup = () => {
      el.removeEventListener(event, onOk);
      el.removeEventListener("error", onErr);
    };
    el.addEventListener(event, onOk, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}
