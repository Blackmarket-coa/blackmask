import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { from } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { CardComponent } from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";
import { TRACKER_BLOCKLIST } from "../trackers/tracker-blocklist";

import { TrackerCountService } from "./services/tracker-count.service";

/**
 * Black Mask trackers detail page (M2). Surfaces tracker-protection status, the live per-tab tracker
 * count, and the full blocklist of known tracker domains so the protection is visible in-page. Gated
 * behind the `black-mask-tracker-detection` feature flag at the route level.
 */
@Component({
  templateUrl: "./trackers.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JslibModule, PopupPageComponent, PopupHeaderComponent, PopOutComponent, CardComponent],
})
export class TrackersComponent {
  private readonly configService = inject(ConfigService);
  private readonly trackerCountService = inject(TrackerCountService);

  protected readonly protectionEnabled = toSignal(
    this.configService.getFeatureFlag$(FeatureFlag.BlackMaskTrackerDetection),
    { initialValue: false },
  );

  protected readonly activeTabCount = toSignal(from(this.trackerCountService.activeTabCount()), {
    initialValue: 0,
  });

  protected readonly blocklist: readonly string[] = [...TRACKER_BLOCKLIST].sort((a, b) =>
    a.localeCompare(b),
  );
}
