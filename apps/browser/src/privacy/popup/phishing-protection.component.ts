import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { PhishingDetectionSettingsServiceAbstraction } from "@bitwarden/common/dirt/services/abstractions/phishing-detection-settings.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ButtonModule, CardComponent, ToastService } from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";
import { PhishingProtectionStatus, phishingStatus } from "../phishing-protection";

/**
 * Black Mask phishing-protection page (M4). Surfaces Bitwarden's built-in phishing engine — showing
 * whether protection is active and letting the user toggle it. Detection itself runs in the
 * background against a downloaded blocklist; this page is a control surface. Gated behind the
 * `black-mask-phishing-protection` feature flag at the route level.
 */
@Component({
  templateUrl: "./phishing-protection.component.html",
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
export class PhishingProtectionComponent {
  private readonly settingsService = inject(PhishingDetectionSettingsServiceAbstraction);
  private readonly accountService = inject(AccountService);
  private readonly i18nService = inject(I18nService);
  private readonly toastService = inject(ToastService);
  private readonly logService = inject(LogService);

  protected readonly PhishingProtectionStatus = PhishingProtectionStatus;
  protected readonly saving = signal(false);

  protected readonly available = toSignal(this.settingsService.available$, { initialValue: false });
  protected readonly enabled = toSignal(this.settingsService.enabled$, { initialValue: false });

  protected readonly status = computed(() => phishingStatus(this.available(), this.enabled()));

  protected async toggle(): Promise<void> {
    this.saving.set(true);
    try {
      const userId = await firstValueFrom(getUserId(this.accountService.activeAccount$));
      await this.settingsService.setEnabled(userId, !this.enabled());
    } catch (e) {
      this.logService.error(e);
      this.toastService.showToast({
        variant: "error",
        title: "",
        message: this.i18nService.t("errorOccurred"),
      });
    } finally {
      this.saving.set(false);
    }
  }
}
