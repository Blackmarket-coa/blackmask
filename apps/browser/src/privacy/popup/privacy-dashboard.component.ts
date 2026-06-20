import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { CardComponent } from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";
import { TRACKER_BLOCKLIST } from "../trackers/tracker-blocklist";

/**
 * Black Mask privacy dashboard. Surfaces the in-extension privacy posture; currently shows tracker
 * protection status. Gated behind the `black-mask-privacy-dashboard` feature flag.
 */
@Component({
  templateUrl: "./privacy-dashboard.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JslibModule, PopupPageComponent, PopupHeaderComponent, PopOutComponent, CardComponent],
})
export class PrivacyDashboardComponent {
  private readonly configService = inject(ConfigService);

  protected readonly trackerProtectionEnabled = toSignal(
    this.configService.getFeatureFlag$(FeatureFlag.BlackMaskTrackerDetection),
    { initialValue: false },
  );

  protected readonly knownTrackerCount = String(TRACKER_BLOCKLIST.length);
}
