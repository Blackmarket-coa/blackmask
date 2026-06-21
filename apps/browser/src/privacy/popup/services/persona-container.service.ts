import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";

import { BrowserApi } from "../../../platform/browser/browser-api";
import { containerForLayer } from "../../persona-container";

import { PersonaLayer, PersonaService } from "./persona.service";

/** An identity layer and how many personas live in it. */
export interface LayerContainer {
  layer: PersonaLayer;
  personaCount: number;
}

/**
 * Drives Black Mask's per-layer browsing containers. Each identity layer maps to a Firefox
 * contextual identity (container) so its personas browse with isolated cookies. Firefox only —
 * `isSupported()` is false elsewhere, and the UI degrades gracefully. No vault data leaves the
 * client; only the container name/color/icon are passed to the browser.
 */
@Injectable({ providedIn: "root" })
export class PersonaContainerService {
  private readonly personaService = inject(PersonaService);

  /** Whether the current browser can isolate personas into containers (Firefox). */
  isSupported(): boolean {
    return BrowserApi.supportsContainers();
  }

  /** Persona counts grouped by identity layer, in a stable layer order. */
  layers$(): Observable<LayerContainer[]> {
    return this.personaService.personas$().pipe(
      map((personas) =>
        (Object.values(PersonaLayer) as PersonaLayer[]).map((layer) => ({
          layer,
          personaCount: personas.filter((persona) => persona.layer === layer).length,
        })),
      ),
    );
  }

  /** Opens a new browsing tab isolated in the given layer's container. */
  async openContainer(layer: PersonaLayer): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Containers are not supported in this browser.");
    }
    const descriptor = containerForLayer(layer);
    const cookieStoreId = await BrowserApi.getOrCreateContainer(
      descriptor.name,
      descriptor.color,
      descriptor.icon,
    );
    if (cookieStoreId == null) {
      throw new Error("Could not create the container.");
    }
    await BrowserApi.createNewContainerTab(cookieStoreId);
  }
}
