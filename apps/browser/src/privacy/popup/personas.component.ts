import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { ButtonModule, CardComponent } from "@bitwarden/components";

import { PopOutComponent } from "../../platform/popup/components/pop-out.component";
import { PopupHeaderComponent } from "../../platform/popup/layout/popup-header.component";
import { PopupPageComponent } from "../../platform/popup/layout/popup-page.component";

import { Persona, PersonaLayer, PersonaService } from "./services/persona.service";

interface PersonaGroup {
  layer: PersonaLayer;
  label: string;
  items: Persona[];
}

/**
 * Black Mask personas list (M1). Shows the user's personas (Identity ciphers tagged with a layer)
 * grouped by layer, with an action to create a new one. Gated behind the `black-mask-persona-vault`
 * feature flag at the route level.
 */
@Component({
  templateUrl: "./personas.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JslibModule,
    RouterModule,
    PopupPageComponent,
    PopupHeaderComponent,
    PopOutComponent,
    CardComponent,
    ButtonModule,
  ],
})
export class PersonasComponent {
  private readonly personaService = inject(PersonaService);
  private readonly i18nService = inject(I18nService);

  protected readonly personas = toSignal(this.personaService.personas$(), {
    initialValue: [] as Persona[],
  });

  protected readonly groups = computed<PersonaGroup[]>(() => {
    const all = this.personas();
    return (Object.values(PersonaLayer) as PersonaLayer[])
      .map((layer) => ({
        layer,
        label: this.layerLabel(layer),
        items: all.filter((persona) => persona.layer === layer),
      }))
      .filter((group) => group.items.length > 0);
  });

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
