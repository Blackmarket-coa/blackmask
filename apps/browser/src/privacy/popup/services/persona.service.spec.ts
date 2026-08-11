import { TestBed } from "@angular/core/testing";
import { mock, MockProxy } from "jest-mock-extended";
import { firstValueFrom, of } from "rxjs";

import { Account, AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { VendorId } from "@bitwarden/common/tools/extension";
import { UserId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType, FieldType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FieldView } from "@bitwarden/common/vault/models/view/field.view";
import { IdentityView } from "@bitwarden/common/vault/models/view/identity.view";
import {
  Algorithm,
  AlgorithmMetadata,
  CredentialAlgorithm,
  CredentialGeneratorService,
  GeneratedCredential,
  Type,
} from "@bitwarden/generator-core";

import {
  PERSONA_LAYER_FIELD_NAME,
  PersonaLayer,
  PersonaNotEditableError,
  PersonaService,
} from "./persona.service";

describe("PersonaService", () => {
  const userId = "user-1" as UserId;
  let accountService: MockProxy<AccountService>;
  let cipherService: MockProxy<CipherService>;
  let generatorService: MockProxy<CredentialGeneratorService>;
  let service: PersonaService;

  function personaCipher(id: string, name: string, layer?: string, email?: string): CipherView {
    const cipher = new CipherView();
    cipher.id = id;
    cipher.type = CipherType.Identity;
    cipher.name = name;
    // `CipherView` defaults `edit` to false; personally-owned ciphers are editable, and that is
    // what these tests describe unless a case says otherwise.
    cipher.edit = true;
    cipher.identity = new IdentityView();
    if (email) {
      cipher.identity.email = email;
    }
    if (layer) {
      const field = new FieldView();
      field.name = PERSONA_LAYER_FIELD_NAME;
      field.value = layer;
      field.type = FieldType.Text;
      cipher.fields = [field];
    }
    return cipher;
  }

  beforeEach(() => {
    accountService = mock<AccountService>();
    accountService.activeAccount$ = of({ id: userId } as Account);
    cipherService = mock<CipherService>();
    cipherService.createWithServer.mockImplementation(async (cipher) => cipher as CipherView);
    generatorService = mock<CredentialGeneratorService>();

    TestBed.configureTestingModule({
      providers: [
        PersonaService,
        { provide: AccountService, useValue: accountService },
        { provide: CipherService, useValue: cipherService },
        { provide: CredentialGeneratorService, useValue: generatorService },
      ],
    });

    service = TestBed.inject(PersonaService);
  });

  describe("createPersona", () => {
    it("creates an Identity cipher tagged with the chosen layer", async () => {
      const result = await service.createPersona({
        name: "Jane Doe",
        layer: PersonaLayer.Anonymous,
        email: "alias@example.com",
        notes: "a note",
      });

      expect(cipherService.createWithServer).toHaveBeenCalledTimes(1);
      const [cipher, calledUserId] = cipherService.createWithServer.mock.calls[0];
      expect(calledUserId).toBe(userId);
      expect(cipher.type).toBe(CipherType.Identity);
      expect(cipher.name).toBe("Jane Doe");
      expect(cipher.notes).toBe("a note");
      expect(cipher.identity.firstName).toBe("Jane");
      expect(cipher.identity.lastName).toBe("Doe");
      expect(cipher.identity.email).toBe("alias@example.com");

      const layerField = cipher.fields.find((f) => f.name === PERSONA_LAYER_FIELD_NAME);
      expect(layerField?.value).toBe(PersonaLayer.Anonymous);
      expect(result).toBe(cipher);
    });

    it("omits optional fields when not provided", async () => {
      await service.createPersona({ name: "Mononym", layer: PersonaLayer.Business });

      const [cipher] = cipherService.createWithServer.mock.calls[0];
      expect(cipher.identity.firstName).toBe("Mononym");
      expect(cipher.identity.lastName).toBeUndefined();
      expect(cipher.identity.email).toBeUndefined();
    });
  });

  describe("getPersona", () => {
    it("returns the persona including its notes", async () => {
      const cipher = personaCipher("p1", "Jane", PersonaLayer.Creator, "jane@example.com");
      cipher.notes = "a note";
      cipherService.cipherViews$.mockReturnValue(of([cipher]));

      await expect(service.getPersona("p1")).resolves.toEqual({
        id: "p1",
        name: "Jane",
        layer: PersonaLayer.Creator,
        email: "jane@example.com",
        notes: "a note",
        editable: true,
      });
    });

    it("reports a persona shared read-only as not editable", async () => {
      const cipher = personaCipher("p1", "Jane", PersonaLayer.Creator);
      cipher.edit = false;
      cipherService.cipherViews$.mockReturnValue(of([cipher]));

      await expect(service.getPersona("p1")).resolves.toMatchObject({ editable: false });
    });

    it("returns undefined for an id that is not a persona", async () => {
      cipherService.cipherViews$.mockReturnValue(of([personaCipher("p1", "Jane")]));

      await expect(service.getPersona("p1")).resolves.toBeUndefined();
    });
  });

  describe("updatePersona", () => {
    beforeEach(() => {
      cipherService.updateWithServer.mockImplementation(async (cipher) => cipher as CipherView);
      cipherService.getFullCipherView.mockImplementation(async (c) => c as CipherView);
    });

    it("preserves custom fields the user added alongside the layer tag", async () => {
      const cipher = personaCipher("p1", "Jane", PersonaLayer.Anonymous);
      const custom = new FieldView();
      custom.name = "Recovery code";
      custom.value = "abc123";
      custom.type = FieldType.Hidden;
      cipher.fields = [custom, ...(cipher.fields ?? [])];
      cipherService.cipherViews$.mockReturnValue(of([cipher]));

      await service.updatePersona({ id: "p1", name: "Jane", layer: PersonaLayer.Business });

      const [saved] = cipherService.updateWithServer.mock.calls[0];
      expect(saved.fields).toHaveLength(2);
      const preserved = saved.fields.find((f) => f.name === "Recovery code");
      expect(preserved?.value).toBe("abc123");
      expect(preserved?.type).toBe(FieldType.Hidden);
    });

    it("moves the persona to the new layer without duplicating the tag", async () => {
      cipherService.cipherViews$.mockReturnValue(
        of([personaCipher("p1", "Jane", PersonaLayer.Anonymous)]),
      );

      await service.updatePersona({ id: "p1", name: "Jane", layer: PersonaLayer.Real });

      const [saved] = cipherService.updateWithServer.mock.calls[0];
      const layerFields = saved.fields.filter((f) => f.name === PERSONA_LAYER_FIELD_NAME);
      expect(layerFields).toHaveLength(1);
      expect(layerFields[0].value).toBe(PersonaLayer.Real);
    });

    it("clears email and notes when they are emptied", async () => {
      const cipher = personaCipher("p1", "Jane", PersonaLayer.Real, "jane@example.com");
      cipher.notes = "a note";
      cipherService.cipherViews$.mockReturnValue(of([cipher]));

      await service.updatePersona({ id: "p1", name: "Jane", layer: PersonaLayer.Real });

      const [saved] = cipherService.updateWithServer.mock.calls[0];
      expect(saved.identity.email).toBeUndefined();
      expect(saved.notes).toBeUndefined();
    });

    it("re-splits the name across the identity fields", async () => {
      cipherService.cipherViews$.mockReturnValue(
        of([personaCipher("p1", "Jane", PersonaLayer.Real)]),
      );

      await service.updatePersona({ id: "p1", name: "Mary Jane Doe", layer: PersonaLayer.Real });

      const [saved] = cipherService.updateWithServer.mock.calls[0];
      expect(saved.identity.firstName).toBe("Mary");
      expect(saved.identity.lastName).toBe("Jane Doe");
    });

    it("throws when the id is not a persona", async () => {
      cipherService.cipherViews$.mockReturnValue(of([]));

      await expect(
        service.updatePersona({ id: "missing", name: "Jane", layer: PersonaLayer.Real }),
      ).rejects.toThrow("Persona not found.");
      expect(cipherService.updateWithServer).not.toHaveBeenCalled();
    });

    it("refuses to save a persona the user cannot edit", async () => {
      // The vault silently degrades a non-editable update to a partial request carrying only
      // `folderId` and `favorite`, so saving would report success and change nothing.
      const cipher = personaCipher("p1", "Jane", PersonaLayer.Real);
      cipher.edit = false;
      cipherService.cipherViews$.mockReturnValue(of([cipher]));

      await expect(
        service.updatePersona({ id: "p1", name: "Changed", layer: PersonaLayer.Business }),
      ).rejects.toBeInstanceOf(PersonaNotEditableError);
      expect(cipherService.updateWithServer).not.toHaveBeenCalled();
    });
  });

  describe("generateAlias", () => {
    it("returns the credential produced by the generator", async () => {
      generatorService.generate$.mockReturnValue(
        of(new GeneratedCredential("alias@simplelogin.io", Type.email, Date.now())),
      );

      const alias = await service.generateAlias("example.com");

      expect(alias).toBe("alias@simplelogin.io");
      expect(generatorService.generate$).toHaveBeenCalledTimes(1);
    });
  });

  describe("aliasForwarded", () => {
    /** Only `id` is read, so the rest of the metadata is irrelevant to these cases. */
    function preferAlgorithm(id: CredentialAlgorithm) {
      generatorService.preferredAlgorithm$.mockReturnValue(
        of({ id, type: Type.email, weight: 0, i18nKeys: {} } as AlgorithmMetadata),
      );
    }

    it("is true for a forwarder, which gives an address unlinked from the user", async () => {
      preferAlgorithm({ forwarder: "simplelogin" as VendorId });

      await expect(service.aliasForwarded()).resolves.toBe(true);
    });

    it("is false for plus-addressing, which strips back to the real mailbox", async () => {
      preferAlgorithm(Algorithm.plusAddress);

      await expect(service.aliasForwarded()).resolves.toBe(false);
    });

    it("is false for catch-all, which links every persona to one domain", async () => {
      preferAlgorithm(Algorithm.catchall);

      await expect(service.aliasForwarded()).resolves.toBe(false);
    });

    it("falls back to false when the preference cannot be read", async () => {
      // Warning the user is the safe default: claiming separation we could not verify is worse
      // than warning about separation that may in fact exist.
      generatorService.preferredAlgorithm$.mockImplementation(() => {
        throw new Error("unavailable");
      });

      await expect(service.aliasForwarded()).resolves.toBe(false);
    });
  });

  describe("personas$", () => {
    it("returns only Identity ciphers tagged with a known layer", async () => {
      const login = new CipherView();
      login.id = "login-1";
      login.type = CipherType.Login;
      login.name = "A login";

      cipherService.cipherViews$.mockReturnValue(
        of([
          personaCipher("p1", "Jane", PersonaLayer.Anonymous, "jane@example.com"),
          personaCipher("p2", "Plain identity"),
          login,
        ]),
      );

      const personas = await firstValueFrom(service.personas$());

      expect(personas).toEqual([
        { id: "p1", name: "Jane", layer: PersonaLayer.Anonymous, email: "jane@example.com" },
      ]);
    });
  });
});
