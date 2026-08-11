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

export interface UpdatePersonaRequest extends CreatePersonaRequest {
  /** Id of the Identity cipher backing the persona. */
  id: string;
}

/** A persona surfaced from the vault: an Identity cipher tagged with a layer. */
export interface Persona {
  id: string;
  name: string;
  layer: PersonaLayer;
  email?: string;
}

/** A persona plus the fields only needed when editing one. */
export interface PersonaDetail extends Persona {
  notes?: string;
  /**
   * False for a persona shared from an organization that the user may read but not change. The
   * vault update path silently degrades to a partial request for those, sending only `folderId`
   * and `favorite`, so an editor that ignored this would report success while dropping every edit.
   */
  editable: boolean;
}

/** Thrown when a save is attempted against a persona the user only has read access to. */
export class PersonaNotEditableError extends Error {
  constructor() {
    super("Persona is not editable.");
    this.name = "PersonaNotEditableError";
  }
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
    this.applyRequest(cipher, request);

    return this.cipherService.createWithServer(cipher, userId);
  }

  /** Reads a single persona, or `undefined` when the id is not a persona the user owns. */
  async getPersona(id: string): Promise<PersonaDetail | undefined> {
    const cipher = await this.findPersonaCipher(id);
    if (cipher == null) {
      return undefined;
    }
    const persona = this.toPersona(cipher);
    return persona && { ...persona, notes: cipher.notes, editable: cipher.edit };
  }

  /**
   * Updates an existing persona in place.
   * @throws when the id does not resolve to a persona, or resolves to one the user cannot edit.
   */
  async updatePersona(request: UpdatePersonaRequest): Promise<CipherView> {
    const userId = await firstValueFrom(this.accountService.activeAccount$.pipe(getUserId));

    const existing = await this.findPersonaCipher(request.id);
    if (existing == null) {
      throw new Error("Persona not found.");
    }
    // Refuse rather than let the vault degrade to a partial update: that path keeps only
    // `folderId` and `favorite`, so the save would appear to succeed and change nothing.
    if (!existing.edit) {
      throw new PersonaNotEditableError();
    }

    const cipher = await this.cipherService.getFullCipherView(existing);
    this.applyRequest(cipher, request);

    return this.cipherService.updateWithServer(cipher, userId);
  }

  /** Writes a create/update request onto a cipher, shared so create and edit cannot drift apart. */
  private applyRequest(cipher: CipherView, request: CreatePersonaRequest): void {
    cipher.name = request.name;
    // Assign rather than guard on truthiness: clearing the field in the editor has to clear it
    // on the cipher too.
    cipher.notes = request.notes;

    const identity = cipher.identity ?? new IdentityView();
    const [firstName, ...rest] = request.name.trim().split(/\s+/);
    identity.firstName = firstName || undefined;
    identity.lastName = rest.length > 0 ? rest.join(" ") : undefined;
    identity.email = request.email;
    cipher.identity = identity;

    cipher.fields = this.withLayerField(cipher.fields, request.layer);
  }

  /**
   * Returns the cipher's fields with the layer tag set, preserving every other custom field.
   * Replacing the whole array here would silently discard custom fields the user added by hand.
   */
  private withLayerField(fields: FieldView[] | undefined, layer: PersonaLayer): FieldView[] {
    const layerField = new FieldView();
    layerField.name = PERSONA_LAYER_FIELD_NAME;
    layerField.value = layer;
    layerField.type = FieldType.Text;

    const others = (fields ?? []).filter((field) => field.name !== PERSONA_LAYER_FIELD_NAME);
    return [...others, layerField];
  }

  private async findPersonaCipher(id: string): Promise<CipherView | undefined> {
    const userId = await firstValueFrom(this.accountService.activeAccount$.pipe(getUserId));
    const ciphers = await firstValueFrom(this.cipherService.cipherViews$(userId));
    return ciphers.find((cipher) => cipher.id === id && this.toPersona(cipher) != null);
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
