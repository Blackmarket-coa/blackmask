import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { from } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CardComponent } from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";
import { FingerprintExposureLevel } from "../fingerprint";

import { FingerprintService } from "./services/fingerprint.service";

/**
 * Black Mask fingerprint exposure test (M3). Runs on-device fingerprinting probes and shows how
 * identifying the browser is, with a per-signal breakdown. Diagnostic only — it does not affect the
 * privacy score. Gated behind the `black-mask-fingerprint-test` feature flag at the route level.
 */
@Component({
  templateUrl: "./fingerprint.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JslibModule, PopupPageComponent, PopupHeaderComponent, PopOutComponent, CardComponent],
})
export class FingerprintComponent {
  private readonly fingerprintService = inject(FingerprintService);

  protected readonly FingerprintExposureLevel = FingerprintExposureLevel;

  protected readonly exposure = toSignal(from(this.fingerprintService.exposure()), {
    initialValue: undefined,
  });
}
