import { TestBed } from "@angular/core/testing";
import { mock, MockProxy } from "jest-mock-extended";

import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { BreachAccountResponse } from "@bitwarden/common/dirt/models/response/breach-account.response";

import {
  BreachLookupNotConfiguredError,
  LOOKUP_NOT_CONFIGURED_DATA_CLASS,
} from "../../data-exposure";

import { DataExposureService } from "./data-exposure.service";

describe("DataExposureService", () => {
  let auditService: MockProxy<AuditService>;
  let service: DataExposureService;

  beforeEach(() => {
    auditService = mock<AuditService>();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuditService, useValue: auditService },
        { provide: AccountService, useValue: mock<AccountService>() },
      ],
    });
    service = TestBed.inject(DataExposureService);
  });

  it("summarizes real breaches", async () => {
    auditService.breachedAccounts.mockResolvedValue([
      mock<BreachAccountResponse>({
        name: "Example",
        title: "Example",
        domain: "example.com",
        breachDate: "2015-01-01",
        pwnCount: 100,
        dataClasses: ["Emails", "Passwords"],
      }),
    ]);

    const summary = await service.checkBreaches("user@example.com");

    expect(summary.breachCount).toBe(1);
    expect(summary.dataClasses).toEqual(["Emails", "Passwords"]);
  });

  it("refuses to count the server's no-API-key placeholder as a breach", async () => {
    auditService.breachedAccounts.mockResolvedValue([
      mock<BreachAccountResponse>({
        name: "HaveIBeenPwned",
        title: "Manual HIBP Check",
        domain: "haveibeenpwned.com",
        breachDate: "2019-08-18T00:00:00Z",
        pwnCount: 0,
        dataClasses: [LOOKUP_NOT_CONFIGURED_DATA_CLASS],
      }),
    ]);

    await expect(service.checkBreaches("user@example.com")).rejects.toBeInstanceOf(
      BreachLookupNotConfiguredError,
    );
  });
});
