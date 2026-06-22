import { Injectable, inject } from "@angular/core";
import { Observable, map, switchMap } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { PasswordStrengthServiceAbstraction } from "@bitwarden/common/tools/password-strength";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

import {
  TwoFactorLogin,
  countReusedPasswords,
  countTwoFactorGaps,
  countWeakPasswords,
} from "../../account-audit";
import { TWO_FACTOR_SITES } from "../../two-factor-sites";

/** Locally-derived account-security signals feeding the privacy score. */
export interface AccountAuditSummary {
  /** Login items whose password is reused on another item. */
  reusedPasswordCount: number;
  /** Login items with a weak password (zxcvbn score at or below the weak threshold). */
  weakPasswordCount: number;
  /** Login items on a 2FA-capable site with no two-step login configured. */
  twoFactorGapCount: number;
}

/**
 * Reads account-security signals from the vault for the privacy score: reused passwords, weak
 * passwords, and 2FA gaps. All scoring runs on-device over already-decrypted cipher views — no vault
 * data leaves the client and nothing is logged.
 */
@Injectable({ providedIn: "root" })
export class AccountAuditService {
  private readonly accountService = inject(AccountService);
  private readonly cipherService = inject(CipherService);
  private readonly passwordStrengthService = inject(PasswordStrengthServiceAbstraction);

  private readonly twoFactorSites = new Set(TWO_FACTOR_SITES);

  /** Derives all account-security counts from the active user's login ciphers. */
  accountAudit$(): Observable<AccountAuditSummary> {
    return this.accountService.activeAccount$.pipe(
      getUserId,
      switchMap((userId) => this.cipherService.cipherViews$(userId)),
      map((ciphers) => this.summarize(ciphers)),
    );
  }

  private summarize(ciphers: CipherView[]): AccountAuditSummary {
    const logins = ciphers.filter(
      (cipher) =>
        cipher.type === CipherType.Login && cipher.deletedDate == null && cipher.login != null,
    );

    return {
      reusedPasswordCount: countReusedPasswords(logins.map((cipher) => cipher.login?.password)),
      weakPasswordCount: countWeakPasswords(logins.map((cipher) => this.passwordScore(cipher))),
      twoFactorGapCount: countTwoFactorGaps(
        logins.map((cipher) => this.twoFactorLogin(cipher)),
        this.twoFactorSites,
      ),
    };
  }

  /** zxcvbn score for a login's password, or undefined when there is no password. */
  private passwordScore(cipher: CipherView): number | undefined {
    const password = cipher.login?.password;
    if (password == null || password === "") {
      return undefined;
    }
    const userInputs = this.passwordUserInputs(cipher.login?.username);
    return this.passwordStrengthService.getPasswordStrength(
      password,
      undefined,
      userInputs.length > 0 ? userInputs : undefined,
    ).score;
  }

  /** Username-derived tokens fed to the strength estimator, mirroring the vault weak-password report. */
  private passwordUserInputs(username: string | undefined): string[] {
    if (username == null || username === "") {
      return [];
    }
    const atPosition = username.indexOf("@");
    const local = atPosition > -1 ? username.slice(0, atPosition) : username;
    return local
      .trim()
      .toLowerCase()
      .split(/[^A-Za-z0-9]/)
      .filter((part) => part.length >= 3);
  }

  private twoFactorLogin(cipher: CipherView): TwoFactorLogin {
    const domains = new Set<string>();
    for (const uri of cipher.login?.uris ?? []) {
      const domain = uri?.domain;
      if (domain != null && domain !== "") {
        domains.add(domain.toLowerCase());
      }
    }
    return { hasTotp: cipher.login?.hasTotp ?? false, domains: [...domains] };
  }
}
