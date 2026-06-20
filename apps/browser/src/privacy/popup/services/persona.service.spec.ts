import { TestBed } from "@angular/core/testing";
import { mock, MockProxy } from "jest-mock-extended";
import { firstValueFrom, of } from "rxjs";

import { Account, AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { UserId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType, FieldType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FieldView } from "@bitwarden/common/vault/models/view/field.view";
import { IdentityView } from "@bitwarden/common/vault/models/view/identity.view";
import { CredentialGeneratorService, GeneratedCredential, Type } from "@bitwarden/generator-core";

import { PERSONA_LAYER_FIELD_NAME, PersonaLayer, PersonaService } from "./persona.service";

describe("PersonaService", () => {
  const userId = "user-1" as UserId;
  let accountService: MockProxy<AccountService>;
  let cipherService: MockProxy<CipherService>;
  let generatorService: MockProxy<CredentialGeneratorService>;
  let service: PersonaService;

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

  describe("personas$", () => {
    function identityCipher(id: string, name: string, layer?: string, email?: string): CipherView {
      const cipher = new CipherView();
      cipher.id = id;
      cipher.type = CipherType.Identity;
      cipher.name = name;
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

    it("returns only Identity ciphers tagged with a known layer", async () => {
      const login = new CipherView();
      login.id = "login-1";
      login.type = CipherType.Login;
      login.name = "A login";

      cipherService.cipherViews$.mockReturnValue(
        of([
          identityCipher("p1", "Jane", PersonaLayer.Anonymous, "jane@example.com"),
          identityCipher("p2", "Plain identity"),
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
