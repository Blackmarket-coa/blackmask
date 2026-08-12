import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import { from, map } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { CardComponent } from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";
import { computePrivacyScore } from "../privacy-score";
import { TRACKER_BLOCKLIST } from "../trackers/tracker-blocklist";

import { AccountAuditService } from "./services/account-audit.service";
import { FingerprintService } from "./services/fingerprint.service";
import { PersonaService } from "./services/persona.service";
import { TrackerCountService } from "./services/tracker-count.service";

/**
 * Black Mask privacy dashboard. Aggregates local privacy signals into a privacy score and shows
 * tracker-protection status. Gated behind the `black-mask-privacy-dashboard` feature flag.
 */
@Component({
  templateUrl: "./privacy-dashboard.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JslibModule,
    RouterModule,
    PopupPageComponent,
    PopupHeaderComponent,
    PopOutComponent,
    CardComponent,
  ],
})
export class PrivacyDashboardComponent {
  private readonly configService = inject(ConfigService);
  private readonly personaService = inject(PersonaService);
  private readonly trackerCountService = inject(TrackerCountService);
  private readonly accountAuditService = inject(AccountAuditService);
  private readonly fingerprintService = inject(FingerprintService);

  protected readonly accountAudit = toSignal(this.accountAuditService.accountAudit$(), {
    initialValue: { reusedPasswordCount: 0, weakPasswordCount: 0, twoFactorGapCount: 0 },
  });

  protected readonly activeTabTrackerCount = toSignal(
    from(this.trackerCountService.activeTabCount()),
    { initialValue: 0 },
  );

  protected readonly trackerProtectionEnabled = toSignal(
    this.configService.getFeatureFlag$(FeatureFlag.BlackMaskTrackerDetection),
    { initialValue: false },
  );

  protected readonly aiMediaDetectorEnabled = toSignal(
    this.configService.getFeatureFlag$(FeatureFlag.BlackMaskAiMediaDetector),
    { initialValue: false },
  );

  protected readonly personaCount = toSignal(
    this.personaService.personas$().pipe(map((personas) => personas.length)),
    { initialValue: 0 },
  );

  protected readonly knownTrackerCount = String(TRACKER_BLOCKLIST.length);

  /**
   * The last fingerprint measurement, not a fresh one — the probes are expensive enough that the
   * dashboard should not re-run them on every open. Undefined until the user runs the test, which
   * leaves the factor out of the score rather than scoring it zero.
   */
  protected readonly fingerprintBits = toSignal(from(this.fingerprintService.lastMeasuredBits()), {
    initialValue: undefined,
  });

  protected readonly privacyScore = computed(() => {
    const audit = this.accountAudit();
    return computePrivacyScore({
      trackerProtectionEnabled: this.trackerProtectionEnabled(),
      personaCount: this.personaCount(),
      reusedPasswordCount: audit.reusedPasswordCount,
      weakPasswordCount: audit.weakPasswordCount,
      twoFactorGapCount: audit.twoFactorGapCount,
      fingerprintBits: this.fingerprintBits(),
    });
  });
}
