import { Injectable, inject } from "@angular/core";
import { Observable, filter, firstValueFrom, map, of, switchMap } from "rxjs";

import { Account, AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType, FieldType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FieldView } from "@bitwarden/common/vault/models/view/field.view";
import { IdentityView } from "@bitwarden/common/vault/models/view/identity.view";
import { CredentialGeneratorService, GenerateRequest, Type } from "@bitwarden/generator-core";

/**
 * Identity-firewall layers. A persona belongs to exactly one layer so activity under one identity
 * can be kept separate from another.
 */
export const PersonaLayer = Object.freeze({
  Real: "Real",
  Business: "Business",
  Creator: "Creator",
  Anonymous: "Anonymous",
} as const);
export type PersonaLayer = (typeof PersonaLayer)[keyof typeof PersonaLayer];

/** Custom-field name used to tag a persona's layer on its underlying Identity cipher. */
export const PERSONA_LAYER_FIELD_NAME = "Black Mask Layer";

export interface CreatePersonaRequest {
  name: string;
  layer: PersonaLayer;
  email?: string;
  notes?: string;
}

/** A persona surfaced from the vault: an Identity cipher tagged with a layer. */
export interface Persona {
  id: string;
  name: string;
  layer: PersonaLayer;
  email?: string;
}

/** Type guard for the known persona layers. */
export function isPersonaLayer(value: string | undefined): value is PersonaLayer {
  return value != null && (Object.values(PersonaLayer) as string[]).includes(value);
}

/**
 * Black Mask persona vault (M1).
 *
 * A "persona" is modelled as a standard vault **Identity** cipher (so it reuses Bitwarden's existing
 * encryption, sync, and autofill) tagged with a layer via a custom field. The email alias is
 * produced by the user's configured email forwarder (e.g. SimpleLogin) through the existing
 * credential generator — no new crypto or network logic is added here.
 */
@Injectable({ providedIn: "root" })
export class PersonaService {
  private accountService = inject(AccountService);
  private cipherService = inject(CipherService);
  private generatorService = inject(CredentialGeneratorService);

  /**
   * Generates an email alias using the user's configured email forwarder.
   * @throws when no forwarder is configured or the forwarder request fails.
   */
  async generateAlias(website?: string): Promise<string> {
    const account = await firstValueFrom(
      this.accountService.activeAccount$.pipe(filter((a): a is Account => a != null)),
    );
    const request: GenerateRequest = { type: Type.email, website, source: "black-mask-persona" };
    const generated = await firstValueFrom(
      this.generatorService.generate$({ on$: of(request), account$: of(account) }),
    );
    return generated.credential;
  }

  /** Creates a persona as an Identity cipher tagged with its layer, and saves it to the vault. */
  async createPersona(request: CreatePersonaRequest): Promise<CipherView> {
    const userId = await firstValueFrom(this.accountService.activeAccount$.pipe(getUserId));

    const cipher = new CipherView();
    cipher.type = CipherType.Identity;
    cipher.name = request.name;
    if (request.notes) {
      cipher.notes = request.notes;
    }

    const identity = new IdentityView();
    const [firstName, ...rest] = request.name.trim().split(/\s+/);
    if (firstName) {
      identity.firstName = firstName;
    }
    if (rest.length > 0) {
      identity.lastName = rest.join(" ");
    }
    if (request.email) {
      identity.email = request.email;
    }
    cipher.identity = identity;

    const layerField = new FieldView();
    layerField.name = PERSONA_LAYER_FIELD_NAME;
    layerField.value = request.layer;
    layerField.type = FieldType.Text;
    cipher.fields = [layerField];

    return this.cipherService.createWithServer(cipher, userId);
  }

  /** Streams the user's personas (Identity ciphers tagged with a layer), excluding deleted items. */
  personas$(): Observable<Persona[]> {
    return this.accountService.activeAccount$.pipe(
      getUserId,
      switchMap((userId) => this.cipherService.cipherViews$(userId)),
      map((ciphers) =>
        ciphers
          .map((cipher) => this.toPersona(cipher))
          .filter((persona): persona is Persona => persona != null),
      ),
    );
  }

  private toPersona(cipher: CipherView): Persona | undefined {
    if (cipher.type !== CipherType.Identity || cipher.deletedDate != null) {
      return undefined;
    }
    const layer = cipher.fields?.find((field) => field.name === PERSONA_LAYER_FIELD_NAME)?.value;
    if (!isPersonaLayer(layer)) {
      return undefined;
    }
    return {
      id: cipher.id,
      name: cipher.name,
      layer,
      email: cipher.identity?.email ?? undefined,
    };
  }
}
