import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";

import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";

import { DataExposureSummary, summarizeBreaches } from "../../data-exposure";

/**
 * Reads breach-exposure data for the Black Mask data-exposure dashboard. The lookup runs only when
 * the user asks for it; the account email is sent to the user's own authenticated backend
 * (`/hibp/breach`), never to a third party, and no breach data is logged.
 */
@Injectable({ providedIn: "root" })
export class DataExposureService {
  private readonly auditService = inject(AuditService);
  private readonly accountService = inject(AccountService);

  /** The active account's email, used as the breach lookup key. */
  accountEmail$(): Observable<string> {
    return this.accountService.activeAccount$.pipe(map((account) => account?.email ?? ""));
  }

  /** Looks up breaches for the given email and aggregates them for display. */
  async checkBreaches(email: string): Promise<DataExposureSummary> {
    const breaches = await this.auditService.breachedAccounts(email);
    return summarizeBreaches(
      breaches.map((breach) => ({
        name: breach.name,
        title: breach.title,
        domain: breach.domain,
        breachDate: breach.breachDate,
        pwnCount: breach.pwnCount,
        dataClasses: breach.dataClasses ?? [],
      })),
    );
  }
}
