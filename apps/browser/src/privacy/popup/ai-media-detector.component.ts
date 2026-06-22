import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ButtonModule, CardComponent } from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";
import { AiMediaVerdict, AiMediaVerdictLevel } from "../ai-media-detector";

import {
  AiMediaDetectorError,
  AiMediaDetectorErrorReason,
  AiMediaDetectorService,
} from "./services/ai-media-detector.service";

const Status = Object.freeze({
  Idle: "idle",
  Downloading: "downloading",
  Analyzing: "analyzing",
  Done: "done",
  Error: "error",
} as const);
type Status = (typeof Status)[keyof typeof Status];

/**
 * Black Mask AI-generated-media detector. Lets the user pick an image or short video and runs an
 * on-device deepfake classifier to estimate how likely it is AI-generated. All inference happens in
 * the browser — only the model weights are fetched (once) and cached; the media never leaves the
 * device. Results are guidance, not a definitive judgement. Gated behind the
 * `black-mask-ai-media-detector` feature flag at the route level.
 */
@Component({
  templateUrl: "./ai-media-detector.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JslibModule,
    PopupPageComponent,
    PopupHeaderComponent,
    PopOutComponent,
    CardComponent,
    ButtonModule,
  ],
})
export class AiMediaDetectorComponent {
  private readonly detector = inject(AiMediaDetectorService);
  private readonly logService = inject(LogService);

  protected readonly AiMediaVerdictLevel = AiMediaVerdictLevel;
  protected readonly Status = Status;

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly status = signal<Status>(Status.Idle);
  protected readonly downloadPercent = signal(0);
  protected readonly frameProgress = signal<{ completed: number; total: number } | null>(null);
  protected readonly verdict = signal<AiMediaVerdict | null>(null);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly busy = computed(
    () => this.status() === Status.Downloading || this.status() === Status.Analyzing,
  );

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectFile(input.files?.[0] ?? null);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.busy()) {
      return;
    }
    this.selectFile(event.dataTransfer?.files?.[0] ?? null);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected async run(): Promise<void> {
    const file = this.selectedFile();
    if (file == null || this.busy()) {
      return;
    }

    this.verdict.set(null);
    this.errorKey.set(null);
    this.downloadPercent.set(0);
    this.frameProgress.set(null);
    this.status.set(Status.Analyzing);

    try {
      const result = await this.detector.analyze(file, {
        onModelProgress: (percent) => {
          this.downloadPercent.set(percent);
          this.status.set(percent >= 100 ? Status.Analyzing : Status.Downloading);
        },
        onFrame: (completed, total) => {
          this.status.set(Status.Analyzing);
          this.frameProgress.set({ completed, total });
        },
      });
      this.verdict.set(result);
      this.status.set(Status.Done);
    } catch (e) {
      this.logService.error(e);
      this.errorKey.set(this.errorKeyFor(e));
      this.status.set(Status.Error);
    }
  }

  protected reset(): void {
    this.selectedFile.set(null);
    this.status.set(Status.Idle);
    this.verdict.set(null);
    this.errorKey.set(null);
    this.frameProgress.set(null);
    this.downloadPercent.set(0);
  }

  protected percent(probability: number): number {
    return Math.round(probability * 100);
  }

  private selectFile(file: File | null): void {
    if (file == null) {
      return;
    }
    this.selectedFile.set(file);
    this.status.set(Status.Idle);
    this.verdict.set(null);
    this.errorKey.set(null);
  }

  private errorKeyFor(e: unknown): string {
    if (e instanceof AiMediaDetectorError) {
      switch (e.reason) {
        case AiMediaDetectorErrorReason.Unsupported:
          return "blackMaskAiMediaErrorUnsupported";
        case AiMediaDetectorErrorReason.Offline:
          return "blackMaskAiMediaErrorOffline";
        case AiMediaDetectorErrorReason.Decode:
          return "blackMaskAiMediaErrorDecode";
      }
    }
    return "errorOccurred";
  }
}
