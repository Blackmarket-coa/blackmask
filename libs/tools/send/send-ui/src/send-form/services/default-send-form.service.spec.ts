import { TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { mock } from "jest-mock-extended";
import { BehaviorSubject } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { WhoCanAccessType } from "@bitwarden/common/tools/models/send-who-can-access-type";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";
import { SendService } from "@bitwarden/common/tools/send/services/send.service.abstraction";
import { SendType } from "@bitwarden/common/tools/send/types/send-type";
import { DialogService, ToastService } from "@bitwarden/components";

import { SendPolicyService } from "../../services/send-policy.service";

import { DefaultSendFormService } from "./default-send-form.service";

describe("DefaultSendFormService", () => {
  let service: DefaultSendFormService;
  let disableHideEmail$: BehaviorSubject<boolean>;

  beforeEach(() => {
    disableHideEmail$ = new BehaviorSubject(false);
    const sendPolicyService = mock<SendPolicyService>();
    Object.defineProperty(sendPolicyService, "disableHideEmail$", { value: disableHideEmail$ });
    Object.defineProperty(sendPolicyService, "whoCanAccess$", {
      value: new BehaviorSubject<WhoCanAccessType | null>(null),
    });

    TestBed.configureTestingModule({
      providers: [
        DefaultSendFormService,
        FormBuilder,
        { provide: DialogService, useValue: mock<DialogService>() },
        { provide: ToastService, useValue: mock<ToastService>() },
        { provide: AccountService, useValue: mock<AccountService>() },
        { provide: SendApiService, useValue: mock<SendApiService>() },
        { provide: SendService, useValue: mock<SendService>() },
        { provide: I18nService, useValue: mock<I18nService>() },
        { provide: SendPolicyService, useValue: sendPolicyService },
      ],
    });
    service = TestBed.inject(DefaultSendFormService);
  });

  describe("a new Send", () => {
    it("hides the sender's email by default", async () => {
      await service.initializeSendForm({
        mode: "add",
        sendType: SendType.Text,
        areSendsAllowed: true,
      });

      expect(service.updatedSendView()?.hideEmail).toBe(true);
    });

    it("leaves the email shown when an organization policy forbids hiding it", async () => {
      disableHideEmail$.next(true);

      await service.initializeSendForm({
        mode: "add",
        sendType: SendType.File,
        areSendsAllowed: true,
      });

      expect(service.updatedSendView()?.hideEmail).toBe(false);
    });

    it("lets preset fields override the default", async () => {
      await service.initializeSendForm({
        mode: "add",
        sendType: SendType.Text,
        areSendsAllowed: true,
        presetSendFields: { hideEmail: false },
      });

      expect(service.updatedSendView()?.hideEmail).toBe(false);
    });
  });
});
