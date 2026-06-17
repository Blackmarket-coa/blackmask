import { ChangeDetectionStrategy, Component } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CardComponent } from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";

/**
 * Black Mask privacy dashboard (M0 scaffold).
 *
 * Routed page that will host the in-extension privacy surface (tracker counts, fingerprint
 * exposure, privacy score). Gated behind the `black-mask-privacy-dashboard` feature flag; this
 * initial version renders a placeholder only.
 */
@Component({
  templateUrl: "./privacy-dashboard.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JslibModule, PopupPageComponent, PopupHeaderComponent, PopOutComponent, CardComponent],
})
export class PrivacyDashboardComponent {}
