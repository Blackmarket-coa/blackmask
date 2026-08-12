import { Injectable } from "@angular/core";

import {
  FingerprintExposure,
  FingerprintSignals,
  estimateFingerprintEntropy,
} from "../../fingerprint";
import {
  FINGERPRINT_EXPOSURE_SESSION_KEY,
  toFingerprintBits,
} from "../../fingerprint-exposure-store";

const CANDIDATE_FONTS: readonly string[] = [
  "Arial",
  "Arial Black",
  "Calibri",
  "Cambria",
  "Cantarell",
  "Comic Sans MS",
  "Consolas",
  "Courier New",
  "DejaVu Sans",
  "Futura",
  "Georgia",
  "Gill Sans",
  "Helvetica",
  "Impact",
  "Liberation Sans",
  "Lucida Console",
  "Menlo",
  "Monaco",
  "Noto Sans",
  "Open Sans",
  "Optima",
  "Palatino Linotype",
  "Roboto",
  "Segoe UI",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Ubuntu",
  "Verdana",
];

/**
 * Collects browser/device fingerprinting signals from the current (popup) environment and scores
 * their exposure. Everything runs and stays on-device — no probe result is transmitted or logged.
 *
 * v1 runs in the popup document; the underlying signals (user agent, screen, timezone, canvas/WebGL/
 * audio rendering) are materially what a web page sees. Moving the probes to a content script later
 * would measure the exact page environment and per-origin anti-fingerprinting.
 *
 * The entropy total is cached in session storage so the privacy dashboard can include it as a score
 * factor without paying for the probes on every popup open.
 *
 * NEEDS BROWSER VALIDATION: canvas/WebGL/audio/font probes can't be exercised by unit tests.
 */
@Injectable({ providedIn: "root" })
export class FingerprintService {
  async exposure(): Promise<FingerprintExposure> {
    const exposure = estimateFingerprintEntropy(await this.collect());
    await this.cacheBits(exposure.bits);
    return exposure;
  }

  /**
   * The entropy total from the last run, without re-running the probes. Undefined when the test has
   * not been run this session, which the privacy score treats as "not measured" rather than "fully
   * exposed".
   */
  async lastMeasuredBits(): Promise<number | undefined> {
    if (typeof chrome === "undefined" || chrome.storage?.session == null) {
      return undefined;
    }
    const result = await chrome.storage.session.get(FINGERPRINT_EXPOSURE_SESSION_KEY);
    return toFingerprintBits(result?.[FINGERPRINT_EXPOSURE_SESSION_KEY]);
  }

  private async cacheBits(bits: number): Promise<void> {
    if (typeof chrome === "undefined" || chrome.storage?.session == null) {
      return;
    }
    await chrome.storage.session.set({ [FINGERPRINT_EXPOSURE_SESSION_KEY]: bits });
  }

  private async collect(): Promise<FingerprintSignals> {
    const nav = globalThis.navigator;
    const scr = globalThis.screen;
    const webgl = this.webgl();

    return {
      userAgent: nav?.userAgent,
      platform: nav?.platform,
      languages: nav?.languages != null ? [...nav.languages] : undefined,
      timezone: this.timezone(),
      screenResolution: scr != null ? { width: scr.width, height: scr.height } : undefined,
      colorDepth: scr?.colorDepth,
      pixelRatio: globalThis.devicePixelRatio,
      hardwareConcurrency: nav?.hardwareConcurrency,
      deviceMemory: nav != null ? this.readNumber(nav, "deviceMemory") : undefined,
      maxTouchPoints: nav?.maxTouchPoints,
      canvasHash: this.canvasDigest(),
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer,
      audioHash: await this.audioDigest(),
      fonts: this.detectFonts(),
    };
  }

  private timezone(): string | undefined {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    } catch {
      return undefined;
    }
  }

  private canvasDigest(): string | undefined {
    try {
      const doc = globalThis.document;
      const canvas = doc?.createElement("canvas");
      const ctx = canvas?.getContext("2d");
      if (canvas == null || ctx == null) {
        return undefined;
      }
      canvas.width = 240;
      canvas.height = 60;
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(10, 10, 100, 30);
      ctx.fillStyle = "#069";
      ctx.fillText("Black Mask", 12, 14);
      ctx.fillStyle = "rgba(102, 200, 0, 0.7)";
      ctx.fillText("Black Mask", 14, 16);
      return this.digest(canvas.toDataURL());
    } catch {
      return undefined;
    }
  }

  private webgl(): { vendor?: string; renderer?: string } {
    try {
      const canvas = globalThis.document?.createElement("canvas");
      const gl = canvas?.getContext("webgl");
      if (gl == null) {
        return {};
      }
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      if (info == null) {
        return {};
      }
      const vendor: unknown = gl.getParameter(info.UNMASKED_VENDOR_WEBGL);
      const renderer: unknown = gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
      return {
        vendor: typeof vendor === "string" ? vendor : undefined,
        renderer: typeof renderer === "string" ? renderer : undefined,
      };
    } catch {
      return {};
    }
  }

  private async audioDigest(): Promise<string | undefined> {
    try {
      const OfflineCtx = globalThis.OfflineAudioContext;
      if (OfflineCtx == null) {
        return undefined;
      }
      const ctx = new OfflineCtx(1, 5000, 44100);
      const oscillator = ctx.createOscillator();
      oscillator.type = "triangle";
      oscillator.frequency.value = 10000;
      const compressor = ctx.createDynamicsCompressor();
      oscillator.connect(compressor);
      compressor.connect(ctx.destination);
      oscillator.start(0);
      const buffer = await ctx.startRendering();
      const channel = buffer.getChannelData(0);
      let acc = 0;
      for (let i = 0; i < channel.length; i += 1) {
        acc += Math.abs(channel[i]);
      }
      return this.digest(acc.toString());
    } catch {
      return undefined;
    }
  }

  private detectFonts(): string[] {
    try {
      const doc = globalThis.document;
      if (doc?.body == null) {
        return [];
      }
      const baseFonts = ["monospace", "sans-serif", "serif"];
      const span = doc.createElement("span");
      span.style.position = "absolute";
      span.style.left = "-9999px";
      span.style.fontSize = "72px";
      span.textContent = "mmmmmmmmmmlli";
      doc.body.appendChild(span);

      const baseline = new Map<string, { width: number; height: number }>();
      for (const base of baseFonts) {
        span.style.fontFamily = base;
        baseline.set(base, { width: span.offsetWidth, height: span.offsetHeight });
      }

      const detected: string[] = [];
      for (const font of CANDIDATE_FONTS) {
        const matched = baseFonts.some((base) => {
          span.style.fontFamily = `'${font}',${base}`;
          const reference = baseline.get(base);
          return (
            reference != null &&
            (span.offsetWidth !== reference.width || span.offsetHeight !== reference.height)
          );
        });
        if (matched) {
          detected.push(font);
        }
      }

      doc.body.removeChild(span);
      return detected;
    } catch {
      return [];
    }
  }

  private readNumber(target: object, key: string): number | undefined {
    const value: unknown = Reflect.get(target, key);
    return typeof value === "number" ? value : undefined;
  }

  /**
   * Small non-cryptographic digest (djb2) of a probe's output. Used only to detect that a signal is
   * readable and stable for the local fingerprint test — never a security primitive, never stored.
   */
  private digest(input: string): string {
    let hash = 5381;
    for (let i = 0; i < input.length; i += 1) {
      hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
    }
    return (hash >>> 0).toString(16);
  }
}
