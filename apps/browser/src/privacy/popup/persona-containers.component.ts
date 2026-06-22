import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ButtonModule, CardComponent, ToastService } from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";

import { LayerContainer, PersonaContainerService } from "./services/persona-container.service";
import { PersonaLayer } from "./services/persona.service";

/**
 * Black Mask per-persona browsing containers (M4). Lists the identity layers with their persona
 * counts and opens an isolated Firefox container per layer. Diagnostic/limited on browsers without
 * container support. Gated behind the `black-mask-persona-containers` feature flag at the route.
 */
@Component({
  templateUrl: "./persona-containers.component.html",
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
export class PersonaContainersComponent {
  private readonly containerService = inject(PersonaContainerService);
  private readonly i18nService = inject(I18nService);
  private readonly toastService = inject(ToastService);
  private readonly logService = inject(LogService);

  protected readonly supported = this.containerService.isSupported();

  private readonly layers = toSignal(this.containerService.layers$(), {
    initialValue: [] as LayerContainer[],
  });

  protected readonly rows = computed(() =>
    this.layers().map((row) => ({
      layer: row.layer,
      label: this.layerLabel(row.layer),
      personaCount: row.personaCount,
    })),
  );

  protected async open(layer: PersonaLayer): Promise<void> {
    try {
      await this.containerService.openContainer(layer);
    } catch (e) {
      this.logService.error(e);
      this.toastService.showToast({
        variant: "error",
        title: "",
        message: this.i18nService.t("blackMaskContainerError"),
      });
    }
  }

  private layerLabel(layer: PersonaLayer): string {
    const keys: Record<PersonaLayer, string> = {
      [PersonaLayer.Real]: "blackMaskLayerReal",
      [PersonaLayer.Business]: "blackMaskLayerBusiness",
      [PersonaLayer.Creator]: "blackMaskLayerCreator",
      [PersonaLayer.Anonymous]: "blackMaskLayerAnonymous",
    };
    return this.i18nService.t(keys[layer]);
  }
}
