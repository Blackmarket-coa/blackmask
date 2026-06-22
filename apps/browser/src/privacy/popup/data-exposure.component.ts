import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { ButtonModule, CardComponent } from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";
import { DataExposureSummary } from "../data-exposure";

import { DataExposureService } from "./services/data-exposure.service";

type CheckStatus = "idle" | "loading" | "error";

/**
 * Black Mask data-exposure dashboard (M4). Checks the account email against the breach database and
 * shows which breaches it appears in and what data was exposed. The lookup runs only on explicit
 * user action. Gated behind the `black-mask-data-exposure` feature flag at the route level.
 */
@Component({
  templateUrl: "./data-exposure.component.html",
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
export class DataExposureComponent {
  private readonly dataExposureService = inject(DataExposureService);

  protected readonly email = toSignal(this.dataExposureService.accountEmail$(), {
    initialValue: "",
  });

  protected readonly status = signal<CheckStatus>("idle");
  protected readonly result = signal<DataExposureSummary | undefined>(undefined);

  protected async check(): Promise<void> {
    const email = this.email();
    if (email === "" || this.status() === "loading") {
      return;
    }

    this.status.set("loading");
    this.result.set(undefined);
    try {
      this.result.set(await this.dataExposureService.checkBreaches(email));
      this.status.set("idle");
    } catch {
      this.status.set("error");
    }
  }
}
