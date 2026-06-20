import { Injectable, inject } from "@angular/core";
import { Observable, map, switchMap } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";

import { countReusedPasswords } from "../../account-audit";

/**
 * Reads lightweight account-security signals from the vault for the privacy score. v1 reports only
 * reused passwords; weak-password and 2FA-gap signals are deferred.
 */
@Injectable({ providedIn: "root" })
export class AccountAuditService {
  private readonly accountService = inject(AccountService);
  private readonly cipherService = inject(CipherService);

  /** Number of login items whose password is reused on another item. */
  reusedPasswordCount$(): Observable<number> {
    return this.accountService.activeAccount$.pipe(
      getUserId,
      switchMap((userId) => this.cipherService.cipherViews$(userId)),
      map((ciphers) =>
        countReusedPasswords(
          ciphers
            .filter((cipher) => cipher.type === CipherType.Login && cipher.deletedDate == null)
            .map((cipher) => cipher.login?.password),
        ),
      ),
    );
  }
}
